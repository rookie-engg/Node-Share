const {Server} = require('socket.io');

const io = new Server();

/**
 * @type {Socket | null}
 */
let activateSocket = null;

io.on('connection', (socket) => {
  if (activateSocket) {
    activateSocket.disconnect(true);
  }

  activateSocket = socket;
});

/**
 * returns currently active socket
 * @return {Socket | null}
 */
function getActivateSocket() {
  return activateSocket;
}

module.exports = {io, getActivateSocket};
