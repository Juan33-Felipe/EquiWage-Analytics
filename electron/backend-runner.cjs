const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');

// Attempt to load .env in Electron desktop environment if present
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
    } catch (_) {}
  }
}

const entryPath = process.env.BACKEND_ENTRY_PATH;

if (!entryPath) {
  console.error('[BackendRunner] No BACKEND_ENTRY_PATH provided.');
  process.exit(1);
}

const entryUrl = pathToFileURL(entryPath).href;

import(entryUrl)
  .then(() => {
    console.log('[BackendRunner] Backend successfully started in background process.');
  })
  .catch((err) => {
    console.error('[BackendRunner] Error initializing backend server:', err);
    process.exit(1);
  });
