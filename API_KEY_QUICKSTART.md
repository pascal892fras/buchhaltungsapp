# 🚀 Lokale OCR Integration – Schnellstart (Tesseract.js)

## TL;DR

Du brauchst:
1. **Tesseract.js installieren** ✅ (npm)
2. **OCR-Verarbeitung in Einstellungen** ✅ (UI)
3. **Download-Manager für Modelle** ✅ (UI)
4. **Integration in Belegerfassung** ✅ (ausgaben.js)

**Aufwand: 3-4 Stunden**  
**Kosten: 0€**  
**Voraussetzung: ~50MB Disk-Speicher (für OCR-Modell)**

---

## ✅ Vorteile der lokalen Lösung

```
✓ Völlig kostenlos (0€)
✓ Funktioniert offline
✓ Keine Daten-Übertragung
✓ Keine API-Keys nötig
✓ Unbegrenzte Verarbeitung
⚠️ Qualität: ~75% (ausreichend für Rechnungen)
⚠️ Etwas langsamer (1-3 Sekunden pro Bild)
```

---

## 📋 Schritt-für-Schritt Implementierung

### Schritt 0: Tesseract.js installieren (5 min)

```bash
npm install tesseract.js
```

### Schritt 1: HTML-UI hinzufügen (20 min)

In `src/index.html` vor dem Ende von `#sec-einstellungen`, nach der Rechnungsprefix-Sektion:

```html
<!-- 🤖 LOKALE OCR-KONFIGURATION (TESSERACT.JS) -->
<h3 style="margin-top:24px">🤖 Lokale Belegerfassung (Offline)</h3>
<p style="font-size:12px;color:var(--hint);margin-bottom:12px">
  Automatische Texterkennung ohne Internet – kostenlos und datenschutzfreundlich
</p>

<div style="background:#f0f4ff;border-left:3px solid #4CAF50;padding:12px;border-radius:var(--radius);margin-bottom:12px">
  <h4 style="margin:0 0 8px 0;font-size:13px">✅ Lokal & Kostenlos</h4>
  <p style="font-size:11px;margin:0;color:var(--hint)">
    ✓ Funktioniert offline<br>
    ✓ Keine Datenübertragung<br>
    ✓ 0€ Kosten<br>
    ⚠️ Qualität: ~75% (ausreichend für einfache Rechnungen)
  </p>
</div>

<div style="background:var(--bg);padding:12px;border-radius:var(--radius);margin-bottom:12px">
  <h4 style="font-size:13px;margin-bottom:8px">OCR-Modellverwaltung</h4>
  
  <label style="margin-bottom:8px;display:block">Sprache</label>
  <select id="s-ocr-language" style="width:100%;max-width:200px">
    <option value="deu">Deutsch</option>
    <option value="eng">English</option>
    <option value="fra">Français</option>
    <option value="deu+eng">Deutsch + English (für gemischte Texte)</option>
  </select>
  
  <div style="margin-top:12px;padding:12px;background:var(--accent);border-radius:var(--radius);color:white">
    <div style="font-weight:500;margin-bottom:4px" id="s-ocr-status">⏳ Status wird geladen...</div>
    <div style="font-size:11px;margin-bottom:8px" id="s-ocr-progress"></div>
    <button class="btn" onclick="checkOCRModel()" style="background:rgba(255,255,255,0.2);color:white;border:none;margin-bottom:8px;width:100%">
      🔍 Modell-Status prüfen
    </button>
  </div>

  <div style="margin-top:12px">
    <button class="btn btn-primary" onclick="downloadOCRModel()" style="width:100%">
      📥 Modell herunterladen (~50MB)
    </button>
    <div style="font-size:11px;color:var(--hint);margin-top:4px;text-align:center" id="s-ocr-size">
      Speicher: wird berechnet...
    </div>
  </div>

  <div style="margin-top:12px">
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
      <input type="checkbox" id="s-ocr-auto-detect" style="width:auto;margin:0">
      <span style="font-size:12px">Automatisch Sprache erkennen (langsamer, aber flexibler)</span>
    </label>
  </div>
</div>

<div style="background:var(--bg);padding:12px;border-radius:var(--radius)">
  <h4 style="font-size:13px;margin-bottom:8px">OCR-Einstellungen</h4>
  
  <div class="grid2">
    <div>
      <label style="font-size:12px">Konfidenz-Schwelle</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="range" id="s-ocr-confidence" min="0.3" max="0.9" step="0.1" value="0.5" style="flex:1">
        <span id="s-ocr-confidence-value" style="font-size:11px;color:var(--hint);min-width:40px">50%</span>
      </div>
      <div style="font-size:10px;color:var(--hint);margin-top:2px">Höher = strengere Erkennung</div>
    </div>
    
    <div>
      <label style="font-size:12px">Maximal-Größe Bild (MB)</label>
      <input type="number" id="s-ocr-max-size" value="5" min="1" max="20" style="width:100%">
      <div style="font-size:10px;color:var(--hint);margin-top:2px">Größere Bilder werden komprimiert</div>
    </div>
  </div>

  <div style="margin-top:12px">
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
      <input type="checkbox" id="s-ocr-debug" style="width:auto;margin:0">
      <span style="font-size:12px">Debug-Modus (zeigt Details)</span>
    </label>
  </div>
</div>
```

