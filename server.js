const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');


// Initialisiere Express und den Server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);



function updateBestellungStatus(data, status) {
  console.log(`Bestellung für Reihe ${data.row}, Tisch ${data.table}, Person ${data.person} Status aktualisiert auf: ${status}`);
  // Hier können Sie weitere Logik zur Aktualisierung des Status implementieren
}



// Globaler Speicher für alle Bestellungen
let allOrders = {};



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
    

  // Anfrage für initiale Daten
  socket.on('requestInitialData', () => {
    socket.emit('initialData', allOrders);
  });
    
    
      // Senden Sie die initialen Daten, wenn ein Client sich verbindet
  socket.emit('initialData', allOrders);
    

    // Bestellung zum Gesamtspeicher hinzufügen
    const { row, table, person, order } = orderData;
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
  updateBestellungStatus(data.id, 'ausgegeben'); // Datenbank aktualisieren
  io.emit('bestellungStatusUpdate', { id: data.id, status: 'ausgegeben' }); // Benachrichtigung senden
});

    
 // Bestellung als bezahlt markieren
  socket.on('orderPaid', (orderData) => {
    console.log('💰 Bestellung bezahlt:', orderData);
    const { row, table, person } = orderData;
    if (allOrders[row] && allOrders[row][table] && allOrders[row][table][person]) {
      allOrders[row][table][person].status = 'paid';
    }
    io.emit('orderPaid', orderData);
    io.emit('orderUpdate', allOrders);
  });


  
  // Benachrichtigen Sie alle Clients
  io.emit('bestellungStatusUpdate', { 
    status: 'bezahlt', 
    row: data.row, 
    table: data.table, 
    person: data.person  // Hier wird die Person-Nummer direkt verwendet (1-6)
  });
});


socket.on('requestInitialData', () => {
  console.log('Client fordert initiale Daten an');
  socket.emit('initialData', allOrders);
});


    

  // Empfang von 'orderPaid' Event
  socket.on('orderPaid', (orderData) => {
    console.log('Bestellung bezahlt:', orderData);
    io.emit('orderPaid', orderData);
    
    // Entferne die bezahlte Bestellung aus allOrders
    const { row, table, person } = orderData;
    if (allOrders[row] && allOrders[row][table] && allOrders[row][table][person]) {
      delete allOrders[row][table][person];
      io.emit('orderUpdate', allOrders);
    }
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
