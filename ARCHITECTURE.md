# Architektur der Buchhaltungsapp

## 🏗️ Architektur-Übersicht

```
┌─────────────────────────────────────────────────────┐
│              HTML UI (index.html)                   │
│         Forms, Tables, Modals                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│         app-refactored.js (Orchestrator)            │
│  - Initialisierung                                  │
│  - Modul-Imports                                    │
│  - Global Window-Exports                           │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────┼───────┬────────────┬──────────┐
         ▼       ▼       ▼            ▼          ▼
    ┌────────┬──────┬──────────┬──────────┐  ┌──────────┐
    │ state  │ nav  │dashboard │ helpers  │  │positions │
    └────────┴──────┴──────────┴──────────┘  └──────────┘
         │
    ┌────┴──────────────────────────────────────────┐
    │                                               │
    ▼                    ▼           ▼              ▼
┌──────────┐      ┌──────────────┐ ┌──────────┐ ┌──────────┐
│rechnungen│      │angebote      │ │wiederkehrend│ausgaben │
│+ Mahnungen      │              │ │         │
└──────────┘      └──────────────┘ └──────────┘ └──────────┘
    │
    ├──────┬────────┬──────────┬────────┬───────┐
    ▼      ▼        ▼          ▼        ▼       ▼
 ┌──────┐┌──────┐┌────────┐┌────────┐┌─────┐┌──────┐
 │kunden││settings│templates│  euer  │export│preload│
 └──────┘└──────┘└────────┘└────────┘└─────┘└──────┘
    │
    ▼
┌──────────────────────────────────┐
│   main.js (Electron Main)        │
│  - IPC-Handler                   │
│  - PDF-Generierung               │
│  - Datei-Operationen             │
└──────────────────────────────────┘
```

## 📊 Daten-Modelle

### state.data
```typescript
{
  kunden: Customer[],
  rechnungen: Invoice[],
  ausgaben: Expense[],
  angebote: Offer[],
  wiederkehrend: RecurringInvoice[]
}
```

### state.settings
```typescript
{
  // Firmendaten
  name, beruf, adresse, tel, mail, web, steuernr,
  
  // Bankverbindung
  bank, kontoinhaber, iban, bic, zahltage,
  
  // Nummern
  prefix, angprefix,
  
  // Design
  darkmode, tpl_color_*, tpl_logo_*, tpl_table_style,
  
  // Mahnungen
  mahnung_prefix, mahngebuehr_*, verzugszins_pct,
  mahnung_frist_*, mahnung_text_*
}
```

## 🔄 Datenfluss

```
                    ┌─────────────────┐
                    │  Nutzer-Input   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Module ändern  │
                    │   state.data    │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                ▼                         ▼
         ┌────────────┐          ┌──────────────┐
         │ saveData() │          │UI aktualisieren
         │            │          │ (render*)
         └─────┬──────┘          └──────────────┘
               │
               ▼
      ┌──────────────────┐
      │  IPC main.js     │
      │  writeFileSync   │
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │  Local Storage   │
      │ (AppData/.....)  │
      └──────────────────┘
```

## 🎯 Modul-Verantwortlichkeiten

| Modul | Verantwortung | Zustand |
|-------|---------------|---------|
| `state.js` | Global State & I/O | ✅ |
| `helpers.js` | Utilities | ✅ |
| `navigation.js` | UI Navigation | ✅ |
| `dashboard.js` | Dashboard | ✅ |
| `positions.js` | Positionen | ✅ |
| `rechnungen.js` | Rechnungen + Mahnungen | ✅ |
| `angebote.js` | Angebote | ✅ |
| `wiederkehrend.js` | Wiederkehrend | ✅ |
| `kunden.js` | Kunden | ✅ |
| `ausgaben.js` | Ausgaben + KI-OCR | ✅ |
| `templates.js` | PDF-Templates | ⚠️ |
| `settings.js` | Konfiguration | ✅ |
| `euer.js` | EÜR | ✅ |
| `export.js` | CSV-Export | ✅ |

## 🔌 Schnittstellen (APIs)

### Interne APIs
```javascript
// Module kommunizieren über Imports
import { state, saveData } from './state.js';
import { toast, fmt } from './helpers.js';

// Beispiel: Rechnung speichern
state.data.rechnungen.push(newInvoice);
await saveData();
toast('Rechnung gespeichert');
```

### Externe APIs (über IPC)
```javascript
// Zu main.js
window.api.loadData();
window.api.saveData(data);
window.api.printPDF(html, filename);
window.api.exportCSV(csv, filename);
window.api.loadLogo();
window.api.saveLogo(dataUrl);
window.api.loadSettings();
window.api.saveSettings(settings);
```

## 🔐 State Management

### Single Source of Truth
```javascript
// ✅ Richtig: State aus state.js
import { state } from './state.js';
state.data.rechnungen

// ❌ Falsch: Lokale State-Variablen
let mineRechnungen = [];
```

### Immutability
```javascript
// ✅ Richtig: Neues Objekt erstellen
state.data.kunden = [
  ...state.data.kunden,
  newCustomer
];

// ❌ Falsch: Mutieren
state.data.kunden.push(newCustomer);
// (OK in diesem Fall, aber zu vermeiden)
```

## 🧪 Testbarkeit

```javascript
// Modular = Testbar
describe('rechnungen.js', () => {
  it('should calculate total correctly', () => {
    const positions = [
      { menge: 5, ep: 100 },
      { menge: 3, ep: 50 }
    ];
    const total = positions.reduce((s, p) => s + p.menge * p.ep, 0);
    expect(total).toBe(650);
  });
});
```

## 📈 Skalierbarkeit

### Hinzufügen neuer Features

1. **Neues Modul erstellen**
   ```javascript
   // modules/mein-feature.js
   export function meineFunktion() { }
   ```

2. **In app-refactored.js importieren**
   ```javascript
   import * as meinFeature from './modules/mein-feature.js';
   Object.assign(window, meinFeature);
   ```

3. **HTML aufrufen**
   ```html
   <button onclick="meineFunktion()">Mein Feature</button>
   ```

## ⚡ Performance

### Lazy Loading (Zukünftig)
```javascript
// Modules nur bei Bedarf laden
document.addEventListener('click', async (e) => {
  if (e.target.id === 'euer-btn') {
    const { initEUER } = await import('./modules/euer.js');
    initEUER();
  }
});
```

### Memoization (Optional)
```javascript
const cache = new Map();
export function getCachedData(key) {
  if (!cache.has(key)) {
    cache.set(key, loadData(key));
  }
  return cache.get(key);
}
```

## 🐛 Fehlerbehandlung

```javascript
// Standard-Pattern in allen Modulen
export async function doSomething() {
  try {
    // Operation
    await saveData();
    toast('Erfolgreich');
  } catch (error) {
    console.error('Fehler:', error);
    toast('Fehler: ' + error.message);
  }
}
```

## 📚 Dokumentation

Jedes Modul hat:
- JSDoc-Kommentare
- Kurzbeschreibung am Anfang
- Klare Funktionsnamen
- Beispiele in Kommentaren

---

**Architektur-Version**: 1.0  
**Paradigma**: Modular, funktional  
**State Management**: Zentrauf state.js  
**Kommunikation**: ES6 Imports, window-global, IPC