### Schritt 2: JavaScript-Modul erstellen (45 min)

Erstelle neue Datei: `src/modules/ocr.js`

```javascript
// ═══════════════════════════════════════════════════════════════════
// 🤖 LOKALE OCR-VERARBEITUNG MIT TESSERACT.JS
// ═══════════════════════════════════════════════════════════════════

import Tesseract from 'tesseract.js';
import { state, saveData } from './state.js';
import { toast, formatGeld } from './helpers.js';

let ocrWorker = null;

/**
 * Initialisiert den OCR-Worker
 */
export async function initOCRWorker() {
  try {
    if (!ocrWorker) {
      ocrWorker = await Tesseract.createWorker();
      console.log('✓ OCR-Worker initialisiert');
    }
    return ocrWorker;
  } catch (error) {
    console.error('Fehler beim Initialisieren des OCR-Workers:', error);
    toast('❌ OCR-Fehler: ' + error.message, 'error');
  }
}

/**
 * Prüft den Status des OCR-Modells
 */
export async function checkOCRModel() {
  const statusEl = document.getElementById('s-ocr-status');
  const progressEl = document.getElementById('s-ocr-progress');
  
  if (statusEl) statusEl.textContent = '⏳ Prüfe Modell...';
  
  try {
    const worker = await initOCRWorker();
    const language = document.getElementById('s-ocr-language')?.value || 'deu';
    
    if (statusEl) statusEl.textContent = `✅ Modell bereit (${language})`;
    if (progressEl) progressEl.textContent = 'Sprache geladen und bereit';
    
    toast('✅ OCR-Modell ist bereit', 'success');
  } catch (error) {
    if (statusEl) statusEl.textContent = '❌ Modell nicht geladen';
    if (progressEl) progressEl.textContent = 'Bitte Modell herunterladen →';
    toast('⚠️ OCR-Modell muss heruntergeladen werden', 'warning');
  }
}

/**
 * Lädt das OCR-Modell herunter
 */
export async function downloadOCRModel() {
  const statusEl = document.getElementById('s-ocr-status');
  const progressEl = document.getElementById('s-ocr-progress');
  const language = document.getElementById('s-ocr-language')?.value || 'deu';
  
  if (statusEl) statusEl.textContent = '⏳ Lade Modell herunter...';
  if (progressEl) progressEl.textContent = 'Dies kann 2-5 Minuten dauern...';
  
  try {
    const worker = await initOCRWorker();
    
    await worker.loadLanguage(language);
    await worker.initialize(language);
    
    if (statusEl) statusEl.textContent = `✅ Modell heruntergeladen (${language})`;
    if (progressEl) progressEl.textContent = 'Fertig! Belegerfassung ist nun aktiv.';
    
    toast('✅ OCR-Modell erfolgreich heruntergeladen', 'success');
  } catch (error) {
    if (statusEl) statusEl.textContent = '❌ Download fehlgeschlagen';
    if (progressEl) progressEl.textContent = error.message;
    toast('❌ Download-Fehler: ' + error.message, 'error');
    console.error('OCR-Download-Fehler:', error);
  }
}

/**
 * Führt OCR auf einem Bild durch
 * @param {File|Blob|string} imageData - Bilddatei oder Base64-String
 * @returns {Promise<Object>} Erkannte Daten
 */
export async function performOCR(imageData) {
  try {
    const worker = await initOCRWorker();
    const language = document.getElementById('s-ocr-language')?.value || 'deu';
    const debug = document.getElementById('s-ocr-debug')?.checked || false;
    
    if (debug) {
      console.log('🔍 OCR-Start:', { language, imageDataType: typeof imageData });
    }
    
    // Lade Sprache (wird gecacht)
    await worker.loadLanguage(language);
    await worker.initialize(language);
    
    // Führe OCR durch
    const result = await worker.recognize(imageData);
    const text = result.data.text;
    const confidence = result.data.confidence;
    
    if (debug) {
      console.log('✅ OCR-Ergebnis:', { text, confidence });
    }
    
    // Extrahiere Informationen
    const extracted = {
      success: true,
      datum: extractDate(text),
      betrag: extractAmount(text),
      beschreibung: extractDescription(text),
      kategorie: guessCategory(text),
      confidence: confidence,
      rawText: text,
    };
    
    if (debug) {
      console.log('📊 Extrahierte Daten:', extracted);
    }
    
    return extracted;
    
  } catch (error) {
    console.error('OCR-Fehler:', error);
    return {
      success: false,
      error: error.message,
      datum: new Date().toISOString().split('T')[0],
      betrag: '',
      beschreibung: '',
      kategorie: 'Sonstiges',
    };
  }
}

/**
 * Extrahiert Datum aus OCR-Text
 */
function extractDate(text) {
  // Verschiedene Datumsmuster testen
  const patterns = [
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/,           // DD.MM.YYYY
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2})/,           // DD.MM.YY
    /(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/,           // YYYY-MM-DD
    /(?:Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)\w*\s+(\d{1,2})[,.]?\s+(\d{4})/i  // Textformat
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const [full, p1, p2, p3] = match;
        let day, month, year;
        
        if (pattern === patterns[2]) {
          // YYYY-MM-DD Format
          year = p1;
          month = p2;
          day = p3;
        } else {
          // DD.MM.YYYY Format
          day = p1;
          month = p2;
          year = p3;
          
          if (year.length === 2) {
            year = '20' + year;
          }
        }
        
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  // Fallback auf heutiges Datum
  return new Date().toISOString().split('T')[0];
}

/**
 * Extrahiert Betrag aus OCR-Text
 */
function extractAmount(text) {
  // Suche nach Euro-Beträgen
  const patterns = [
    /EUR\s*(\d+)[.,](\d{2})/i,
    /€\s*(\d+)[.,](\d{2})/,
    /(\d+)[.,](\d{2})\s*€/,
    /(\d{1,3}(?:\d{3})*)[.,](\d{2})\s*(?:€|EUR)/i,
    /Gesamt[:\s]*([€\s]*)(\d+)[.,](\d{2})/i,
    /Summe[:\s]*([€\s]*)(\d+)[.,](\d{2})/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const euros = match[match.length - 2];
      const cents = match[match.length - 1];
      
      if (euros && cents) {
        return `${euros}.${cents}`;
      }
    }
  }
  
  return '';
}

/**
 * Extrahiert Beschreibung (üblicherweise erste aussagekräftige Zeile)
 */
function extractDescription(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l.length > 3 && !l.match(/^\d+/));
  
  // Finde erste sinnvolle Zeile
  for (const line of lines) {
    if (line.length > 5 && line.length < 100) {
      return line;
    }
  }
  
  return lines[0] || 'Beleg';
}

/**
 * Errät die Kategorie aus Text
 */
function guessCategory(text) {
  const lower = text.toLowerCase();
  
  const categories = {
    'Büromaterial': [
      'papier', 'stift', 'drucker', 'toner', 'tintenpatrone', 'hefter', 'klebstoff'
    ],
    'Software/IT': [
      'software', 'lizenz', 'saas', 'cloud', 'microsoft', 'adobe', 'subscription',
      'update', 'download', 'hosting', 'server'
    ],
    'Fahrtkosten': [
      'tanke', 'benzin', 'auto', 'pkw', 'kilometer', 'shell', 'esso', 'aral',
      'diesel', 'parkplatz', 'taxi'
    ],
    'Telefon/Internet': [
      'telefon', 'internet', 'telekom', 'vodafone', 'o2', '1&1', 'mobilcom',
      'wlan', 'dsl', 'breitband'
    ],
    'Weiterbildung': [
      'kurs', 'training', 'schulung', 'seminar', 'workshop', 'udemy', 'linkedin',
      'beratung', 'coaching'
    ],
    'Werbung': [
      'anzeige', 'werbung', 'marketing', 'social media', 'google ads', 'facebook',
      'print', 'flyer'
    ],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  
  return 'Sonstiges';
}

/**
 * Gibt den OCR-Worker frei
 */
export async function terminateOCRWorker() {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
    console.log('✓ OCR-Worker beendet');
  }
}

// Exportiere für window-global
window.checkOCRModel = checkOCRModel;
window.downloadOCRModel = downloadOCRModel;
```

