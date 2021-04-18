const express = require("express");

const app = express();
const server = require("http").createServer(app);
export const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
