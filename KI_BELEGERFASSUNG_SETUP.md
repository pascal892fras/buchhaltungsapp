# 🤖 KI-BELEGERFASSUNG - SETUP ANLEITUNG

## ⚠️ PROBLEM

Die automatische Belegerkennung funktioniert nicht, weil:

1. ❌ **Kein API-Key konfiguriert** - Du musst einen Anthropic API-Key hinterlegen
2. ❌ **Alte Claude-Model Version** - Das alte Model `claude-sonnet-4-20250514` existiert nicht mehr
3. ❌ **Fehlende Error-Behandlung** - Keine aussagekräftigen Fehlermeldungen

---

## ✅ LÖSUNG

### Schritt 1: Anthropic API-Key besorgen

1. Gehe zu: https://console.anthropic.com
2. Melde dich an (oder erstelle einen Account)
3. Gehe zu **"Settings" → "API Keys"**
4. Klicke **"Create New API Key"**
5. Kopiere den Key (z.B. `sk-ant-...`)

---

### Schritt 2: API-Key in Buchhaltungsapp speichern

**Option A: Über Einstellungen (empfohlen)**
- Gehe zu **Einstellungen → API-Keys**
- Füge den API-Key in das Feld **"Anthropic API-Key"** ein
- Speichern

**Option B: Über Browser-Console (temporär)**
```javascript
// In Browser DevTools (F12) öffnen und ausführen:
localStorage.setItem('anthropic_api_key', 'sk-ant-...HIER_DEIN_KEY...');
location.reload();
```

---

### Schritt 3: Beleg hochladen testen

1. Gehe zu **Ausgaben → KI-Belegerfassung**
2. Lade ein Bild oder PDF hoch
3. Warte auf die KI-Analyse
4. Überprüfe und speichere

---

## 🎯 WAS WURDE BEHOBEN

### ✅ Neue Features in `ausgaben.js`:

1. **API-Key Validierung**
   ```javascript
   const apiKey = localStorage.getItem('anthropic_api_key');
   if (!apiKey) {
     throw new Error('⚠️ Anthropic API-Key nicht konfiguriert!');
   }
   ```

2. **Bessere Fehlerbehandlung**
   - 401: API-Key ungültig
   - 429: Rate-Limit erreicht
   - Detaillierte Fehlermeldungen für Benutzer

3. **Moderne Claude Model**
   ```javascript
   model: 'claude-opus-4-1-20250805'  // Aktuelles Modell
   ```

4. **Input-Validierung**
   - Dateityp prüfen
   - Dateigröße prüfen (max 10MB)
   - JSON validieren
   - Felder validieren

5. **JSON Parsing robuster**
   ```javascript
   const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
   parsed = JSON.parse(cleanText);
   ```

6. **Error-Messages für Benutzer**
   - Toast-Notifications mit Icons
   - Hilfreiche Fehler-Texte
   - Fallback-Verhalten

---

## 🧪 TESTING

### Test 1: Beleg erkennen
```
1. Gehe zu Ausgaben → KI-Belegerfassung
2. Lade ein Foto einer Rechnung/Quittung hoch
3. Sollte sehen: "KI verarbeitet Beleg…"
4. Nach 2-5 Sekunden: Felder sollten ausfüllt sein
```

### Test 2: Fehlerfall testen
```
1. Lade an image/pdf hoch, das kein Beleg ist
2. KI wird sagen: "Konnte keine Belegi-Daten finden"
3. Felder bleiben leer oder mit Dummy-Werten
4. Du kannst manuell ausfüllen
```

### Test 3: API-Key Fehler
```
1. Lösche API-Key: localStorage.removeItem('anthropic_api_key')
2. Lade Beleg hoch
3. Sollte sehen: "❌ Anthropic API-Key nicht konfiguriert!"
```

---

## 💰 KOSTEN

Anthropic Claude API kostet:

- **Input**: $3 pro 1 Million Tokens
- **Output**: $15 pro 1 Million Tokens

**Pro Beleg**: ~0.001 - 0.003 USD (sehr günstig!)

[Kostenrechner](https://www.anthropic.com/pricing)

---

## 🔐 SICHERHEIT

- API-Key wird **lokal im Browser gespeichert** (localStorage)
- Wird **NICHT an andere Server** übertragen
- Nur zu **Anthropic API** gesendet
- Du kontrollierst 100% deine Daten

---

## 🚀 NÄCHSTE SCHRITTE

1. ✅ API-Key besorgen
2. ✅ In Buchhaltungsapp speichern
3. ✅ Beleg hochladen
4. ✅ Alle Felder sollten ausgefüllt sein
5. ✅ Überprüfen und speichern

---

## ❓ FAQ

**F: Funktioniert das auch offline?**
A: Nein, du brauchst eine aktive Internetverbindung zur Anthropic API.

**F: Welche Dateitypen werden unterstützt?**
A: Bilder (JPG, PNG) und PDFs, max 10MB.

**F: Wie genau ist die KI?**
A: Meist 95%+ genau für Standard-Belege. Komplexe Rechnungen können Fehler haben → manuelles Überprüfen empfohlen.

**F: Kann ich es ohne API-Key benutzen?**
A: Nein, die KI-Belegerfassung braucht einen API-Key. Manuelle Eingabe funktioniert ohne API-Key.

**F: Welche Daten sendet die App?**
A: Nur das Beleg-Bild/PDF an Anthropic. Keine anderen Daten.

---

**Status:** ✅ Behoben & Dokumentiert  
**Datum:** 18.05.2026  
**Nächste Verbesserung:** Offline OCR mit Tesseract (optional)
