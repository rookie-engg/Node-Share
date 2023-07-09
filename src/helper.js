/* eslint-disable require-jsdoc */
const {networkInterfaces} = require('node:os');
const settings = require('electron-settings');

/**
 * returns IPv4 Address if Wifi Interface is
 * Avalibale or empty array
 * @return {string[]}
*/
function getWifiInterfaceIPv4Address() {
  const interfaces = networkInterfaces();

  // if wi-fi interface is not found return null
  if (!('Wi-Fi' in interfaces)) return [];

  return interfaces['Wi-Fi']
      .filter((addressObject) => {
        return (addressObject.family === 'IPv4' &&
        !addressObject.internal) ? true : false;
      })
      .map((addressObject) => addressObject.address);
}

/**
 * returns true if Wi-Fi interface is
 * connected else return false
 * @return {boolean}
*/
function isConnectedToWiFi() {
  return 'Wi-Fi' in networkInterfaces() ? true : false;
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
