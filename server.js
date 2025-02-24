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
  res.sendFile(path.join(__dirname, 'public', 'Bedienung.html'));
});

app.get('/Theke', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Theke.html'));
});

// Globales Objekt zur Speicherung aller Bestellungen
let globalOrders = {};

io.on('connection', (socket) => {
  console.log('Ein Client hat sich verbunden');

  // Sende aktuelle Bestellungen an den neu verbundenen Client
  socket.on('requestInitialData', () => {
    socket.emit('initialOrders', globalOrders);
  });

  socket.on('syncOrders', (clientOrders) => {
    if (typeof clientOrders === 'object' && clientOrders !== null) {
      globalOrders = clientOrders;
      io.emit('updateOrders', globalOrders);
    } else {
      console.error('Fehler: Ungültige Bestellungen empfangen');
    }
  });

  socket.on('updateOrder', ({ table, person, product }) => {
    if (!table || !person || !product || typeof product !== 'object') {
      console.error('Fehler: Ungültige Bestelldaten erhalten');
      return;
    }

    const orderId = `${table}-${person}`;
    if (!globalOrders[orderId]) {
      globalOrders[orderId] = { items: [] };
    }

    const existingProductIndex = globalOrders[orderId].items.findIndex(item => item.name === product.name);
    if (existingProductIndex !== -1) {
      globalOrders[orderId].items[existingProductIndex] = product;
    } else {
      globalOrders[orderId].items.push(product);
    }

    io.emit('updateOrders', globalOrders);
  });

  socket.on('neworder', (orderData) => {
    if (!orderData || !orderData.row || !orderData.table || !orderData.person || !Array.isArray(orderData.order)) {
      console.error('Fehler: Ungültige Bestelldaten erhalten');
      return;
    }

    const orderId = `${orderData.row}-${orderData.table}-${orderData.person}`;
    if (!globalOrders[orderId]) {
      globalOrders[orderId] = { items: [], bedienung: orderData.bedienung };
    }

    globalOrders[orderId].items.push(...orderData.order);

    io.emit('updateOrders', globalOrders);
  });

  socket.on('orderPaid', (paymentData) => {
    if (!paymentData || !paymentData.row || !paymentData.table || !paymentData.person) {
      console.error('Fehler: Ungültige Zahlungsdaten erhalten');
      return;
    }

    const orderId = `${paymentData.row}-${paymentData.table}-${paymentData.person}`;
    if (globalOrders[orderId]) {
      delete globalOrders[orderId];
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
