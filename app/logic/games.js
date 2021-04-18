const { randomInt } = require("crypto");
let variables = require("./../global/variables");

/** Cria um novo jogo */
exports.createGame = (data) => {
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
  variables.games.push(game);
  return game;
};

/**Gera o calculo que é enviado para o cliente */
exports.generateCalculation = () => {
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
};

/**Faz a conta do resultado */
exports.hidratedResult = (first_value, last_value, calcType) => {
  switch (calcType) {
    case "sum":
      return Number(first_value) + Number(last_value);
    case "subtraction":
      return Number(first_value) - Number(last_value);
    default:
      console.log("erro");
      break;
  }
};

//** Verifica s eo usuário ganhou ou perdeu */
exports.playVerifyWinOrLoser = (game, room, io) => {
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
};

/** gera uma nova partida e aumenta o ponto do usuário caso ele ganhe */
exports.generateNewRound = (game, room, io, owner) => {
  const generate = this.generateCalculation();
  game.first_value = generate.first_value;
  game.last_value = generate.last_value;
  game.operator = generate.operator;
  game.remaining_matches--;
  owner ? game.point_owner++ : game.point_client++;
  io.to(room.room_owner).emit("game", game);
  io.to(room.room_client).emit("game", game);
};
