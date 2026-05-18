const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  loadLogo: () => ipcRenderer.invoke('load-logo'),
  saveLogo: (logoData) => ipcRenderer.invoke('save-logo', logoData),
  exportCSV: (csv, name) => ipcRenderer.invoke('export-csv', csv, name),
  printPDF: (html, name) => ipcRenderer.invoke('print-pdf', html, name),
  encryptData: (plainText) => ipcRenderer.invoke('encrypt-data', plainText),
  decryptData: (encryptedData) => ipcRenderer.invoke('decrypt-data', encryptedData),
});
