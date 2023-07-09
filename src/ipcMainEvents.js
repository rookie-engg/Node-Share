/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
const {ipcMain, dialog, shell} = require('electron');
const {getActivateSocket} = require('../server/socket.js');
const {setDestinationPath, getDestinationPathAsync} = require('./helper.js');

/**
 *
 * @param {import('electron').BrowserWindow} browserWindow
 */
function setIpcMainEvents(browserWindow) {
  ipcMain.on('invoke-download-files-request', (_ev, files) => {
    getActivateSocket()?.emit('invoke-download-files-request', files);
  });

  ipcMain.on('invoke-download-folder-request', (_ev, folder) => {
    getActivateSocket()?.emit('invoke-download-folder-request', folder);
  });

  ipcMain.handle('invoke-open-folder-dialog', async (_ev) => {
    const {canceled, filePaths} = await dialog.showOpenDialog(
        browserWindow,
        {
          properties: ['openDirectory'],
          title: 'select folders to send',
        });

    return canceled ? null : filePaths;
  });

  ipcMain.handle('get-destination-path', async (ev) => {
    return getDestinationPathAsync();
  });

  ipcMain.handle('change-destination-path', async (_ev) => {
    const {canceled, filePaths} = await dialog.showOpenDialog(
        browserWindow, {
          properties: ['openDirectory'],
          title: 'select destination folder',
        });

    if (canceled) return null;

    const path = filePaths[0];
    setDestinationPath(path);
    return path;
  });

  ipcMain.handle('open-select-files-dialog', async (_ev) => {
    const {canceled, filePaths} = await dialog.showOpenDialog(
        browserWindow, {
          properties: ['openFile', 'multiSelections'],
          title: 'slecte files to send',
        });

    return canceled ? null : filePaths;
  });

  ipcMain.on('update-upload-progress', (uploadedBytes, totalBytes) => {
    browserWindow.webContents.send('update-upload-progress', [uploadedBytes, totalBytes]);
  });

  ipcMain.on('open-folder', (ev, path) =>{
    if (!path) return;
    shell.showItemInFolder(path);
  });
};


module.exports = {setIpcMainEvents};
