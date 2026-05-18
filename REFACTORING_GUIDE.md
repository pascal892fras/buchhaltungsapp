# Refactoring-Leitfaden: Modularisierung der Buchhaltungsapp

## 📋 Überblick

Die Buchhaltungsapp wurde von einer großen 1400+ Zeilen `app.js` in ein modulares System mit 14 spezialisierten JavaScript-Modulen aufgeteilt. Dies verbessert:

- **Wartbarkeit**: Jedes Modul hat eine klare Verantwortung
- **Testbarkeit**: Funktionen können isoliert getestet werden
- **Skalierbarkeit**: Neue Features sind leicht hinzufügbar
- **Performance**: Lazy Loading von Modulen ist möglich

## 🗂️ Neue Modulstruktur

```
src/
├── index.html
├── styles.css
├── preload.js
├── app-refactored.js      # ← Neue, refaktorierte Hauptdatei
└── modules/
    ├── state.js           # State Management, Datenladen/-speichern
    ├── helpers.js         # Utility-Funktionen (fmt, today, toast, etc.)
    ├── navigation.js      # Navigation und UI-Kontrolle
    ├── dashboard.js       # Dashboard-Logik
    ├── positions.js       # Positionsverwaltung (für Rechnungen/Angebote)
    ├── rechnungen.js      # Rechnungen und Mahnungen
    ├── angebote.js        # Angebote
    ├── wiederkehrend.js   # Wiederkehrende Rechnungen
    ├── kunden.js          # Kundenverwaltung
    ├── ausgaben.js        # Ausgaben und KI-Belegerfassung
    ├── templates.js       # PDF-Generierung und Templates
    ├── settings.js        # Einstellungen und Konfiguration
    ├── euer.js            # EÜR (Einnahmen-Überschuss-Rechnung)
    └── export.js          # CSV-Export
```

## 🔧 Migration: Von app.js zu app-refactored.js

### 1. **Backup**
```bash
# Sichern Sie die alte Datei
cp src/app.js src/app.js.backup
```

### 2. **Module erstellen**
Alle Module sind bereits im `src/modules/` Verzeichnis erstellt.

### 3. **HTML anpassen**
Ändern Sie in `src/index.html`:

**Alt:**
```html
<script src="app.js"></script>
```

**Neu:**
```html
<script type="module" src="app-refactored.js"></script>
```

### 4. **package.json** (optional)
Wenn Sie Build-Tools verwenden, können Sie ModuleResolution konfigurieren.

## 📦 Modul-Beschreibungen

### `state.js`
**Verantwortung**: Zentrale Datenverwaltung
- State-Objekt mit `data` und `settings`
- `loadData()`, `saveData()`, `loadSettings()`, `saveSettings()`
- `loadLogo()`, `saveLogo()`

### `helpers.js`
**Verantwortung**: Utility-Funktionen
- `fmt()`, `today()`, `addDays()`, `nextDate()`, `toast()`
- `formatDatum()`, `fmtEUR()`, `toBase64()`
- Form-Draft-Verwaltung: `saveFormDraft()`, `loadFormDraft()`, `clearFormDraft()`

### `navigation.js`
**Verantwortung**: Navigation und Benutzeroberfläche
- `showSection()`: Wechselt zwischen Sektionen
- `setTopbarActions()`: Aktualisiert Buttons in der Top Bar
- `updateKundeSelect()`: Aktualisiert Kunden-Dropdowns

### `dashboard.js`
**Verantwortung**: Dashboard-Logik
- `updateDashboard()`: Aktualisiert alle Kennzahlen und Übersichten

### `positions.js`
**Verantwortung**: Positionsverwaltung
- `makePosRow()`: Erstellt eine Position-Reihe
- `getPositionen()`: Extrahiert Positionen
- `calcContainer()`: Berechnet Summen

### `rechnungen.js`
**Verantwortung**: Rechnungen und Mahnungswesen
- Rechnungsformular: `showRechnungForm()`, `speichernRechnung()`, `renderRechnungen()`
- Mahnungen: `showMahnungModal()`, `erstelleMahnung()`, `berechneVerzugszinsen()`
- `markBezahlt()`, `loescheRechnung()`, `druckeDokumentById()`

