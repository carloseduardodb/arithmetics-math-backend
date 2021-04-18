const io = require("./../services/socket");

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
