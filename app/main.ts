import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as net from 'net';
import { checkFileExists, deleteFile, getFilePaths, getFiles } from './helpers/get-file-name';
import { readFileAndGetJson, sendDataSerialPort } from './helpers/serial-com';

const fetch = require("node-fetch");
import { SerialPort } from 'serialport';
import * as chokidar from 'chokidar';

let win: BrowserWindow = null;
let watcher: chokidar.FSWatcher = null;
let initialLoad = false;
let serialPortListener: SerialPort = null;
let serialDataBuffer: string = '';
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
    console.log(directoryPath)
    return await getFiles(directoryPath);
  } catch (error) {
    return error
  }
});




// ipcMain.handle('directory-cleanup', async (e, args) => {
//   const directoryPath = args;
//   console.log('directory clean', directoryPath)
//   try {
//     const files = await getFiles(directoryPath, () => true) as any[];
//     const sortedFiles = files.sort((fileA, fileB) => (+fileB.info.birthtime as any) - (+fileA.info.birthtime as any))
//     const deletableFiles = sortedFiles.slice(5, files.length)
//     for (const file of deletableFiles) {
//       try {
//         if (await checkFileExists(file.path)) {
//           await deleteFile(file.path)
//         }
//       } catch (error) {
//         console.log(file.name, 'cannot be deleted')
//       }
//     }
//   } catch (error) {
//     console.log(error)
//   }
// });




ipcMain.handle('directory-cleanup', async (e, args) => {
  try {
    const { directoryPath, maxFiles } = args;


    const files = await getFiles(directoryPath, () => true) as any[];

    const sortedFiles = files.sort(
      (a, b) => (+b.info.birthtime as any) - (+a.info.birthtime as any)
    );

    const keepCount = Number(maxFiles) || 5;
    const deletableFiles = sortedFiles.slice(keepCount);

    for (const file of deletableFiles) {
      try {
        if (await checkFileExists(file.path)) {
          await deleteFile(file.path);
        }
      } catch (err) {
        console.log( file.name);
      }
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Directory cleanup error:', error);
    return { success: false, error: error.message };
  }
});



ipcMain.on('watch-dir', async (e, args) => {
  const directoryPath = args;
  if (watcher) {
    await watcher.close()
  }
  watcher = chokidar.watch(directoryPath, { ignored: /^\./, persistent: true, ignoreInitial: true })
    .on('add', function (path) {
      console.log(path)
      win.webContents.send('reload-files')
    })
    .on('change', function (path) {
      win.webContents.send('reload-files')
    })
    .on('unlink', function (path) {
      win.webContents.send('reload-files')
    })
})

// ipcMain.handle('send-data-serial-port-com', async (e, ...args) => {
//   const [path, data] = args;
//   console.log('data sent to the serial port', data, path);
//   try {
//     return await sendDataSerialPort(path, data);
//   } catch (error) {
//     return error;
//   }
// })


ipcMain.handle('send-data-serial-port-com', async (e, path, data) => {
  console.log('data sent to serial port', data);
  try {
    // Use existing open serialPortListener
    if (serialPortListener && serialPortListener.isOpen) {
      serialPortListener.write(data, (err) => {
        if (err) {
          console.error("Error writing to serial port:", err);
        }
      });

      return { success: true };
    }

    return { success: false, error: "Serial port is not open." };
  } catch (err) {
    console.error("Send data error:", err);
    return { success: false, error: err.message };
  }
});


// ipcMain.handle('send-data-ip', async (e, ip, data) => {
//   console.log("Sending to IP:", ip, data);

//   try {
//     const fullUrl = `${ip}spectrumResult?d=${encodeURIComponent(data)}`;
//     console.log("Final URL:", fullUrl);

//     const response = await fetch(fullUrl, {
//       method: "GET"
//     });

//     const text = await response.text(); 
//     console.log("Raw Response:", text);

//     return text;
//   } catch (err) {
//     console.error("IP HTTP Error:", err);
//     throw err;
//   }
// });


ipcMain.handle('send-data-ip', async (e, ip, data) => {
  try {
    if (!ip.startsWith('http://') && !ip.startsWith('https://')) {
      ip = 'http://' + ip;
    }

    const url = new URL('/spectrumResult', ip);
    url.searchParams.set('d', data);

    console.log('Final URL:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET'
    });

    const text = await response.text();
    console.log('Raw Response:', text);

    return text;
  } catch (err) {
    console.error('IP HTTP Error:', err);
    throw err;
  }
});


