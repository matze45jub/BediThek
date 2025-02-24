const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path'); 

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, 'public')));

// Route für den Wurzelpfad hinzufügen - Umleitung zur Bedienungsseite
app.get('/', (req, res) => {
  res.redirect('/bedienung');
});

app.get('/bedienung', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'bedienung.html'));
});


app.get('/theke', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'theke.html'));
});

// Globales Objekt zur Speicherung aller Bestellungen
let globalOrders = {};

io.on('connection', (socket) => {
  console.log('Ein Client hat sich verbunden');

  // Sende aktuelle Bestellungen an den neu verbundenen Client
  socket.emit('initialOrders', globalOrders);

  socket.on('updateAllClients', (updatedOrders) => {
    globalOrders = updatedOrders;
    // Sende das Update an alle Clients außer dem Sender
    socket.broadcast.emit('updateOrders', globalOrders);
  });

  socket.on('neworder', (orderData) => {
    // Verarbeite die neue Bestellung
    const orderId = `${orderData.row}-${orderData.table}-${orderData.person}`;
    if (!globalOrders[orderId]) {
      globalOrders[orderId] = { items: [], bedienung: orderData.bedienung };
    }
    globalOrders[orderId].items.push(...Object.values(orderData.order));

    // Sende das Update an alle Clients
    io.emit('updateOrders', globalOrders);
  });

  socket.on('orderPaid', (paymentData) => {
    // Verarbeite die Zahlungsinformation
    const orderId = `${paymentData.row}-${paymentData.table}-${paymentData.person}`;
    if (globalOrders[orderId]) {
      delete globalOrders[orderId];
      // Sende das Update an alle Clients
      io.emit('updateOrders', globalOrders);
    }
  });

  socket.on('disconnect', () => {
    console.log('Ein Client hat sich getrennt');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
