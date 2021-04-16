const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let messages = [];

io.on("connect", (socket) => {
  console.log(`Socket conectado ${socket.id}`);
});

server.listen(3001);