ipcMain.handle('start-serial-listener', async (e, portPath) => {
  try {

    if (serialPortListener && serialPortListener.isOpen) {
      return { success: true };
    }

    if (serialPortListener && !serialPortListener.isOpen) {
      serialPortListener = null;
    }

    serialPortListener = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: false
    });

    serialDataBuffer = '';

    await new Promise((resolve, reject) => {
      serialPortListener.open(err => {
        if (err) {
          reject(err);
        } else {
          console.log("Serial port OPEN:", portPath);
          resolve(true);
        }
      });
    });

  let serialBuffer = "";  

serialPortListener.on('data', (chunk) => {
  const data = chunk.toString();
  console.log("SERIAL CHUNK:", data);

  serialBuffer += data;  

  if (serialBuffer.startsWith('$') && serialBuffer.endsWith('#')) {

    console.log("FULL SERIAL MESSAGE:", serialBuffer);

    win.webContents.send('serial-data-received', serialBuffer);

    serialBuffer = ""; 
  }
});


    serialPortListener.on('error', (err) => {
      console.log("SERIAL ERROR:", err);
      win.webContents.send('serial-data-error', err.message);
    });

    serialPortListener.on('close', () => {
      win.webContents.send('serial-port-closed');
    });

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
});



// Stop listening to serial port
ipcMain.handle('stop-serial-listener', async () => {
  try {
    if (serialPortListener && serialPortListener.isOpen) {
      await serialPortListener.close();
      console.log("Serial listener stopped");
    }
    serialPortListener = null;
    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
});


// Clear serial data buffer
ipcMain.handle('clear-serial-buffer', async () => {
  serialDataBuffer = '';
  return { success: true };
});



//to ready ascii data from file
ipcMain.handle('get-ascii-data', async (e, filePath) => {
  try {
    console.log("Reading ASCII file:", filePath);

    // Read file as UTF-16LE (REAL ENCODING)
    const content = fs.readFileSync(filePath, "utf16le");

    // Convert ASCII → Spectrum
    const spectrum = convertAsciiToSpectrum(content);

    return spectrum;

  } catch (err) {
    console.error("ASCII read error:", err);
    return { error: err.message };
  }
});



// Fetch spectrum logs from server
ipcMain.handle(
  'get-spectrum-logs',
  async (e, { baseUrl, start, end }) => {
    try {

      // 🔥 1. Validate baseUrl
      if (!baseUrl || baseUrl.trim() === '') {
        throw new Error('Base URL is empty');
      }

      // 🔥 2. Normalize baseUrl
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'http://' + baseUrl;
      }

      // 🔥 3. Build URL safely
      const apiUrl = new URL('/spectrumLogs/', baseUrl);
      apiUrl.searchParams.set('start', start);
      apiUrl.searchParams.set('end', end);

      console.log('📅 Calendar API URL:', apiUrl.toString());

      // 🔥 4. Call API
      const response = await fetch(apiUrl.toString(), {
        method: 'GET'
      });

      const data = await response.json();

      return {
        success: true,
        data
      };

    } catch (err) {
      console.error('❌ Calendar API Error:', err.message);

      return {
        success: false,
        error: err.message
      };
    }
  }
);






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





function convertAsciiToSpectrum(content: string) {

  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  console.log("RAW LINES:");
  lines.forEach((l, i) => console.log(i, JSON.stringify(l)));

  const avgLine = lines.find(l => l.startsWith("Average"));
  if (!avgLine) {
    console.log("NO AVERAGE LINE FOUND");
    return { headers: [], elements: [] };
  }

  console.log("FOUND AVERAGE LINE:", avgLine);

  // SPLIT EACH COLUMN BY TAB
  const parts = avgLine.split("\t").map(p => p.trim());

  // GET HEADER_1 for element names
  const headerParts = lines[0].split("\t").map(p => p.trim());

  // Element names start AFTER column 15
  const elementNames = headerParts.slice(15);

  // Values also start at index 15
  const elementValues = parts.slice(15);

  const elements = [];

  for (let i = 0; i < elementNames.length; i++) {
    const name = elementNames[i];
    let val = elementValues[i] ?? "";

    // Clean <, >, ++
    val = val.replace(/[<>+]/g, "").trim();

    elements.push({
      ElementName: name,
      reportedResult: {
        resultValue: val,
        limits: null,
        Unit: "%"
      }
    });
  }

  // Create headers matching XML format
  const headers = [
    { name: "Date",      value: parts[1] },
    { name: "Time",      value: parts[1] },
    { name: "Method",    value: parts[2] },
    { name: "Heat No",   value: parts[4] },
    { name: "Part Name", value: parts[5] },
    { name: "Stage",     value: parts[6] },
    { name: "Tested By", value: parts[7] },
    { name: "Alloy",     value: parts[8] },
    { name: "Grade",     value: parts[9] },
  ];

  return {
    headers,
    elements
  };
}

