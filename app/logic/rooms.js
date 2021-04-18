let variables = require("../global/variables");

/** Cria uma nova sala */
exports.createRoom = (data, id) => {
  const room = {
    id: Date.now().toString(),
    name: data.name,
    room_owner: id,
    room_client: "",
    number_players: 1,
  };
  variables.rooms.push(room);
  return room;
};
