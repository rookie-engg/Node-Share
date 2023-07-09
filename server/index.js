const {app} = require('./app.js');
const {io} = require('./socket.js');

module.exports = {
  initServer() {
    return new Promise((resolve) => {
      const httpServer = app.listen(8080, () => {
        io.listen(httpServer);
        const addr = httpServer.address();
        resolve(addr.port);
      });
    });
  },
};
