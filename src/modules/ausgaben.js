/**
 * Ausgabenmanagement mit LOKALER OCR (Tesseract.js via CDN)
 * KEIN API-KEY erforderlich – 100% offline
 */

import { state, saveData } from './state.js';
import { fmt, today, toast } from './helpers.js';
import { showSection } from './navigation.js';
import { getFinalCategory, validateCategory } from './custom-categories.js';

let ocrWorker = null;

export function showAusgabeForm() {
  document.getElementById('ausgabe-form').style.display = 'block';
  document.getElementById('a-datum').value = today();
  document.getElementById('a-betrag').value = '';
}

export function speichernAusgabe() {
  try {
    // Validiere dass Kategorie eingegeben wurde
    validateCategory('a-kat', 'a-custom-kat');

    // Hole finale Kategorie (custom oder normal)
    const finalCategory = getFinalCategory('a-kat', 'a-custom-kat');

    const a = {
      id: Date.now().toString(),
      datum: document.getElementById('a-datum').value,
      betrag: parseFloat(document.getElementById('a-betrag').value) || 0,
      kategorie: finalCategory.kategorieName,
      kategorieId: finalCategory.kategorieId,
      beschreibung: document.getElementById('a-beschr').value,
    };

    state.data.ausgaben.push(a);
    saveData();
    document.getElementById('ausgabe-form').style.display = 'none';
    renderAusgaben();
    toast('✓ Ausgabe gespeichert');
  } catch (e) {
    toast('❌ ' + e.message);
  }
}

export function renderAusgaben() {
  const tb = document.getElementById('ausgaben-tbody');
  if (!state.data.ausgaben.length) {
    tb.innerHTML = '<tr><td colspan="5" class="empty">Noch keine Ausgaben</td></tr>';
    return;
  }
  tb.innerHTML = state.data.ausgaben.slice().reverse().map((a) =>
    `<tr><td>${a.datum}</td><td>${a.beschreibung}</td><td><span class="badge badge-neutral">${a.kategorie}</span></td><td>${fmt(a.betrag)}</td><td><button class="btn btn-sm btn-danger" onclick="loescheAusgabe('${a.id}')">✕</button></td></tr>`
  ).join('');
}

export function loescheAusgabe(id) {
  if (confirm('Löschen?')) {
    state.data.ausgaben = state.data.ausgaben.filter((a) => a.id != id);
    saveData();
    renderAusgaben();
  }
}

// ═══════════════════════════════════════════════════════════════════
// LOKALE OCR MIT TESSERACT.JS (via CDN)
// ═══════════════════════════════════════════════════════════════════

async function initOCRWorker() {
  if (!ocrWorker) {
    if (!window.Tesseract) {
      throw new Error('Tesseract.js Bibliothek nicht geladen');
    }
    try {
      ocrWorker = await window.Tesseract.createWorker();
      await ocrWorker.loadLanguage('deu');
      await ocrWorker.initialize('deu');
      console.log('✓ OCR-Worker initialisiert');
    } catch (error) {
      console.error('OCR-Worker Fehler:', error);
      throw new Error('OCR-System konnte nicht initialisiert werden: ' + error.message);
    }
  }
  return ocrWorker;
}

export async function handleUpload(input) {
  if (!input.files?.length) return;

  const file = input.files[0];
  const statusEl = document.getElementById('ai-status');
  const resultEl = document.getElementById('ocr-result');

  statusEl.style.display = 'block';
  statusEl.style.color = 'inherit';
  statusEl.innerHTML = '<div class="spinner" style="margin-right:8px;display:inline-block"></div> Initialisiere OCR...';
  resultEl.style.display = 'none';

  try {
    // Validierung
    if (!file.type.startsWith('image/')) {
      throw new Error('Nur Bilder hochladen (JPG, PNG)');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Datei zu groß – max 5MB');
    }

    // Vorschau anzeigen
    const vorschauEl = document.getElementById('beleg-vorschau');
    const vorschauImg = document.getElementById('beleg-vorschau-img');
    const vorschauInfo = document.getElementById('beleg-vorschau-info');
    if (vorschauEl && vorschauImg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        vorschauImg.src = e.target.result;
        vorschauEl.style.display = 'block';
      };
      reader.readAsDataURL(file);
      const sizeKB = (file.size / 1024).toFixed(1);
      vorschauInfo.innerHTML = `${file.name}<br>${sizeKB} KB`;
    }

    // Starte OCR
    statusEl.innerHTML = '<div class="spinner" style="margin-right:8px;display:inline-block"></div> Lade Tesseract.js... (beim ersten Mal ~2-5 Min)';
    const worker = await initOCRWorker();

    statusEl.innerHTML = '<div class="spinner" style="margin-right:8px;display:inline-block"></div> Erkenne Text... (30-60 Sekunden)';

    const result = await worker.recognize(file);
    const text = result.data.text;
    const confidence = result.data.confidence;

    console.log('✓ OCR-Ergebnis:', text);
    console.log('✓ Konfidenz:', confidence);

    if (!text?.trim()?.length) {
      throw new Error('Kein Text erkannt. Klareres Foto verwenden.');
    }

    // Extrahiere Daten
    const extracted = extractOCRData(text);

    // Fülle Formular
    document.getElementById('ocr-datum').value = extracted.datum;
    document.getElementById('ocr-betrag').value = extracted.betrag;
    document.getElementById('ocr-beschr').value = extracted.beschreibung;

    const katSelect = document.getElementById('ocr-kat');
    if (katSelect) {
      for (let opt of katSelect.options) {
        if (opt.value === extracted.kategorie) {
          katSelect.value = extracted.kategorie;
          break;
        }
      }
    }

    statusEl.style.display = 'none';
    resultEl.style.display = 'block';

    const confPercent = Math.round(confidence);
    toast(`✓ Text erkannt (${confPercent}% Sicherheit)`);

  } catch (error) {
    console.error('OCR-Fehler:', error);
    statusEl.innerHTML = `<strong style="color:#d32f2f">❌ Fehler:</strong> ${error.message}`;
    statusEl.style.color = '#d32f2f';
    statusEl.style.display = 'block';
    resultEl.style.display = 'block';
    document.getElementById('ocr-datum').value = today();
    toast(`❌ ${error.message}`);
  }
}

