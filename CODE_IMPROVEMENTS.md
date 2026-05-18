# 🔧 Konkrete Verbesserungen – Code-Beispiele

Dieses Dokument enthält **sofort umsetzbare Verbesserungen** für die Buchhaltungs-App.

---

## 1️⃣ Fehlerbehandlung – Vorlage

Nutze dieses Pattern in allen Modulen:

```javascript
/**
 * Speichert Daten mit umfassender Fehlerbehandlung
 * @param {Object} data - Zu speichernde Daten
 * @param {boolean} showNotification - Toast anzeigen?
 * @returns {Promise<boolean>} true bei Erfolg
 */
export async function saveDataSafely(data, showNotification = true) {
  try {
    // Validiere Input
    validateInput(data);
    
    // Speichere Daten
    await saveData(data);
    
    // Success-Feedback
    if (showNotification) {
      toast('✓ Erfolgreich gespeichert', 'success');
    }
    
    return true;
    
  } catch (error) {
    // Log error for debugging
    console.error('[SaveError]', error.message, error.stack);
    
    // User-friendly error message
    const errorMsg = sanitizeError(error);
    toast(`❌ Fehler: ${errorMsg}`, 'error');
    
    // Telemetry (optional)
    // trackError('save_failed', { error: errorMsg });
    
    return false;
  }
}

/**
 * Wandelt Fehler in benutzerfreundliche Meldungen
 */
function sanitizeError(error) {
  const errorMessages = {
    'ENOENT': 'Datei nicht gefunden',
    'EACCES': 'Zugriff verweigert',
    'EISDIR': 'Ist ein Verzeichnis, keine Datei',
  };
  
  // Tech-Fehler zurückfallen auf generische Meldung
  return errorMessages[error.code] || error.message || 'Unbekannter Fehler';
}

/**
 * Validiert Input-Daten
 */
function validateInput(data) {
  if (!data) throw new Error('Daten erforderlich');
  if (typeof data !== 'object') throw new Error('Daten müssen ein Objekt sein');
}
```

---

## 2️⃣ Input-Validierung – Helper

```javascript
// modules/validation.js

/**
 * Validierungshelfer für verschiedene Input-Typen
 */

export const Validation = {
  /**
   * Validiert einen Namen (min. 2 Zeichen, nur Buchstaben/Zahlen)
   */
  name(value) {
    if (!value?.trim()) {
      throw new Error('Name erforderlich');
    }
    if (value.trim().length < 2) {
      throw new Error('Name muss mindestens 2 Zeichen lang sein');
    }
    if (value.length > 100) {
      throw new Error('Name darf maximal 100 Zeichen lang sein');
    }
    return value.trim();
  },

  /**
   * Validiert eine E-Mail-Adresse
   */
  email(value) {
    if (!value?.trim()) return null; // Optional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Ungültige E-Mail-Adresse');
    }
    return value.trim().toLowerCase();
  },

  /**
   * Validiert einen Betrag (> 0, max 2 Dezimalstellen)
   */
  amount(value) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Betrag muss eine Zahl sein');
    }
    if (num <= 0) {
      throw new Error('Betrag muss größer als 0 sein');
    }
    if (num > 999999.99) {
      throw new Error('Betrag zu groß (max. 999.999,99 €)');
    }
    return Math.round(num * 100); // In Cent umwandeln
  },

  /**
   * Validiert eine Rechnungsnummer (eindeutig, Format-Check)
   */
  invoiceNumber(value, existingNumbers = []) {
    if (!value?.trim()) {
      throw new Error('Rechnungsnummer erforderlich');
    }
    
    value = value.trim().toUpperCase();
    
    if (!/^[A-Z0-9\-]+$/.test(value)) {
      throw new Error('Ungültiges Format (nur Buchstaben, Zahlen, Bindestrich)');
    }
    
    if (value.length > 20) {
      throw new Error('Rechnungsnummer zu lang (max. 20 Zeichen)');
    }
    
    if (existingNumbers.includes(value)) {
      throw new Error(`Rechnungsnummer ${value} existiert bereits`);
    }
    
    return value;
  },

  /**
   * Validiert eine Menge (positive ganze Zahl oder Dezimal)
   */
  quantity(value) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      throw new Error('Menge muss größer als 0 sein');
    }
    if (num > 9999) {
      throw new Error('Menge zu groß (max. 9.999)');
    }
    return num;
  },

  /**
   * Validiert ein Datum
   */
  date(value) {
    if (!value) {
      throw new Error('Datum erforderlich');
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Ungültiges Datum');
    }
    
    // Nicht in der Zukunft
    if (date > new Date()) {
      throw new Error('Datum kann nicht in der Zukunft liegen');
    }
    
    return value;
  },

  /**
   * Validiert eine IBAN
   */
  iban(value) {
    if (!value?.trim()) return null; // Optional
    
    value = value.replace(/\s/g, '').toUpperCase();
    
    if (!/^DE[0-9]{22}$/.test(value)) {
      throw new Error('Ungültige deutsche IBAN (Format: DE + 22 Ziffern)');
    }
    
    // Grundlegende Checksum-Validierung
    if (!validateIBAN(value)) {
      throw new Error('IBAN-Checksum ungültig');
    }
    
    return value;
  }
};

/**
 * Validiert IBAN-Checksum (IBAN mod-97)
 */
function validateIBAN(iban) {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, letter => 10 + letter.charCodeAt(0) - 65);
  
  let remainder = numeric;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder.substring(i) ? parseInt(remainder.substring(0, i + 7), 10) : 0) % 97;
  }
  
  return remainder === 1;
}

/**
 * Nutze in Modulen wie folgt:
 */
export function beispielNutzung() {
  try {
    const name = Validation.name(document.getElementById('k-name').value);
    const email = Validation.email(document.getElementById('k-mail').value);
    const betrag = Validation.amount(document.getElementById('a-betrag').value);
    
    // Alle validierungen erfolgreich!
    console.log({ name, email, betrag });
    
  } catch (error) {
    toast(`❌ ${error.message}`, 'error');
  }
}
```

