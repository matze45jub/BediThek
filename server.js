const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Speicher für alle Bestellungen
let allOrders = {};

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, 'public')));

// Routen
app.get('/', (req, res) => res.redirect('/bedienung'));
app.get('/bedienung', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Bedienung.html')));
app.get('/theke', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Theke.html')));

// Hilfsfunktion zum Aktualisieren des Bestellungsstatus
function updateBestellungStatus(data, status) {
  console.log(`Bestellung für Reihe ${data.row}, Tisch ${data.table}, Person ${data.person} Status aktualisiert auf: ${status}`);
  // Hier können Sie weitere Logik zur Aktualisierung des Status implementieren
}

// WebSocket-Verbindung
io.on('connection', (socket) => {
  console.log('🔗 Ein Client hat sich verbunden');

  socket.on('requestInitialData', () => socket.emit('initialData', allOrders));

  socket.on('sendOrder', (orderData) => {
    orderData.timestamp = Date.now();
    console.log('📦 Bestellung erhalten:', orderData);
    
    const { row, table, person, order } = orderData;
    if (!allOrders[row]) allOrders[row] = {};
    if (!allOrders[row][table]) allOrders[row][table] = {};
    allOrders[row][table][person] = order;

    // Speichern Sie die Bestellung in der Datenbank (falls vorhanden)
    // Beispiel: saveOrderToDatabase(orderData);

    // Senden Sie die aktualisierte Bestellung an alle verbundenen Clients
    io.emit('orderUpdate', allOrders);
  });
    
    
    io.emit('neworder', {
  row: orderData.row,
  table: orderData.table,
  person: orderData.person,
  timestamp: Date.now(),
  bedienung: orderData.bedienung || 'Unbekannt',
  order: orderData.order
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

  socket.on('disconnect', () => console.log('⚠️ Ein Benutzer hat die Verbindung getrennt.'));
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));

// Fehlerbehandlung
server.on('error', (error) => console.error('Server error:', error));
