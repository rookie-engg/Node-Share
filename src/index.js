const {app, BrowserWindow, ipcMain, dialog, screen, Menu,
  nativeImage} = require('electron');

const path = require('path');
const {initServer} = require('../server/index.js');
const {
  getWifiInterfaceIPv4Address,
  isConnectedToWiFi,
  setDestinationPath,
  getDestinationPath,
} = require('./helper.js');
const {setIpcMainEvents} = require('./ipcMainEvents.js');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}


const createWindow = async () => {
  const {width} = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 512;
  const windowHeight = 764;
  const paddingX = 20;
  const paddingY = 60;
  const windowX = (width - windowWidth - paddingX) > 0 ?
    width - windowWidth - paddingX : 0;
  const windowY = 0 + paddingY;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: true,
    width: windowWidth,
    height: windowHeight,
    x: windowX,
    y: windowY,
    // fullscreen: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // mainWindow.webContents.openDevTools();

  const address = getWifiInterfaceIPv4Address();
  // mainWindow.hide();

  const port = await initServer();

  if (typeof port === 'number') {
    address.forEach((a) => {
      console.log(`Server on http://${a}:${port}`);
    });

    ipcMain.handle('get-server-address', (_ev) => {
      return `http://${address[0]}:${port}`;
    });
  }

  if (typeof port === 'string') {
    console.log('server on ', port);
  }

  const menu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(menu);

  mainWindow.setIcon(
      nativeImage.createFromPath(
          path.join(__dirname, '../resources/img/favicon.png'),
      ),
  );

  setIpcMainEvents(mainWindow);
  return mainWindow;
};

// eslint-disable-next-line require-jsdoc
function check() {
  if (!isConnectedToWiFi()) {
    dialog.showErrorBox('Wi-Fi Error',
        'Please connect to a hotspot or wifi network');
    return false;
  }

  try {
    if (!getDestinationPath()) {
      setDestinationPath(app.getPath('downloads'));
    }
    return true;
  } catch {
    while (true) {
      const path = dialog.showOpenDialogSync(null, {
        title: 'Select Destination path',
        message: 'select a folder for receving files',
        properties: ['openDirectory'],
      });

      if (path) {
        setDestinationPath(path.at(0));
        return true;
      }

      const res = dialog.showMessageBoxSync(null, {
        title: 'destination path not selected',
        message: `destination path is required for storing files. Retry?`,
        buttons: ['Quit', 'Retry'],
      });

      if (res === 1) {
        continue;
      }

      return false;
    };
  }
};

app.on('ready', async () => {
  if (check()) {
    const mainWindow = await createWindow();
    mainWindow.loadFile(path.join(__dirname, '../resources/index.html'));
  } else {
    app.quit();
  }

  console.log(getDestinationPath());
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
