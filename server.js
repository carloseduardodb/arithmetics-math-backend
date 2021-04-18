const express = require("express");
let game_functions = require("./app/logic/games");
let room_functions = require("./app/logic/rooms");
let user_functions = require("./app/logic/user");
let variables = require("./app/global/variables");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  //Fala pra todo mundo as salas que existem
  socket.emit("rooms", variables.rooms);

  //recebe uma nova sala criada
  socket.on(`sendRoom`, (data) => {
    const room = room_functions.createRoom(data, socket.id);
    socket.emit("room", room);
    //Fala pra todo mundo as salas que existem
    socket.broadcast.emit("rooms", variables.rooms);
    socket.emit("rooms", variables.rooms);
  });

  //o usuário entra na sala
  socket.on("enterRoom", (data) => {
    variables.rooms.map((roomIndex) => {
      if (roomIndex.id === data.id) {
        //atualiza status da sala e emite para o dono
        roomIndex.room_client = socket.id;
        io.to(roomIndex.room_owner).emit("room", roomIndex);

        /**Crio o jogo da sala adicionando em um array */
        const accountInitial = game_functions.generateCalculation();
        const game = {
          room_id: roomIndex.id,
          operator: accountInitial.operator,
          first_value: accountInitial.first_value,
          last_value: accountInitial.last_value,
          point_client: 0,
          point_owner: 0,
          remaining_matches: 10,
        };
        const lastGameCreated = game_functions.createGame(game);
        /**end criação de sala */

        //envia para o dono da sala e para o adversário o estado do jogo
        io.to(roomIndex.room_owner).emit("game", lastGameCreated);
        io.to(socket.id).emit("game", lastGameCreated);
        //end
      }
    });
  });

  socket.on("play", (data) => {
    const hidratedDataResult = game_functions.hidratedResult(
      data.first_value,
      data.last_value,
      data.calcType
    );

    if (data.response == hidratedDataResult) {
      console.log(hidratedDataResult);
      //achando o usuário e mudando seu numero de pontos
      variables.rooms.map((room) => {
        if (room.room_owner === socket.id) {
          variables.games.map((game) => {
            if (game.room_id === room.id) {
              game_functions.playVerifyWinOrLoser(game, room, io);

              //about last value -> if client > false | if owner > true
              game_functions.generateNewRound(game, room, io, true);
            }
          });
        }
        if (room.room_client === socket.id) {
          variables.games.map((game) => {
            if (game.room_id === room.id) {
              game_functions.playVerifyWinOrLoser(game, room, io);

              //about last value -> if client > false | if owner > true
              game_functions.generateNewRound(game, room, io, false);
            }
          });
        }
      });
    }
  });

  //recebe o nome do usuário e os pontos
  socket.on("sendUser", (data) => {
    const user = user_functions.createUser(data.name, socket.id);
    userStatus = true;
    io.to(socket.id).emit("user_status", { status: true });
    io.to(socket.id).emit("user", user);
  });
});

server.listen(3001);