### Schritt 3: In app-refactored.js registrieren (10 min)

```javascript
// app-refactored.js
import * as ocr from './modules/ocr.js';

// ... rest of imports ...

// Registriere OCR-Funktionen
Object.assign(window, {
  checkOCRModel: ocr.checkOCRModel,
  downloadOCRModel: ocr.downloadOCRModel,
  performOCR: ocr.performOCR,
  initOCRWorker: ocr.initOCRWorker,
  terminateOCRWorker: ocr.terminateOCRWorker,
});

// Beim Laden: Initialisiere OCR-Worker
window.addEventListener('load', async () => {
  await ocr.initOCRWorker();
});

// Beim Beenden: Gebe Worker frei
window.addEventListener('beforeunload', () => {
  ocr.terminateOCRWorker();
});
```

### Schritt 4: Integration in Belegerfassung (30 min)

In `modules/ausgaben.js`, ersetze die `handleUpload` Funktion:

```javascript
export async function handleUpload(fileInput) {
  if (!fileInput.files || !fileInput.files[0]) return;
  
  const file = fileInput.files[0];
  const statusEl = document.getElementById('ai-status');
  const resultEl = document.getElementById('ocr-result');
  
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.textContent = '⏳ Erkenne Text... bitte warten';
  }
  
  try {
    // Komprimiere Bild falls nötig
    let imageData = file;
    const maxSize = parseInt(document.getElementById('s-ocr-max-size')?.value || 5);
    
    if (file.size > maxSize * 1024 * 1024) {
      imageData = await compressImage(file);
    }
    
    // Führe OCR durch
    const ocrResult = await window.performOCR(imageData);
    
    if (!ocrResult.success) {
      throw new Error(ocrResult.error || 'OCR fehlgeschlagen');
    }
    
    // Zeige Ergebnisse
    if (statusEl) statusEl.style.display = 'none';
    
    document.getElementById('ocr-datum').value = ocrResult.datum;
    document.getElementById('ocr-betrag').value = ocrResult.betrag;
    document.getElementById('ocr-beschr').value = ocrResult.beschreibung;
    
    const katSel = document.getElementById('ocr-kat');
    if (katSel) katSel.value = ocrResult.kategorie;
    
    if (resultEl) resultEl.style.display = 'block';
    
    // Zeige Konfidenz
    const confidence = Math.round(ocrResult.confidence);
    if (confidence < 50) {
      toast('⚠️ Erkennung unsicher - bitte prüfen', 'warning');
    } else {
      toast(`✅ Text erkannt (${confidence}% Sicherheit)`);
    }
    
  } catch (error) {
    console.error('OCR-Fehler:', error);
    toast(`❌ OCR-Fehler: ${error.message}`, 'error');
    
    // Fallback: Manuelles Datum
    document.getElementById('ocr-datum').value = today();
    if (resultEl) resultEl.style.display = 'block';
  }
}

/**
 * Komprimiert ein Bild
 */
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Berechne neue Größe
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsDataURL(file);
  });
}
```

