# Buchhaltung-App - Build-Anleitung

## Voraussetzungen

- **Node.js** (Version 16 oder höher) - [Download](https://nodejs.org/)
- **npm** (wird mit Node.js installiert)

## Installation der Dependencies

1. Öffne eine Kommandozeile (CMD oder PowerShell) im Projektordner
2. Führe folgenden Befehl aus:

```bash
npm install
```

Dies installiert:
- Electron (v28.0.0)
- electron-builder (v24.0.0)

## App starten (Development)

Um die App während der Entwicklung zu testen:

```bash
npm start
```

## EXE-Datei erstellen

### Option 1: Installer (NSIS)
Erstellt einen Windows-Installer mit Deinstallationsprogramm:

```bash
npm run build
```

Die fertige Datei findest du in: `dist/Buchhaltung Setup 1.0.0.exe`

### Option 2: Portable EXE
Erstellt eine portable ausführbare Datei ohne Installation:

```bash
npm run build-portable
```

Die fertige Datei findest du in: `dist/Buchhaltung-1.0.0-Portable.exe`

### Beide Varianten erstellen

```bash
npm run build
```

Dies erstellt beide Versionen (Installer + Portable).

## Build-Ausgabe

Nach dem erfolgreichen Build findest du im `dist/` Ordner:

- **Buchhaltung Setup 1.0.0.exe** - Installer für Windows
- **Buchhaltung-1.0.0-Portable.exe** - Portable Version (direkt ausführbar)
- **win-unpacked/** - Entpackte Dateien (für Entwicklung)

## Icon hinzufügen (optional)

Um ein eigenes Icon zu verwenden:

1. Erstelle eine `icon.ico` Datei (256x256px empfohlen)
2. Lege sie im Projektroot ab
3. Führe den Build erneut aus

## Fehlerbehebung

### "electron-builder: command not found"
```bash
npm install electron-builder --save-dev
```

### Build schlägt fehl
1. Lösche `node_modules` und `dist`
2. Führe erneut `npm install` aus
3. Starte den Build neu

### App startet nicht
- Prüfe, ob alle Dateien im `src/` Ordner vorhanden sind
- Stelle sicher, dass `main.js`, `package.json` und `preload.js` im Root liegen

## Datenspeicherung

Die App speichert alle Daten lokal in:
- Windows: `%APPDATA%/buchhaltung-app/`
  - `buchhaltung_data.json` - Alle Daten (Kunden, Rechnungen, etc.)
  - `buchhaltung_settings.json` - Einstellungen

## Neue Features seit letztem Update

✅ **Auto-Save Formulare**: Eingaben in Formularen werden automatisch gespeichert und nach einem Reload wiederhergestellt
✅ **Portable Build**: EXE-Datei ohne Installation verfügbar