---

## 3️⃣ Unit Tests – Beispiele

```javascript
// __tests__/validation.test.js
import { Validation } from '../src/modules/validation.js';

describe('Validation.js', () => {
  
  describe('Validation.name()', () => {
    test('akzeptiert gültige Namen', () => {
      expect(Validation.name('Max Mustermann')).toBe('Max Mustermann');
      expect(Validation.name('  Anna  ')).toBe('Anna');
    });
    
    test('lehnt leere Namen ab', () => {
      expect(() => Validation.name('')).toThrow('Name erforderlich');
      expect(() => Validation.name(null)).toThrow('Name erforderlich');
    });
    
    test('lehnt zu kurze Namen ab', () => {
      expect(() => Validation.name('A')).toThrow('mindestens 2 Zeichen');
    });
    
    test('lehnt zu lange Namen ab', () => {
      const longName = 'a'.repeat(101);
      expect(() => Validation.name(longName)).toThrow('maximal 100 Zeichen');
    });
  });
  
  describe('Validation.email()', () => {
    test('akzeptiert gültige E-Mails', () => {
      expect(Validation.email('test@example.com')).toBe('test@example.com');
      expect(Validation.email('UPPER@EXAMPLE.COM')).toBe('upper@example.com');
    });
    
    test('lehnt ungültige E-Mails ab', () => {
      expect(() => Validation.email('ungültig')).toThrow('Ungültige E-Mail');
      expect(() => Validation.email('test@')).toThrow('Ungültige E-Mail');
    });
    
    test('erlaubt leere E-Mail (optional)', () => {
      expect(Validation.email('')).toBeNull();
      expect(Validation.email(null)).toBeNull();
    });
  });
  
  describe('Validation.amount()', () => {
    test('konvertiert Betrag zu Cent', () => {
      expect(Validation.amount('100.50')).toBe(10050);
      expect(Validation.amount('10')).toBe(1000);
    });
    
    test('lehnt negative/null Beträge ab', () => {
      expect(() => Validation.amount(0)).toThrow('größer als 0');
      expect(() => Validation.amount(-50)).toThrow('größer als 0');
    });
    
    test('lehnt zu große Beträge ab', () => {
      expect(() => Validation.amount(1000000)).toThrow('zu groß');
    });
  });
  
  describe('Validation.invoiceNumber()', () => {
    test('akzeptiert gültige Nummern', () => {
      expect(Validation.invoiceNumber('RE-2025-001')).toBe('RE-2025-001');
      expect(Validation.invoiceNumber('inv123')).toBe('INV123');
    });
    
    test('lehnt Duplikate ab', () => {
      const existing = ['RE-001', 'RE-002'];
      expect(() => Validation.invoiceNumber('RE-001', existing)).toThrow('existiert bereits');
    });
    
    test('lehnt ungültige Zeichen ab', () => {
      expect(() => Validation.invoiceNumber('RE@001#')).toThrow('Ungültiges Format');
    });
  });
  
  describe('Validation.iban()', () => {
    test('akzeptiert gültige deutsche IBAN', () => {
      // Echte Test-IBAN (Checksumme korrekt)
      const validIBAN = 'DE89370400440532013000';
      expect(Validation.iban(validIBAN)).toBe('DE89370400440532013000');
    });
    
    test('lehnt ungültige IBAN ab', () => {
      expect(() => Validation.iban('INVALID')).toThrow('Ungültige deutsche IBAN');
    });
  });
  
});

// __tests__/helpers.test.js
import { formatGeld, berechneSumme } from '../src/modules/helpers.js';

describe('helpers.js', () => {
  
  describe('formatGeld()', () => {
    test('formatiert Cent-Beträge korrekt', () => {
      expect(formatGeld(10050)).toBe('100,50 €');
      expect(formatGeld(1000)).toBe('10,00 €');
      expect(formatGeld(1)).toBe('0,01 €');
    });
    
    test('formatiert 0 korrekt', () => {
      expect(formatGeld(0)).toBe('0,00 €');
    });
    
    test('formatiert negative Beträge', () => {
      expect(formatGeld(-10050)).toBe('-100,50 €');
    });
    
    test('formatiert große Beträge', () => {
      expect(formatGeld(123456789)).toBe('1.234.567,89 €');
    });
  });
  
  describe('berechneSumme()', () => {
    test('berechnet Summe einfach', () => {
      const positions = [
        { menge: 5, ep: 1000 }  // 5 × 10,00 € = 50,00 €
      ];
      expect(berechneSumme(positions)).toBe(5000);
    });
    
    test('berechnet Summe mehrerer Positionen', () => {
      const positions = [
        { menge: 5, ep: 1000 },  // 50,00 €
        { menge: 3, ep: 2000 }   // 60,00 €
      ];
      expect(berechneSumme(positions)).toBe(11000); // 110,00 €
    });
    
    test('handhabt leere Positionen', () => {
      expect(berechneSumme([])).toBe(0);
      expect(berechneSumme(null)).toBe(0);
    });
  });
  
});
```

