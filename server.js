const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

let allOrders = {};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/bedienung');
});

app.get('/bedienung', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Bedienung.html'));
});

app.get('/theke', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Theke.html'));
});

function updateBestellungStatus(data, status) {
  console.log(`Bestellung für Reihe ${data.row}, Tisch ${data.table}, Person ${data.person} Status aktualisiert auf: ${status}`);
}

function getOrdersForPerson(row, table, person) {
  return allOrders[row]?.[table]?.[person] || [];
}

io.on('connection', (socket) => {
  console.log('🔗 Ein Client hat sich verbunden');

  socket.on('requestInitialData', () => {
    socket.emit('initialData', allOrders);
  });

  socket.on('sendOrder', (orderData) => {
    orderData.timestamp = Date.now();
    console.log('📦 Bestellung erhalten:', orderData);
    
    const { row, table, person, order } = orderData;
    if (!allOrders[row]) allOrders[row] = {};
    if (!allOrders[row][table]) allOrders[row][table] = {};
    allOrders[row][table][person] = order;

    io.emit('newOrder', orderData);
    io.emit('orderUpdate', allOrders);
  });

  socket.on('updateOrders', (updatedTables) => {
    allOrders = updatedTables;
    io.emit('orderUpdate', allOrders);
  });

  socket.on('markOrderCompleted', (orderDetails) => {
    console.log('✅ Bestellung erledigt:', orderDetails);
    io.emit('orderCompleted', orderDetails);
  });

  socket.on('bestellungAusgegeben', (data) => {
    updateBestellungStatus(data, 'ausgegeben');
    io.emit('bestellungStatusUpdate', { id: data.id, status: 'ausgegeben' });
  });

  socket.on('bestellungBezahlt', (data) => {
    updateBestellungStatus(data, 'bezahlt');
    io.emit('bestellungStatusUpdate', { 
      status: 'bezahlt', 
      row: data.row, 
      table: data.table, 
      person: data.person
    });
  });

  socket.on('orderPaid', (orderData) => {
    console.log('Bestellung bezahlt:', orderData);
    io.emit('orderPaid', orderData);
    
    const { row, table, person } = orderData;
    if (allOrders[row]?.[table]?.[person]) {
      delete allOrders[row][table][person];
      io.emit('orderUpdate', allOrders);
    }
  });

  socket.on('getPersonOrders', (data) => {
    const personOrders = getOrdersForPerson(data.row, data.table, data.person);
    socket.emit('personOrders', personOrders);
  });

  socket.on('disconnect', () => {
    console.log('⚠️ Ein Benutzer hat die Verbindung getrennt.');
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
