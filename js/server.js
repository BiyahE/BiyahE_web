const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the SAME folder as server.js (parent of js/)
app.use(express.static(path.join(__dirname, '..')));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("✅ Browser client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Browser client disconnected:", socket.id);
  });
});

// ESP32 endpoint - receives scans from Arduino
app.post("/scan", (req, res) => {
  const { type, value } = req.body;

  if (!type || !value) {
    return res.status(400).json({ error: "Invalid data" });
  }

  console.log("📡 SCAN received:", type, "→", value);

  // Broadcast to all connected browsers via Socket.IO
  io.emit("scan", {
    type: type,
    value: value
  });

  res.sendStatus(200);
});

// Start server
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://0.0.0.0:${PORT}`);
  console.log(`   Your IP: http://127.0.0.1:5500/:${PORT}`);
});