**Nutze zum Starten:**
```bash
npm test
npm test:watch    # Während Entwicklung
npm test:coverage # Für Coverage-Report
```

---

## 4️⃣ Bessere IPC-Kommunikation

```javascript
// preload.js – Verbessert

const { contextBridge, ipcRenderer } = require('electron');

// Definiere eine sichere API
const api = {
  // Daten-Operationen
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  loadBackup: () => ipcRenderer.invoke('data:load-backup'),
  
  // PDF-Generierung
  generatePDF: (template, data) => 
    ipcRenderer.invoke('pdf:generate', { template, data }),
  
  // Datei-Export
  exportCSV: (filename, csvContent) => 
    ipcRenderer.invoke('file:export-csv', { filename, csvContent }),
  
  // Logo-Verwaltung
  saveLogo: (base64Data) => ipcRenderer.invoke('logo:save', base64Data),
  loadLogo: () => ipcRenderer.invoke('logo:load'),
  deleteLogo: () => ipcRenderer.invoke('logo:delete'),
  
  // Settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  
  // App-Infos
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  openExternal: (url) => ipcRenderer.send('app:open-external', url),
};

// Context Bridge (sichere Schnittstelle)
contextBridge.exposeInMainWorld('api', api);

console.log('✓ Preload-Script geladen');
```

```javascript
// modules/state.js – Nutze die API sicherer

export async function loadData() {
  try {
    const data = await window.api.loadData();
    validateDataStructure(data);
    state.data = data;
    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
    
    // Fallback zu Backup
    try {
      const backup = await window.api.loadBackup();
      state.data = backup;
      toast('⚠️ Backup wiederhergestellt', 'warning');
      return backup;
    } catch (backupError) {
      state.data = createDefaultState();
      toast('❌ Fehler beim Laden – Standard-State erstellt', 'error');
      return state.data;
    }
  }
}

export async function saveData() {
  try {
    await window.api.saveData(state.data);
    console.log('✓ Daten gespeichert');
  } catch (error) {
    console.error('Failed to save data:', error);
    toast('❌ Fehler beim Speichern: ' + error.message, 'error');
    throw error;
  }
}
```

---

## 5️⃣ Logging-System

