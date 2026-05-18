/**
 * Ausgabenmanagement mit LOKALER OCR (Tesseract.js)
 * KEIN API-KEY erforderlich – 100% offline
 */

import { state, saveData } from './state.js';
import { fmt, today, toast } from './helpers.js';
import { showSection } from './navigation.js';
import Tesseract from 'tesseract.js';

let ocrWorker = null;

// ═══════════════════════════════════════════════════════════════════
// AUSGABEN-VERWALTUNG
// ═══════════════════════════════════════════════════════════════════

export function showAusgabeForm() {
  document.getElementById('ausgabe-form').style.display = 'block';
  document.getElementById('a-datum').value = today();
  document.getElementById('a-betrag').value = '';
  document.getElementById('a-beschr').value = '';
}

export function speichernAusgabe() {
  const a = {
    id: Date.now().toString(),
    datum: document.getElementById('a-datum').value,
    betrag: parseFloat(document.getElementById('a-betrag').value) || 0,
    kategorie: document.getElementById('a-kat').value,
    beschreibung: document.getElementById('a-beschr').value,
  };

  state.data.ausgaben.push(a);
  saveData();
  document.getElementById('ausgabe-form').style.display = 'none';
  renderAusgaben();
  toast('✓ Ausgabe gespeichert');
}

export function renderAusgaben() {
  const tb = document.getElementById('ausgaben-tbody');

  if (!state.data.ausgaben.length) {
    tb.innerHTML =
      '<tr><td colspan="5" class="empty">Noch keine Ausgaben</td></tr>';
    return;
  }

  tb.innerHTML = state.data.ausgaben
    .slice()
    .reverse()
    .map(
      (a) => `<tr>
    <td>${a.datum}</td>
    <td>${a.beschreibung}</td>
    <td><span class="badge badge-neutral">${a.kategorie}</span></td>
    <td>${fmt(a.betrag)}</td>
    <td><button class="btn btn-sm btn-danger" onclick="loescheAusgabe('${a.id}')">✕</button></td>
  </tr>`
    )
    .join('');
}

export function loescheAusgabe(id) {
  if (confirm('Ausgabe löschen?')) {
    state.data.ausgaben = state.data.ausgaben.filter((a) => a.id != id);
    saveData();
    renderAusgaben();
  }
}

// ═══════════════════════════════════════════════════════════════════
// LOKALE OCR MIT TESSERACT.JS
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialisiert den OCR-Worker
 */
async function initOCRWorker() {
  if (!ocrWorker) {
    try {
      ocrWorker = await Tesseract.createWorker();
      await ocrWorker.loadLanguage('deu');
      await ocrWorker.initialize('deu');
      console.log('✓ OCR-Worker initialisiert');
    } catch (error) {
      console.error('OCR-Worker Fehler:', error);
      throw new Error('OCR-System konnte nicht initialisiert werden');
    }
  }
  return ocrWorker;
}

/**
 * Verarbeitet einen hochgeladenen Beleg mit lokaler OCR
 * 100% offline, kein API-Key erforderlich
 *
 * @param {HTMLInputElement} input - File-Input Element
 */
export async function handleUpload(input) {
  if (!input.files.length) return;

  const file = input.files[0];
  const statusEl = document.getElementById('ai-status');
  statusEl.style.display = 'block';
  statusEl.style.color = 'inherit';
  statusEl.innerHTML =
    '<div class="spinner" style="margin-right:8px;display:inline-block"></div> Initialisiere OCR...';
  document.getElementById('ocr-result').style.display = 'none';

  try {
    // ✅ Validiere Dateityp
    if (!file.type.startsWith('image/')) {
      throw new Error('Bitte nur Bilder hochladen (JPG, PNG).');
    }

    // ✅ Validiere Dateigröße
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(
        `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`
      );
    }

    // ✅ Initialisiere Worker
    statusEl.innerHTML =
      '<div class="spinner" style="margin-right:8px;display:inline-block"></div> Lade OCR-Modell...';
    const worker = await initOCRWorker();

    // ✅ Führe OCR durch
    statusEl.innerHTML =
      '<div class="spinner" style="margin-right:8px;display:inline-block"></div> Erkenne Text... (kann 30-60 Sekunden dauern)';

    const result = await worker.recognize(file);
    const recognizedText = result.data.text;
    const confidence = result.data.confidence;

    console.log('✓ OCR-Ergebnis:', recognizedText);
    console.log('✓ Konfidenz:', confidence);

    if (!recognizedText || recognizedText.trim().length < 5) {
      throw new Error('Konnte keinen Text erkennen. Benutze ein klareres Foto.');
    }

    // ✅ Extrahiere Daten
    const parsed = extractOCRData(recognizedText);

    // ✅ Fülle Formular
    document.getElementById('ocr-datum').value = parsed.datum;
    document.getElementById('ocr-betrag').value = parsed.betrag;
    document.getElementById('ocr-beschr').value = parsed.beschreibung;

    const katSel = document.getElementById('ocr-kat');
    if (katSel) {
      for (let i = 0; i < katSel.options.length; i++) {
        if (katSel.options[i].value === parsed.kategorie) {
          katSel.selectedIndex = i;
          break;
        }
      }
    }

    statusEl.style.display = 'none';
    document.getElementById('ocr-result').style.display = 'block';

    const confPercent = Math.round(confidence);
    const confIcon = confPercent >= 80 ? '✓' : confPercent >= 60 ? '⚠️' : '❌';
    toast(`${confIcon} Text erkannt (${confPercent}% Sicherheit)`);

  } catch (e) {
    console.error('OCR-Fehler:', e);
    statusEl.innerHTML = `<strong style="color:#d32f2f">❌ Fehler:</strong> ${e.message}`;
    statusEl.style.color = '#d32f2f';
    statusEl.style.display = 'block';
    document.getElementById('ocr-result').style.display = 'block';
    document.getElementById('ocr-datum').value = today();
    toast(`❌ Fehler: ${e.message}`);
  }
}

