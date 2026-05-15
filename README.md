# 📒 Buchhaltung App

Eine schlanke Desktop-Buchhaltungssoftware für Kleingewerbetreibende und Freelancer – gebaut mit **Electron**. Alle Daten bleiben lokal auf deinem Rechner. Keine Cloud, kein Abo, keine Datenweitergabe.

---

## ✨ Funktionen

| Bereich | Details |
|---|---|
| 📊 **Dashboard** | Übersicht über offene Rechnungen, Einnahmen und Ausgaben |
| 🧾 **Rechnungen** | Erstellen, verwalten & als PDF exportieren |
| 📄 **Angebote** | Angebote schreiben und als PDF ausgeben |
| 🔁 **Wiederkehrend** | Automatisch wiederkehrende Buchungen verwalten |
| 👤 **Kunden** | Kundenstammdaten pflegen |
| 💸 **Ausgaben** | Betriebsausgaben erfassen und kategorisieren |
| 🤖 **KI-Belegerfassung** | Belege per KI automatisch auslesen und eintragen |
| ⚠️ **Mahnungen** | Mahnwesen mit Verzugszinsen und Mahngebühren |
| 📈 **EÜR** | Einnahmen-Überschuss-Rechnung auf Knopfdruck |
| 📤 **CSV-Export** | Daten als CSV-Datei exportieren |
| 🎨 **Vorlagen** | Anpassbares PDF-Layout (Farben, Logo-Position, Tabellenstil) |
| 🌙 **Dark Mode** | Helles und dunkles Design wählbar |
| 💾 **Auto-Backup** | Automatische Datensicherung (letzte 10 Versionen) |

---

## 🗂️ Projektstruktur

```
buchhaltungsapp/
├── main.js           # Electron-Hauptprozess (IPC, PDF, CSV, Backup)
├── preload.js        # Context-Bridge zwischen Main & Renderer
├── icon.ico          # App-Icon
├── package.json      # Abhängigkeiten & Build-Konfiguration
├── src/
│   ├── index.html    # Benutzeroberfläche (Renderer)
│   ├── app.js        # Gesamte App-Logik (Kunden, Rechnungen, etc.)
│   └── styles.css    # Styling
└── README.md
```

---

## 🚀 Entwicklung starten

### Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 16 oder höher)
- npm (wird mit Node.js mitinstalliert)

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/pascal892fras/buchhaltungsapp.git
cd buchhaltungsapp

# 2. Abhängigkeiten installieren
npm install

# 3. App starten
npm start
```

---

## 📦 EXE-Datei erstellen

> **Hinweis:** Der Build muss auf einem **Windows-System** durchgeführt werden, um eine `.exe` zu erzeugen.

### Voraussetzungen

```bash
npm install
```

### Option 1 – Windows Installer (empfohlen)

Erstellt einen klassischen Setup-Wizard mit Deinstallationsprogramm und Desktop-Verknüpfung:

```bash
npm run build
```

Ausgabe: `dist/Buchhaltung Setup 1.0.0.exe`

### Option 2 – Portable EXE

Erstellt eine einzelne `.exe` ohne Installation – direkt ausführbar, z. B. vom USB-Stick:

```bash
npm run build-portable
```

Ausgabe: `dist/Buchhaltung-1.0.0-Portable.exe`

### Beide Varianten auf einmal

```bash
npm run build
```

Dieser Befehl erstellt automatisch beide Versionen (Installer + Portable) im `dist/`-Ordner.

---

## 📁 Datenspeicherung

Alle Daten werden **lokal** gespeichert unter:

```
Windows: %APPDATA%\buchhaltung-app\
```

| Datei | Inhalt |
|---|---|
| `buchhaltung_data.json` | Kunden, Rechnungen, Angebote, Ausgaben |
| `buchhaltung_settings.json` | App-Einstellungen und Firmendaten |
| `buchhaltung_logo.txt` | Firmenlogo (Base64) |
| `backups/` | Automatische Backups (max. 10 Versionen) |

---

## 🔧 Fehlerbehebung

**`electron-builder: command not found`**
```bash
npm install electron-builder --save-dev
```

**Build schlägt fehl**
```bash
# node_modules und dist löschen, dann neu installieren
rm -rf node_modules dist
npm install
npm run build
```

**App startet nicht**
- Prüfe, ob alle Dateien im `src/`-Ordner vorhanden sind
- Stelle sicher, dass `main.js`, `preload.js` und `package.json` im Root-Verzeichnis liegen

---

## 🛠️ Tech Stack

- [Electron](https://www.electronjs.org/) v28
- [electron-builder](https://www.electron.build/) v24
- Vanilla JavaScript / HTML / CSS

---

## 📄 Lizenz

Dieses Projekt ist für den privaten und gewerblichen Eigengebrauch freigegeben.