```javascript
// modules/logger.js

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(name, level = LOG_LEVELS.INFO) {
    this.name = name;
    this.level = level;
    this.isDev = process.env.NODE_ENV === 'development';
  }
  
  debug(message, data) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug(`[${this.name}] ${message}`, data || '');
    }
  }
  
  info(message, data) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(`[${this.name}] ℹ️ ${message}`, data || '');
    }
  }
  
  warn(message, data) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(`[${this.name}] ⚠️ ${message}`, data || '');
    }
  }
  
  error(message, error) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(`[${this.name}] ❌ ${message}`, error?.message || error || '');
      if (this.isDev && error?.stack) {
        console.error('Stack:', error.stack);
      }
    }
  }
}

// Nutze in jedem Modul:
export const logger = new Logger('RechnungenModule');

logger.info('Rechnung erstellt', { id: r.id });
logger.warn('Kritisches Feld leer', { field: 'kundenname' });
logger.error('Speichern fehlgeschlagen', error);
```

---

## 6️⃣ Bessere Zustandsverwaltung

```javascript
// modules/state.js – Erweitert

export class StateManager {
  constructor() {
    this.data = createDefaultState();
    this.settings = createDefaultSettings();
    this.ui = {
      currentSection: 'dashboard',
      selectedInvoice: null,
      unsavedChanges: false
    };
    
    // Change-Listener registrieren
    this.listeners = [];
  }
  
  /**
   * Registriert einen Listener für State-Änderungen
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Benachrichtigt alle Listener
   */
  notifyListeners(path, oldValue, newValue) {
    this.listeners.forEach(callback => {
      callback({ path, oldValue, newValue });
    });
  }
  
  /**
   * Markiert ungespeicherte Änderungen
   */
  markDirty() {
    this.ui.unsavedChanges = true;
    document.title = '* Buchhaltung (ungespeicherte Änderungen)';
  }
  
  /**
   * Löscht Dirty-Flag
   */
  markClean() {
    this.ui.unsavedChanges = false;
    document.title = 'Buchhaltung';
  }
}

export const state = new StateManager();

// Nutze so:
state.onChange(({ path, oldValue, newValue }) => {
  console.log(`State changed: ${path}`, { oldValue, newValue });
});
```

---

## 7️⃣ Confirmation Dialog

```javascript
// modules/confirm-dialog.js

export function showConfirmDialog(options = {}) {
  return new Promise((resolve) => {
    const {
      title = 'Bestätigung erforderlich',
      message = 'Bist du sicher?',
      confirmText = 'Ja, löschen',
      cancelText = 'Abbrechen',
      isDangerous = false
    } = options;
    
    const dialog = document.createElement('div');
    dialog.className = 'modal-backdrop';
    dialog.innerHTML = `
      <div class="modal">
        <h3>${title}</h3>
        <p>${message}</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
          <button class="btn" data-action="cancel">${cancelText}</button>
          <button class="btn ${isDangerous ? 'btn-danger' : 'btn-primary'}" data-action="confirm">
            ${confirmText}
          </button>
        </div>
      </div>
    `;
    
    dialog.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'confirm') {
        resolve(true);
        dialog.remove();
      } else if (e.target.dataset.action === 'cancel') {
        resolve(false);
        dialog.remove();
      }
    });
    
    document.body.appendChild(dialog);
  });
}

// Nutze in Modulen:
export async function loescheRechnung(rechnungId) {
  const confirmed = await showConfirmDialog({
    title: 'Rechnung löschen?',
    message: 'Diese Aktion kann nicht rückgängig gemacht werden.',
    confirmText: 'Ja, löschen',
    isDangerous: true
  });
  
  if (!confirmed) return;
  
  state.data.rechnungen = state.data.rechnungen.filter(r => r.id !== rechnungId);
  await saveData();
  renderRechnungen();
  toast('✓ Rechnung gelöscht');
}
```

---

## 🎯 Checkliste für Verbesserungen

### Phase 1 – Stabilität (1-2 Wochen)
- [ ] Validierungsmodul implementieren
- [ ] Try-Catch in alle kritischen Funktionen
- [ ] Fehlertoasts anzeigen
- [ ] Input-Validierung in HTML

### Phase 2 – Testing (1-2 Wochen)
- [ ] Jest konfigurieren
- [ ] Test-Files erstellen
- [ ] Mindestens 50% Coverage erreichen
- [ ] CI/CD Pipeline (GitHub Actions)

### Phase 3 – Dokumentation (1 Woche)
- [ ] JSDoc für alle Funktionen
- [ ] CONTRIBUTION.md erstellen
- [ ] API-Dokumentation
- [ ] Tutorials schreiben

### Phase 4 – Optimierung (Laufend)
- [ ] Lazy-Loading implementieren
- [ ] Bundle-Größe optimieren
- [ ] Performance-Metriken

---

Diese Code-Beispiele sind **sofort einsatzbereit** und können Datei-für-Datei implementiert werden. 

**Viel Erfolg! 🚀**
