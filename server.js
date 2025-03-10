const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Initialisiere Express und den Server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Speicher für alle Bestellungen
let allOrders = {};

// Funktion zur Aktualisierung des Bestellstatus
function updateBestellungStatus(data, status) {
  console.log(`Bestellung für Reihe ${data.row}, Tisch ${data.table}, Person ${data.person} Status aktualisiert auf: ${status}`);
  // Hier könnte eine Datenbankaktualisierung erfolgen
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

  // Sende initiale Daten an den neuen Client
  socket.emit('initialData', allOrders);

  // Bestellung empfangen
  socket.on('sendOrder', (orderData) => {
    orderData.timestamp = Date.now();
    console.log('📦 Bestellung erhalten:', orderData);

    // Bestellung zum Gesamtspeicher hinzufügen
    const { row, table, person, order, bedienung } = orderData;
    if (!allOrders[row]) allOrders[row] = {};
    if (!allOrders[row][table]) allOrders[row][table] = {};
    allOrders[row][table][person] = { order, bedienung, timestamp: orderData.timestamp };

    // Sende die neue Bestellung an alle verbundenen Clients
    io.emit('newOrder', orderData);
    io.emit('orderUpdate', allOrders);
  });

  // Aktualisierte Bestellungen empfangen und broadcasten
  socket.on('updateOrders', (updatedTables) => {
    allOrders = updatedTables;
    io.emit('orderUpdate', allOrders);
  });

  // Bestellung als erledigt markieren
  socket.on('markOrderCompleted', (orderDetails) => {
    console.log('✅ Bestellung erledigt:', orderDetails);
    updateBestellungStatus(orderDetails, 'erledigt');
    io.emit('orderCompleted', orderDetails);
  });

  // Status "ausgegeben" für eine Bestellung setzen
  socket.on('bestellungAusgegeben', (data) => {
    updateBestellungStatus(data, 'ausgegeben');
    io.emit('bestellungStatusUpdate', { ...data, status: 'ausgegeben' });
  });

  // Status "bezahlt" für eine Bestellung setzen
  socket.on('bestellungBezahlt', (data) => {
    updateBestellungStatus(data, 'bezahlt');
    io.emit('bestellungStatusUpdate', { ...data, status: 'bezahlt' });
  });

  // Empfang von "orderPaid" Event und Entfernen der bezahlten Bestellung
  socket.on('orderPaid', (orderData) => {
    console.log('Bestellung bezahlt:', orderData);

    const { row, table, person } = orderData;
    if (allOrders[row] && allOrders[row][table] && allOrders[row][table][person]) {
      delete allOrders[row][table][person];
      io.emit('orderUpdate', allOrders); // Aktualisierte Bestellungen senden
    }
    
    io.emit('orderPaid', orderData); // Benachrichtigen Sie alle Clients über die Zahlung
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
