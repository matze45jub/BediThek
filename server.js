const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://bedithek.onrender.com",
    methods: ["GET", "POST"]
  }
});

// Statische Dateien aus dem aktuellen Verzeichnis bereitstellen
app.use(express.static(__dirname));

// Route für die Hauptseite (Bedienung.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Bedienung.html'));
});

// Route für die Theke-Seite
app.get('/theke', (req, res) => {
  res.sendFile(path.join(__dirname, 'Theke.html'));
});





socket.on('neworder', (orderData) => {
  const orderList = document.getElementById('orderList');
  const orderItem = document.createElement('li');
  orderItem.innerHTML = `
    <strong>Tisch ${orderData.table}, Person ${orderData.person}</strong>
    <br>Bedienung: ${orderData.bedienung || 'Unbekannt'}
    <br>${Object.entries(orderData.order).map(([product, details]) => 
      `${product}: ${details.quantity}`
    ).join(', ')}
  `;
  orderList.appendChild(orderItem);
});

  });
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
