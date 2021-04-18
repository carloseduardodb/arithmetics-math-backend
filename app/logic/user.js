const io = require("./../services/socket");

//recebe o nome do usuário e os pontos
socket.on("sendUser", (data) => {
  const user = createUser(data.name, socket.id);
  userStatus = true;
  io.to(socket.id).emit("user_status", { status: true });
  io.to(socket.id).emit("user", user);
});
