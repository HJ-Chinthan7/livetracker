const express = require("express");
const socketio = require('socket.io');
const http = require("http");
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

io.on("connection", function(socket) {
    socket.on("send-Location", function(data) {
        io.emit("receive-location", { id: socket.id, ...data });
    });
    socket.on("disconnect", function(data) {
        io.emit("user-disconnected", socket.id);
    });
});

server.listen(3001, () => {
    console.log("Connected to the server");
});