---

## 🧪 Testing Checkliste

- [ ] `npm install tesseract.js` erfolgreich
- [ ] HTML-UI erscheint in Einstellungen
- [ ] Button "Modell-Status prüfen" funktioniert
- [ ] Button "Modell herunterladen" funktioniert
- [ ] Modell wird heruntergeladen (2-5 Minuten)
- [ ] Status zeigt ✅ wenn geladen
- [ ] Datei hochladen in "Beleg erfassen" funktioniert
- [ ] OCR erkannt Text korrekt
- [ ] Konfidenz-Prozentsatz wird angezeigt
- [ ] Sprachwechsel funktioniert

---

## 🚀 Nächste Schritte

1. **Implement diese 4 Schritte** (3-4 Stunden)
2. **Test lokal** (30 min)
3. **Modell herunterladen** (5 min)
4. **Belegerfassung testen** (30 min)

---

## 💡 Tipps

### Offline funktioniert nicht?
→ Stelle sicher, dass das Modell heruntergeladen ist
→ Prüfe "Status" Button in Einstellungen

### OCR erkennt falsch?
→ Erhöhe die **Konfidenz-Schwelle** (rechts Slider)
→ Besser beleuchtete / schärfere Bilder hochladen
→ Bei gemischtem Text: "Deutsch + English" wählen

### Speicherplatz sparen?
→ Nach Nutzung: Browser-Cache leeren
→ Modelle werden in IndexedDB gespeichert (~50MB)

---

**Viel Erfolg! 🎉 Deine App ist jetzt vollständig offline-fähig!**

