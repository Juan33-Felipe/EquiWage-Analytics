const { app, BrowserWindow, utilityProcess, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load .env if present
const envCandidates = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env'),
];
if (process.resourcesPath) {
  envCandidates.push(path.join(process.resourcesPath, '.env'));
  envCandidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', '.env'));
}
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    try {
      require('dotenv').config({ path: envPath });
      break;
    } catch (_) { }
  }
}

let mainWindow = null;
let backendProcess = null;

const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 4000;

function resolveBackendPath() {
  if (app.isPackaged) {
    const unpackedPath = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'apps',
      'backend',
      'dist',
      'server.bundle.js'
    );
    if (fs.existsSync(unpackedPath)) {
      return unpackedPath;
    }
  }
  return path.join(__dirname, '../apps/backend/dist/server.bundle.js');
}

function waitForBackend(url, timeoutMs = 15000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', () => retry());
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        console.warn(`[Electron] Backend wait timeout at ${url}, continuing.`);
        resolve(false);
      } else {
        setTimeout(check, 250);
      }
    };

    check();
  });
}

function startBackend() {
  const userDataPath = app.getPath('userData');
  const sqliteDbPath = path.join(userDataPath, 'data', 'equiwage.sqlite');

  const backendPath = resolveBackendPath();
  const runnerPath = path.join(__dirname, 'backend-runner.cjs');

  try {
    backendProcess = utilityProcess.fork(runnerPath, [], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(BACKEND_PORT),
        HOST: '127.0.0.1',
        SQLITE_DB_PATH: sqliteDbPath,
        BACKEND_ENTRY_PATH: backendPath,
        SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
        SMTP_PORT: process.env.SMTP_PORT || '465',
        SMTP_SECURE: process.env.SMTP_SECURE || 'true',
        SMTP_USER: process.env.SMTP_USER || '',
        SMTP_PASS: process.env.SMTP_PASS || '',
        SMTP_FROM: process.env.SMTP_FROM || '',
        AI_API_KEY: process.env.AI_API_KEY || '',
      },
      stdio: 'inherit',
    });

    backendProcess.on('exit', (code) => {
      console.log(`[Electron] Backend process exited with code ${code}`);
    });
  } catch (err) {
    console.error('[Electron] Failed to start backend utilityProcess:', err);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'EquiWage Analytics',
    icon: path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#0f172a',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    await mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Wait for backend to be healthy before loading UI
    await waitForBackend(`http://127.0.0.1:${BACKEND_PORT}/api/health`, 10000);

    const indexPath = path.join(__dirname, '../apps/frontend/dist/index.html');
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock: prevent opening multiple instances that collide on port 4000
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    if (!isDev) {
      startBackend();
    }
    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    if (backendProcess) {
      try {
        backendProcess.kill();
      } catch {
        // ignore
      }
      backendProcess = null;
    }
  });
}
