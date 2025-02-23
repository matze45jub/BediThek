const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://bedithek.onrender.com", "http://localhost:3000"], // Hier die erlaubten Ursprünge einfügen
    methods: ["GET", "POST"]
  }
});

// Statische Dateien aus dem aktuellen Verzeichnis bereitstellen
app.use(express.static(path.join(__dirname, 'public'))); // Falls du einen Unterordner 'public' hast

// Route für die Hauptseite (Bedienung.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Bedienung.html'));
});

// Route für die Theke-Seite
app.get('/theke', (req, res) => {
  res.sendFile(path.join(__dirname, 'Theke.html'));
});

// Socket.IO Logik
io.on('connection', (socket) => {
  console.log('Ein Client hat sich verbunden');

  // Empfang einer neuen Bestellung
  socket.on('neworder', (orderData) => {
    console.log('Neue Bestellung erhalten:', orderData);
    io.emit('neworder', orderData); // Sendet die Bestellung an alle verbundenen Clients
  });

  // Empfang der Bestellbestätigung (Bestellung bezahlt)
  socket.on('orderPaid', (orderData) => {
    console.log('Bestellung bezahlt:', orderData);
    io.emit('orderPaid', orderData); // Sendet an alle verbundenen Clients
  });

  // Fehlerbehandlung
  socket.on('error', (error) => {
    console.error('Socket.IO Fehler:', error);
  });

  // Wenn ein Client sich trennt
  socket.on('disconnect', () => {
    console.log('Ein Client hat sich getrennt');
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
