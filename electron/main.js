const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const serveModule = require('electron-serve');
const serve = serveModule.default || serveModule;
const path = require('path');

const loadURL = serve({ directory: path.join(__dirname, '../out') });

let isMatchActive = false;

ipcMain.on('set-match-active', (e, active) => {
  isMatchActive = active;
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should open a new window instead
    createWindow();
  });

  const createWindow = () => {
    const win = new BrowserWindow({
      width: 1280,
      height: 800,
      title: "ElectroCombat Operator",
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      autoHideMenuBar: true,
    });

    win.on('close', (e) => {
      if (isMatchActive) {
        e.preventDefault();
        dialog.showMessageBoxSync(win, {
          type: 'error',
          title: 'Action Denied',
          message: 'You cannot close the application while a match is active or not resolved. Please end or resolve the match first!'
        });
      }
    });

    loadURL(win).then(() => {
      win.loadURL('app://-');
    });
  }

  app.on('ready', () => {
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