### `angebote.js`
**Verantwortung**: Angebotsverwaltung
- `showAngebotForm()`, `speichernAngebot()`, `renderAngebote()`
- `angebotZuRechnung()`: Konvertiert Angebot zu Rechnung
- `loescheAngebot()`

### `wiederkehrend.js`
**Verantwortung**: Wiederkehrende Rechnungen
- `showRecurForm()`, `speichernRecur()`, `renderWiederkehrend()`
- `ausfuehrenRecur()`: Erstellt Rechnung aus Vorlage
- `loescheRecur()`

### `kunden.js`
**Verantwortung**: Kundenverwaltung
- `showKundeForm()`, `speichernKunde()`, `renderKunden()`
- `loescheKunde()`

### `ausgaben.js`
**Verantwortung**: Ausgaben und KI-Belegerfassung
- `showAusgabeForm()`, `speichernAusgabe()`, `renderAusgaben()`
- KI-OCR: `handleUpload()`, `ausgabeAusOCR()`, `resetUpload()`

### `templates.js`
**Verantwortung**: PDF-Generierung
- `druckeDokument()`: Generiert Rechnungs- und Angebots-PDFs
- `vorschauTemplate()`: Zeigt Template-Vorschau

### `settings.js`
**Verantwortung**: Einstellungen und Konfiguration
- `speichernSettings()`, `ladeSettings()`
- Dark Mode: `applyDarkmode()`, `toggleDarkmode()`
- Logo: `handleLogoUpload()`, `loescheLogo()`, `updateSidebarLogo()`

### `euer.js`
**Verantwortung**: EÜR (Einnahmen-Überschuss-Rechnung)
- `initEUER()`, `renderEUER()`, `druckeEUER()`

### `export.js`
**Verantwortung**: CSV-Export
- `exportCSV()`: Exportiert Daten als CSV-Datei

## 🚀 Verwendung

### Funktionen aufrufen
```javascript
// Alte Art (noch unterstützt)
showRechnungForm();

// Neue Art (mit Import)
import { showRechnungForm } from './modules/rechnungen.js';
showRechnungForm();
```

Durch `Object.assign(window, rechModule)` sind alle Funktionen global verfügbar, daher bleibt die HTML kompatibel.

## 🧪 Testen

```bash
# Funktionalität prüfen
npm start

# In Browser öffnen
http://localhost:3000
```

## 📝 Best Practices

### 1. **Exports nutzen**
```javascript
export function meineFunktion() { }
```

### 2. **Importe an Anfang**
```javascript
import { state, saveData } from './state.js';
```

### 3. **State-Zugriff**
```javascript
// State always über das state-Objekt
state.data.rechnungen
state.settings
```

### 4. **Neue Module hinzufügen**
```javascript
// modules/mein-neues-modul.js
export function neueFunktion() { }

// app-refactored.js
import * as meinModule from './modules/mein-neues-modul.js';
Object.assign(window, meinModule);
```

## ⚠️ Breaking Changes

Keine! Das Refactoring ist vollständig **backward-kompatibel**. Alle Funktionen sind über `window` verfügbar.

## 🔄 Migrationsschritte

1. ✅ Alle Module erstellen
2. ✅ `app-refactored.js` erstellen
3. ✅ HTML aktualisieren: `<script type="module" src="app-refactored.js"></script>`
4. ✅ Testen im Browser
5. ✅ `app.js` als `app.js.old` umbenennen
6. ✅ Optional: `app-refactored.js` zu `app.js` umbenennen

## 📊 Statistiken

| Metrik | Alt | Neu |
|--------|-----|-----|
| Hauptdatei Größe | 1410 Zeilen | ~100 Zeilen |
| Module | 1 | 14 |
| Durchschn. Modulgröße | - | ~100-150 Zeilen |
| Komplexität | Monolith | Modular |
| Wartbarkeit | Schwierig | Leicht |

## 🎯 Nächste Schritte

- [ ] Unit Tests für Module schreiben
- [ ] TypeScript-Definitionen hinzufügen
- [ ] Build-Prozess optimieren
- [ ] Lazy Loading implementieren
- [ ] Dokumentation erweitern

---

**Version**: 1.1.0  
**Datum**: 2024  
**Status**: ✅ Produktionsreif
