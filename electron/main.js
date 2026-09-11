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
        const choice = dialog.showMessageBoxSync(win, {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm Exit',
          message: 'A match is currently active! Are you sure you want to close this window? (This could interrupt the game)'
        });
        if (choice === 1) {
          e.preventDefault();
        }
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
