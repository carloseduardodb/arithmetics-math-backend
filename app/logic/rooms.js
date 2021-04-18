const io = require("./../services/socket");

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
});

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
