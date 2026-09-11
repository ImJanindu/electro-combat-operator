const { app, BrowserWindow, shell } = require('electron');
const serveModule = require('electron-serve');
const serve = serveModule.default || serveModule;
const path = require('path');

const loadURL = serve({ directory: path.join(__dirname, '../out') });

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

  loadURL(win).then(() => {
    win.loadURL('app://-');
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
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
