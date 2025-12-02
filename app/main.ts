import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as net from 'net';
import { getFiles } from './helpers/get-file-name';
import { readFileAndGetJson, sendDataSerialPort } from './helpers/serial-com';

const fetch = require("node-fetch");
import { SerialPort } from 'serialport';
import * as chokidar from 'chokidar';

let win: BrowserWindow = null;
let watcher: chokidar.FSWatcher = null;
let initialLoad = false;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      // allowRunningInsecureContent: (serve) ? true : false,
      allowRunningInsecureContent: true,
      contextIsolation: false,  // false if you want to run e2e test with Spectron
    },
  });


  if (serve) {
    win.webContents.openDevTools();
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../node_modules/electron'))
    });
    win.loadURL('http://localhost:5200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    win.loadURL(url.format({
      pathname: path.join(__dirname, pathIndex),
      protocol: 'file:',
      slashes: true
    }));
    // win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

ipcMain.handle('file-list', async (e, args) => {
  const directoryPath = args;
  try {
    return await getFiles(directoryPath);
  } catch (error) {
    return error
  }
});

ipcMain.on('watch-dir', async (e, args) => {
  const directoryPath = args;
  if (watcher) {
    await watcher.close()
  }
  watcher = chokidar.watch(directoryPath, { ignored: /^\./, persistent: true, ignoreInitial: true })
    .on('add', function (path) {
      win.webContents.send('reload-files')
    })
    .on('change', function (path) {
      win.webContents.send('reload-files')
    })
    .on('unlink', function (path) {
      win.webContents.send('reload-files')
    })
})

ipcMain.handle('send-data-serial-port-com', async (e, ...args) => {
  const [path, data] = args;
  try {
    return await sendDataSerialPort(path, data);
  } catch (error) {
    return error;
  }
})


ipcMain.handle('send-data-ip', async (e, ip, data) => {
  console.log("Sending to IP:", ip, data);

  try {
    const fullUrl = `${ip}?d=${encodeURIComponent(data)}`;
    console.log("Final URL:", fullUrl);

    const response = await fetch(fullUrl, {
      method: "GET"
    });

    const text = await response.text(); 
    console.log("Raw Response:", text);

    return text;
  } catch (err) {
    console.error("IP HTTP Error:", err);
    throw err;
  }
});





ipcMain.handle('get-spectrum-data', async (e, args) => {
  const filePath = args;
  return await readFileAndGetJson(filePath);
})
console.log('welcome check')


try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(() => {
    createWindow()
    ipcMain.handle('get-serial-port-list', async () => {
      // return [{
      //   path: 'COM5',
      //   manufacturer: 'wch.cn',
      //   serialNumber: '6&1e3c5ed9&0&1',
      //   pnpId: 'USB\\VID_1A86&PID_7523\\6&1E3C5ED9&0&1',
      //   locationId: 'Port_#0001.Hub_#0004',
      //   friendlyName: 'USB-SERIAL CH340 (COM5)',
      //   vendorId: '1A86',
      //   productId: '7523'
      // }]
      return await SerialPort.list()
    })
  }, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
