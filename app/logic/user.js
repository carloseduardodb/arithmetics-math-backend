let variables = require("./../global/variables");

/** Cria um novo usuario */
function createUser(data, id) {
  const user_data = {
    user: {
      id: id,
      name: data,
      points: 0,
    },
  };
  variables.users.push(user_data);
  return user_data;
}