/**
 * Extrahiert Daten aus OCR-Text
 */
function extractOCRData(text) {
  return {
    datum: extractDate(text),
    betrag: extractAmount(text),
    beschreibung: extractDescription(text),
    kategorie: guessCategory(text),
  };
}

/**
 * Extrahiert Datum
 */
function extractDate(text) {
  const patterns = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
    /(\d{1,2})\.(\d{1,2})\.(\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let [, day, month, year] = match;
      if (year.length === 2) year = '20' + year;
      day = day.padStart(2, '0');
      month = month.padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return today();
}

/**
 * Extrahiert Betrag
 */
function extractAmount(text) {
  // Suche nach Euro-Mustern
  const patterns = [
    /(\d{1,3}(?:\.\d{3})*)[,.](\d{2})\s*€/i,
    /€\s*(\d{1,3}(?:\.\d{3})*)[,.](\d{2})/i,
    /Summe.*?[\s:]+(\d+)[,.](\d{2})/i,
    /Gesamt.*?[\s:]+(\d+)[,.](\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = match[1].replace(/\./g, '').replace(/,/, '.');
      if (!amount.includes('.')) {
        amount = match[1] + '.' + match[2];
      }
      return amount;
    }
  }

  return '';
}

/**
 * Extrahiert Beschreibung
 */
function extractDescription(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l.length > 2);

  for (const line of lines) {
    if (line.length > 4 && line.length < 80 && !line.match(/^\d+/) && !line.match(/€/)) {
      return line.substring(0, 50);
    }
  }

  return 'Beleg';
}

/**
 * Errät Kategorie
 */
function guessCategory(text) {
  const lower = text.toLowerCase();

  const keywords = {
    'Büromaterial': ['papier', 'stift', 'drucker', 'toner', 'office', 'büro'],
    'Software/IT': ['software', 'lizenz', 'saas', 'adobe', 'microsoft', 'app'],
    'Fahrtkosten': ['tanke', 'benzin', 'shell', 'aral', 'esso', 'auto', 'liter'],
    'Telefon/Internet': ['telekom', 'vodafone', 'o2', 'internet', 'dsl', 'provider'],
    'Weiterbildung': ['kurs', 'training', 'schulung', 'seminar', 'udemy'],
    'Werbung': ['anzeige', 'werbung', 'marketing', 'print', 'facebook'],
  };

  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => lower.includes(w))) {
      return cat;
    }
  }

  return 'Sonstiges';
}

/**
 * Speichert erkannte Ausgabe
 */
export function ausgabeAusOCR() {
  const datum = document.getElementById('ocr-datum')?.value;
  const betragStr = document.getElementById('ocr-betrag')?.value;
  const kategorie = document.getElementById('ocr-kat')?.value;
  const beschreibung = document.getElementById('ocr-beschr')?.value;

  if (!datum) {
    toast('❌ Fehler: Datum erforderlich');
    return;
  }

  const betrag = parseFloat(betragStr);
  if (isNaN(betrag) || betrag <= 0) {
    toast('❌ Fehler: Betrag muss > 0 sein');
    return;
  }

  const a = {
    id: Date.now().toString(),
    datum,
    betrag,
    kategorie,
    beschreibung: beschreibung || 'Beleg',
  };

  state.data.ausgaben.push(a);
  saveData();
  resetUpload();
  renderAusgaben();
  showSection('ausgaben');
  toast('✓ Ausgabe gespeichert');
}

/**
 * Setzt Upload zurück
 */
export function resetUpload() {
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  const ocrResult = document.getElementById('ocr-result');
  if (ocrResult) ocrResult.style.display = 'none';
  const aiStatus = document.getElementById('ai-status');
  if (aiStatus) aiStatus.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════════
// WINDOW EXPORTS
// ═══════════════════════════════════════════════════════════════════

window.showAusgabeForm = showAusgabeForm;
window.speichernAusgabe = speichernAusgabe;
window.loescheAusgabe = loescheAusgabe;
window.handleUpload = handleUpload;
window.ausgabeAusOCR = ausgabeAusOCR;
window.resetUpload = resetUpload;
