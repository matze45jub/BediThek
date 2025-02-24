const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Initialisiere Express und den Server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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

// Socket.io-Setup
io.on('connection', (socket) => {
  console.log('Ein Benutzer ist verbunden.');

  // Wenn eine neue Bestellung gesendet wird
  socket.on('neworder', (orderData) => {
    console.log('Neue Bestellung erhalten:', orderData);
    // Sende die Bestellung an alle verbundenen Clients (z.B. Thekenseite)
    io.emit('neworder', orderData);
  });

  // Wenn eine Bestellung als erledigt markiert wird
  socket.on('markOrderCompleted', (orderDetails) => {
    console.log('Bestellung erledigt:', orderDetails);
    io.emit('orderCompleted', orderDetails);
  });

  // Wenn eine Bestellung als bezahlt markiert wird
  socket.on('orderPaid', (orderDetails) => {
    console.log('Bestellung bezahlt:', orderDetails);
    io.emit('orderPaid', orderDetails);
  });

  // Wenn der Benutzer die Verbindung trennt
  socket.on('disconnect', () => {
    console.log('Ein Benutzer hat die Verbindung getrennt.');
  });
});

// Server starten und auf Anfragen hören
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
