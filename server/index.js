const {app} = require('./app.js');
const {io} = require('./socket.js');
const fp = require('find-free-port');

module.exports = {
  initServer() {
    return new Promise((resolve) => {
      fp(8000).then(([port]) => {
        const httpServer = app.listen(port, '0.0.0.0', () => {
          io.listen(httpServer);
          const addr = httpServer.address();
          resolve(addr.port);
        });
      }).catch(() => {
        const httpServer = app.listen(() => {
          io.listen(httpServer);
          const addr = httpServer.address();
          resolve(addr.port);
        });
      });
    });
  },
};
