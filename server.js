const express = require("express");
let game_functions = require("./app/logic/games");
let room_functions = require("./app/logic/rooms");
let variables = require("./app/global/variables");
const socketIO = require("socket.io");

const PORT = process.env.PORT || 3000;
const INDEX = "/index.html";

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

io.on("connection", (socket) => {
  socket.on("getRooms", () => {
    //Fala pra todo mundo as salas que existem
    socket.emit("rooms", variables.rooms);
  });

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

  //recebe a batalha
  socket.on("createUser", (data) => {
    game_functions.createUser(data, socket);
    const battle_name = "battle-" + socket.id;
    io.to(socket.id).emit(battle_name, { status: true });
    socket.emit("battles", variables.battles);
  });

  //recebe a batalha
  socket.on("createBattle", (data) => {
    game_functions.createBattle(data, socket);
    const battle_name = "battle-" + socket.id;
    io.to(socket.id).emit(battle_name, { status: true });
    socket.emit("battles", variables.battles);
  });

  socket.on("getBattle", () => {
    socket.emit("battle", variables.battles);
  });

  socket.on("getRanking", () => {
    let ranking = [];
    variables.users.map((unique_user) => {
      ranking.push({
        name: unique_user.user.name,
        points: unique_user.user.points,
      });
    });
    socket.emit("ranking", ranking);
  });

  //recebe a batalha
  socket.on("playBattle", (data) => {
    const hidratedDataResult = game_functions.hidratedResult(
      data.first_value,
      data.last_value,
      data.calcType
    );
    if (data.response == hidratedDataResult) {
      variables.users.map((unique_user) => {
        if (unique_user.user.id_client === socket.id) {
          unique_user.user.points++;
          game_functions.updateBattle(socket);
        }
      });
    }
    socket.emit("battle", variables.battles);
  });

  socket.on("disconnect", () => console.log("Client disconnected"));
});

setInterval(() => io.emit("time", new Date().toTimeString()), 1000);