function extractOCRData(text) {
  return {
    datum: extractDate(text),
    betrag: extractAmount(text),
    beschreibung: extractDescription(text),
    kategorie: guessCategory(text),
  };
}

function extractDate(text) {
  const patterns = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return today();
}

function extractAmount(text) {
  const patterns = [
    /(\d+)[,.](\d{2})\s*€/i,
    /€\s*(\d+)[,.](\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return `${match[1]}.${match[2]}`;
    }
  }
  return '';
}

function extractDescription(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l.length > 4 && l.length < 80);

  return lines[0]?.substring(0, 50) || 'Beleg';
}

function guessCategory(text) {
  const lower = text.toLowerCase();

  const keywords = {
    'Büromaterial': ['papier', 'stift', 'drucker', 'toner'],
    'Software/IT': ['software', 'lizenz', 'saas', 'adobe'],
    'Fahrtkosten': ['tanke', 'benzin', 'shell', 'aral'],
    'Telefon/Internet': ['telekom', 'vodafone', 'o2', 'internet'],
    'Weiterbildung': ['kurs', 'training', 'schulung'],
    'Werbung': ['anzeige', 'werbung', 'marketing'],
  };

  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => lower.includes(w))) {
      return cat;
    }
  }
  return 'Sonstiges';
}

export function ausgabeAusOCR() {
  try {
    // Validiere dass Kategorie eingegeben wurde
    validateCategory('ocr-kat', 'ocr-custom-kat');

    const datum = document.getElementById('ocr-datum')?.value;
    const betragStr = document.getElementById('ocr-betrag')?.value;
    const beschreibung = document.getElementById('ocr-beschr')?.value || 'Beleg';

    if (!datum || !betragStr) {
      toast('❌ Datum und Betrag erforderlich');
      return;
    }

    const betrag = parseFloat(betragStr);
    if (isNaN(betrag) || betrag <= 0) {
      toast('❌ Betrag muss größer als 0 sein');
      return;
    }

    // Hole finale Kategorie (custom oder normal)
    const finalCategory = getFinalCategory('ocr-kat', 'ocr-custom-kat');

    const a = {
      id: Date.now().toString(),
      datum,
      betrag,
      kategorie: finalCategory.kategorieName,
      kategorieId: finalCategory.kategorieId,
      beschreibung,
    };

    state.data.ausgaben.push(a);
    saveData();
    resetUpload();
    renderAusgaben();
    toast('✓ Ausgabe aus OCR übernommen');
  } catch (e) {
    toast('❌ ' + e.message);
  }
}

export function resetUpload() {
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  const ocrResult = document.getElementById('ocr-result');
  if (ocrResult) ocrResult.style.display = 'none';
  const aiStatus = document.getElementById('ai-status');
  if (aiStatus) aiStatus.style.display = 'none';
  // Vorschau zurücksetzen
  const vorschau = document.getElementById('beleg-vorschau');
  if (vorschau) vorschau.style.display = 'none';
  const vorschauImg = document.getElementById('beleg-vorschau-img');
  if (vorschauImg) vorschauImg.src = '';
}

window.showAusgabeForm = showAusgabeForm;
window.speichernAusgabe = speichernAusgabe;
window.loescheAusgabe = loescheAusgabe;
window.handleUpload = handleUpload;
window.ausgabeAusOCR = ausgabeAusOCR;
window.resetUpload = resetUpload;
