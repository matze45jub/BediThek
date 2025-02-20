const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Statische Dateien aus dem 'public' Ordner bereitstellen
app.use(express.static('public'));

// Route für die Hauptseite (Bedienung.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Bedienung.html'));
});

// Route für die Theke-Seite
app.get('/theke', (req, res) => {
  res.sendFile(path.join(__dirname, 'Theke.html'));
});

// Socket.IO Verbindungshandling
io.on('connection', (socket) => {
  console.log('Ein Client hat sich verbunden');

  socket.on('neworder', (orderData) => {
    console.log('Neue Bestellung erhalten:', orderData);
    io.emit('newOrder', orderData);
  });

  socket.on('disconnect', () => {
    console.log('Ein Client hat sich getrennt');
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
