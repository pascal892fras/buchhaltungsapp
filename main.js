const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_PATH = path.join(app.getPath('userData'), 'buchhaltung_data.json');
const SETTINGS_PATH = path.join(app.getPath('userData'), 'buchhaltung_settings.json');
const LOGO_PATH = path.join(app.getPath('userData'), 'buchhaltung_logo.txt');
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups');

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return fallback; }
}
function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// Backup-Funktion: Erstellt automatische Backups
function createBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_PATH)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupPath = path.join(BACKUP_DIR, `buchhaltung_data_${timestamp}.json`);
      fs.copyFileSync(DATA_PATH, backupPath);

      // Alte Backups löschen (behalte nur die letzten 10)
      const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('buchhaltung_data_'))
        .sort()
        .reverse();

      if (backups.length > 10) {
        backups.slice(10).forEach(f => {
          fs.unlinkSync(path.join(BACKUP_DIR, f));
        });
      }
    }
  } catch (err) {
    console.error('Backup-Fehler:', err);
  }
}

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'Buchhaltung'
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// IPC Handlers
ipcMain.handle('load-data', () => loadJSON(DATA_PATH, { kunden: [], rechnungen: [], ausgaben: [], angebote: [], wiederkehrend: [] }));
ipcMain.handle('save-data', (_, data) => {
  createBackup(); // Erstelle Backup vor dem Speichern
  saveJSON(DATA_PATH, data);
  return true;
});
ipcMain.handle('load-settings', () => loadJSON(SETTINGS_PATH, {}));
ipcMain.handle('save-settings', (_, s) => { saveJSON(SETTINGS_PATH, s); return true; });

ipcMain.handle('load-logo', () => {
  try { return fs.readFileSync(LOGO_PATH, 'utf8'); }
  catch { return ''; }
});
ipcMain.handle('save-logo', (_, logoData) => {
  try {
    if (logoData) {
      fs.writeFileSync(LOGO_PATH, logoData, 'utf8');
    } else if (fs.existsSync(LOGO_PATH)) {
      fs.unlinkSync(LOGO_PATH);
    }
    return true;
  } catch { return false; }
});

ipcMain.handle('export-csv', async (_, csvContent, filename) => {
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'CSV exportieren',
    defaultPath: filename,
    filters: [{ name: 'CSV-Datei', extensions: ['csv'] }]
  });
  if (filePath) {
    fs.writeFileSync(filePath, '\uFEFF' + csvContent, 'utf8');
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('print-pdf', async (_, htmlContent, filename) => {
  const tmpWin = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });

  // Temporäre HTML-Datei erstellen, um große Base64-Bilder zu unterstützen
  const tmpHtmlPath = path.join(app.getPath('temp'), `temp_invoice_${Date.now()}.html`);
  fs.writeFileSync(tmpHtmlPath, htmlContent, 'utf8');

  try {
    await tmpWin.loadFile(tmpHtmlPath);

    // Warte, bis alle Bilder (inkl. externer QR-Code) geladen sind
    await tmpWin.webContents.executeJavaScript(`
      new Promise(resolve => {
        const imgs = Array.from(document.images);
        if (imgs.length === 0) return resolve();
        let pending = imgs.length;
        const done = () => { if (--pending <= 0) resolve(); };
        imgs.forEach(img => {
          if (img.complete) done();
          else { img.addEventListener('load', done); img.addEventListener('error', done); }
        });
        setTimeout(resolve, 8000);
      });
    `);

    const { filePath } = await dialog.showSaveDialog(win, {
      title: 'PDF speichern',
      defaultPath: filename,
      filters: [{ name: 'PDF-Datei', extensions: ['pdf'] }]
    });

    if (filePath) {
      const pdfData = await tmpWin.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });
      fs.writeFileSync(filePath, pdfData);
      shell.showItemInFolder(filePath);

      // Temp-Datei löschen
      fs.unlinkSync(tmpHtmlPath);
      tmpWin.destroy();
      return true;
    }

    // Temp-Datei löschen
    fs.unlinkSync(tmpHtmlPath);
    tmpWin.destroy();
    return false;
  } catch (error) {
    console.error('PDF-Fehler:', error);
    // Temp-Datei löschen
    if (fs.existsSync(tmpHtmlPath)) fs.unlinkSync(tmpHtmlPath);
    tmpWin.destroy();
    return false;
  }
});

// ─── SICHERHEIT: Verschlüsselte Bankdaten ─────────────────────────
/**
 * Verschlüsselt einen String mittels Electron's safeStorage
 * Wird für sensitive Daten wie IBAN, BIC verwendet
 */
ipcMain.handle('encrypt-data', (event, plainText) => {
  try {
    if (!plainText || typeof plainText !== 'string') {
      return null;
    }
    const encrypted = safeStorage.encryptString(plainText);
    return encrypted.toString('base64');
  } catch (error) {
    console.error('Verschlüsselungs-Fehler:', error);
    throw new Error('Daten konnten nicht verschlüsselt werden');
  }
});

/**
 * Entschlüsselt einen verschlüsselten String
 */
ipcMain.handle('decrypt-data', (event, encryptedBase64) => {
  try {
    if (!encryptedBase64) {
      return null;
    }
    const buffer = Buffer.from(encryptedBase64, 'base64');
    const decrypted = safeStorage.decryptString(buffer);
    return decrypted;
  } catch (error) {
    console.error('Entschlüsselungs-Fehler:', error);
    throw new Error('Daten konnten nicht entschlüsselt werden');
  }
});
