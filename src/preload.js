const {contextBridge, ipcRenderer} = require('electron');
const QRcode = require('qrcode');
// const {getDestination} = require('./index.js');

contextBridge.exposeInMainWorld('api', {
  ...require('./helper.js'),

  genrateQrcodeDataURL(text, options) {
    return QRcode.toDataURL(text, options);
  },

  getDest() {
    return ipcRenderer.invoke('get-destination-path');
  },

  openFolder(path) {
    ipcRenderer.send('open-folder', path);
  },

  changeDest() {
    return ipcRenderer.invoke('change-destination-path');
  },

  uploadProgress: {
    listenProgress(cb) {
      ipcRenderer.on('update-upload-progress', (a, b) => cb(a, b));
    },
  },

  invokeDownloadFileRequest(files) {
    ipcRenderer.send('invoke-download-files-request', files);
  },

  invokeDownloadFolderRequest(folder) {
    ipcRenderer.send('invoke-download-folder-request', folder);
  },

  openFolderSelectDialog() {
    return ipcRenderer.invoke('invoke-open-folder-dialog');
  },

  openFilesSelectDialog() {
    return ipcRenderer.invoke('open-select-files-dialog');
  },

  getServerAddressDataURL() {
    return new Promise((resovle) => {
      ipcRenderer.invoke('get-server-address').then(async (addr) => {
        const url = await QRcode.toDataURL(addr, {
          width: '400',
          height: '500',
          errorCorrectionLevel: 'H',
        });
        resovle({url, addr});
      });
    });
  },
});
