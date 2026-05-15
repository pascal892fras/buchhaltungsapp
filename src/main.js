const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_PATH = path.join(app.getPath('userData'), 'buchhaltung_data.json');
const SETTINGS_PATH = path.join(app.getPath('userData'), 'buchhaltung_settings.json');

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return fallback; }
}
function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
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
      preload: path.join(__dirname, 'scr', 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'Buchhaltung'
  });
  win.loadFile(path.join(__dirname, 'scr', 'index.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// IPC Handlers
ipcMain.handle('load-data', () => loadJSON(DATA_PATH, { kunden: [], rechnungen: [], ausgaben: [], angebote: [], wiederkehrend: [] }));
ipcMain.handle('save-data', (_, data) => { saveJSON(DATA_PATH, data); return true; });
ipcMain.handle('load-settings', () => loadJSON(SETTINGS_PATH, {}));
ipcMain.handle('save-settings', (_, s) => { saveJSON(SETTINGS_PATH, s); return true; });

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

    // Warten, bis externe Scripts (QR-Code-Library) geladen sind
    await new Promise(resolve => setTimeout(resolve, 2000));

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
