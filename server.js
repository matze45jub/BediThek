const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Initialisiere Express und den Server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Globaler Speicher für alle Bestellungen
let allOrders = {};

function updateBestellungStatus(data, status) {
  console.log(`Bestellung für Reihe ${data.row}, Tisch ${data.table}, Person ${data.person} Status aktualisiert auf: ${status}`);
  // Hier können Sie weitere Logik zur Aktualisierung des Status implementieren
}

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, 'public')));

// Route für den Wurzelpfad hinzufügen - Umleitung zur Bedienungsseite
app.get('/', (req, res) => {
  res.redirect('/bedienung');
});

// Route für die Bedienungsseite
app.get('/bedienung', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Bedienung.html'));
});

// Route für die Theken-Seite
app.get('/theke', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Theke.html'));
});

// WebSocket-Verbindung
io.on('connection', (socket) => {
  console.log('🔗 Ein Client hat sich verbunden');

  // Senden Sie die initialen Daten, wenn ein Client sich verbindet
  socket.emit('initialData', allOrders);

  // Anfrage für initiale Daten
  socket.on('requestInitialData', () => {
    console.log('Client fordert initiale Daten an');
    socket.emit('initialData', allOrders);
  });

  // Neue Bestellung empfangen
  socket.on('sendOrder', (orderData) => {
    console.log('Neue Bestellung empfangen:', orderData);
    const { row, table, person } = orderData;
    if (!allOrders[row]) allOrders[row] = {};
    if (!allOrders[row][table]) allOrders[row][table] = {};
    allOrders[row][table][person] = orderData;

    // Senden Sie die neue Bestellung an alle Clients
    io.emit('neworder', orderData);
    // Aktualisieren Sie alle Clients mit den neuesten Daten
    io.emit('orderUpdate', allOrders);
  });

  // Bestellung als erledigt markieren
  socket.on('markOrderCompleted', (orderDetails) => {
    console.log('✅ Bestellung erledigt:', orderDetails);
    const { row, table, person } = orderDetails;
    if (allOrders[row] && allOrders[row][table] && allOrders[row][table][person]) {
      allOrders[row][table][person].status = 'completed';
    }
    io.emit('orderCompleted', orderDetails);
    io.emit('orderUpdate', allOrders);
  });

  socket.on('bestellungAusgegeben', function(data) {
    updateBestellungStatus(data, 'ausgegeben'); // Datenbank aktualisieren
    io.emit('bestellungStatusUpdate', { id: data.id, status: 'ausgegeben' }); // Benachrichtigung senden
  });

  // Bestellung als bezahlt markieren
  socket.on('orderPaid', (orderData) => {
    console.log('💰 Bestellung bezahlt:', orderData);
    const { row, table, person } = orderData;
    if (allOrders[row] && allOrders[row][table] && allOrders[row][table][person]) {
      allOrders[row][table][person].status = 'paid';
      // Benachrichtigen Sie alle Clients
      io.emit('bestellungStatusUpdate', { 
        status: 'bezahlt', 
        row: row, 
        table: table, 
        person: person
      });
      // Entferne die bezahlte Bestellung aus allOrders
      delete allOrders[row][table][person];
      io.emit('orderUpdate', allOrders);
    }
    io.emit('orderPaid', orderData);
  });

  // Benutzer trennt Verbindung
  socket.on('disconnect', () => {
    console.log('⚠️ Ein Benutzer hat die Verbindung getrennt.');
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
