const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Initialisiere Express und den Server
const app = express();
const server = http.createServer(app);
const io = socketIo(server); // ✅ Nur einmal definieren!

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

// ✅ WebSocket-Verbindung
io.on('connection', (socket) => {
  console.log('🔗 Ein Client hat sich verbunden');

  // Bestellung empfangen
  socket.on('sendOrder', (orderData) => {
    orderData.timestamp = Date.now(); // ✅ Zeitstempel hinzufügen
    console.log('📦 Bestellung erhalten:', orderData);
    io.emit('neworder', orderData); // ✅ Bestellung an alle Clients senden
  });

  // Bestellung als erledigt markieren
  socket.on('markOrderCompleted', (orderDetails) => {
    console.log('✅ Bestellung erledigt:', orderDetails);
    io.emit('orderCompleted', orderDetails);
  });

// Empfang von 'orderPaid' Event vom Bedienung
socket.on('orderPaid', (orderData) => {
  // Bestellung als bezahlt markieren
  console.log('Bestellung bezahlt:', orderData);

  // Sende an die Theke, dass die Bestellung bezahlt wurde
  io.emit('orderPaid', orderData); // Sende die Bestellung an alle verbundenen Clients (Theke)
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
