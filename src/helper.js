/* eslint-disable require-jsdoc */
const {networkInterfaces} = require('node:os');
const wifi = require('node-wifi');
const settings = require('electron-settings');

wifi.init({
  iface: null,
});

/**
 * returns IPv4 Address if Wifi Interface is
 * Avalibale or empty array
 * @return {Promise<string[]>}
*/
async function getWifiInterfaceIPv4Address() {
  const interfaces = networkInterfaces();
  const currentConnections = await wifi.getCurrentConnections();

  const connectedInterfaceInfo =
    interfaces[currentConnections[0].iface]
        ?.find((info) => info.family === 'IPv4');

  if (connectedInterfaceInfo) {
    return connectedInterfaceInfo.address;
  } else {
    return null;
  }
}

/**
 * returns true if Wi-Fi interface is
 * connected else return false
 * @return {Promise<boolean>}
*/
async function isConnectedToWiFi() {
  return new Promise((resolve) => {
    wifi.getCurrentConnections((error, currentConnections) => {
      if (error) {
        resolve(false);
      } else {
        if (currentConnections.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

// const destination = settings.getSync('destnationPath');

function setDestinationPath(dest) {
  settings.setSync('destinationPath', dest);
}

function getDestinationPath() {
  return settings.getSync('destinationPath');
}

function getDestinationPathAsync() {
  return settings.get('destinationPath');
}

module.exports = {
  getWifiInterfaceIPv4Address,
  isConnectedToWiFi,
  setDestinationPath,
  getDestinationPath,
  getDestinationPathAsync,
};
