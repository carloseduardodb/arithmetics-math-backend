const { randomInt } = require("crypto");
const express = require("express");
const path = require("path");
const { emit } = require("process");

const app = express();
var userStatus = false;
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let games = [];

let rooms = [];

let users = [];

io.on("connection", (socket) => {
  //Fala pra todo mundo as salas que existem
  socket.emit("rooms", rooms);

  //recebe uma nova sala criada
  socket.on(`sendRoom`, (data) => {
    const room = createRoom(data, socket.id);
    socket.emit("room", room);
    //Fala pra todo mundo as salas que existem
    socket.broadcast.emit("rooms", rooms);
    socket.emit("rooms", rooms);
  });

  //o usuário entra na sala
  socket.on("enterRoom", (data) => {
    rooms.map((roomIndex) => {
      if (roomIndex.id === data.id) {
        //atualiza status da sala e emite para o dono
        roomIndex.room_client = socket.id;
        io.to(roomIndex.room_owner).emit("room", roomIndex);

        /**Crio o jogo da sala adicionando em um array */
        const accountInitial = generateCalculation();
        const game = {
          room_id: roomIndex.id,
          operator: accountInitial.operator,
          first_value: accountInitial.first_value,
          last_value: accountInitial.last_value,
          point_client: 0,
          point_owner: 0,
          remaining_matches: 10,
        };
        const lastGameCreated = createGame(game);
        /**end criação de sala */

        //envia para o dono da sala e para o adversário o estado do jogo
        io.to(roomIndex.room_owner).emit("game", lastGameCreated);
        io.to(socket.id).emit("game", lastGameCreated);
        //end
      }
    });
  });

  socket.on("play", (data) => {
    /** input que o usuário me enviou | conferir com a conta atual mandada ||
     * se o usuário acertou vou atualizar a questão com uma nova e
     * adicionar um ponto pra essa usuário se ele
     * errou eu mando que esta errado e mantenho a questão
     */
    const hidratedDataResult = hidratedResult(
      data.first_value,
      data.last_value,
      data.calcType
    );

    if (data.response == hidratedDataResult) {
      console.log(hidratedDataResult);
      //achando o usuário e mudando seu numero de pontos
      rooms.map((room) => {
        if (room.room_owner === socket.id) {
          games.map((game) => {
            if (game.room_id === room.id) {
              if (game.remaining_matches == 1) {
                //disparar evento para finalizar o jogo se o dono da sala ganhar ou o client
                if (game.point_owner > game.point_client) {
                  io.to(room.room_owner).emit("status", { game: "win" });
                  io.to(room.room_client).emit("status", { game: "loser" });
                } else {
                  io.to(room.room_owner).emit("status", { game: "loser" });
                  io.to(room.room_client).emit("status", { game: "win" });
                }
              }
              const generate = generateCalculation();
              game.first_value = generate.first_value;
              game.last_value = generate.last_value;
              game.operator = generate.operator;
              game.remaining_matches--;
              game.point_owner++;
              io.to(room.room_owner).emit("game", game);
              io.to(room.room_client).emit("game", game);
            }
          });
        }
        if (room.room_client === socket.id) {
          games.map((game) => {
            if (game.room_id === room.id) {
              if (game.remaining_matches == 1) {
                //disparar evento para finalizar o jogo se o dono da sala ganhar ou o client
                if (game.point_owner > game.point_client) {
                  io.to(room.room_owner).emit("status", { game: "win" });
                  io.to(room.room_client).emit("status", { game: "loser" });
                } else {
                  io.to(room.room_owner).emit("status", { game: "loser" });
                  io.to(room.room_client).emit("status", { game: "win" });
                }
              }
              const generate = generateCalculation();
              game.first_value = generate.first_value;
              game.last_value = generate.last_value;
              game.operator = generate.operator;
              game.remaining_matches--;
              game.point_client++;
              io.to(room.room_owner).emit("game", game);
              io.to(room.room_client).emit("game", game);
            }
          });
        }
      });
    }
  });

  //recebe o nome do usuário e os pontos
  socket.on("sendUser", (data) => {
    const user = createUser(data.name, socket.id);
    userStatus = true;
    io.to(socket.id).emit("user_status", { status: true });
    io.to(socket.id).emit("user", user);
  });
});

/** Cria um novo usuario */
function createUser(data, id) {
  const user_data = {
    user: {
      id: id,
      name: data,
      points: 0,
    },
  };
  users.push(user_data);
  return user_data;
}

/** Cria uma nova sala */
function createRoom(data, id) {
  const room = {
    id: Date.now().toString(),
    name: data.name,
    room_owner: id,
    room_client: "",
    number_players: 1,
  };
  rooms.push(room);
  return room;
}

/** Cria um novo jogo */
function createGame(data) {
  const game = {
    room_id: data.room_id,
    operator: data.operator,
    first_value: data.first_value,
    last_value: data.last_value,
    remaining_matches: 10,
    point_client: data.point_client,
    point_owner: data.point_owner,
  };
  console.log(game);
  games.push(game);
  return game;
}

function generateCalculation() {
  const numberFirst = randomInt(0, 10);
  const numberLast = randomInt(0, 10);
  const testing = randomInt(0, 10);
  const calcType = testing >= 5 ? 1 : 2;
  switch (calcType) {
    case 1:
      return {
        operator: "sum",
        first_value: numberFirst,
        last_value: numberLast,
      };
    case 2:
      return {
        operator: "subtraction",
        first_value: numberFirst,
        last_value: numberLast,
      };
    default:
      console.log("erro");
      break;
  }
}

function hidratedResult(first_value, last_value, calcType) {
  switch (calcType) {
    case "sum":
      return Number(first_value) + Number(last_value);
    case "subtraction":
      return Number(first_value) - Number(last_value);
    default:
      console.log("erro");
      break;
  }
}

server.listen(3001);
