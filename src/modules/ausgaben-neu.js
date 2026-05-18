/**
 * Ausgabenmanagement mit LOKALER OCR (Tesseract.js)
 * KEIN API-KEY erforderlich – 100% offline
 */

import { state, saveData } from './state.js';
import { fmt, today, toast } from './helpers.js';
import { showSection } from './navigation.js';
import Tesseract from 'tesseract.js';

let ocrWorker = null;

export function showAusgabeForm() {
  document.getElementById('ausgabe-form').style.display = 'block';
  document.getElementById('a-datum').value = today();
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

async function initOCRWorker() {
  if (!ocrWorker) {
    ocrWorker = await Tesseract.createWorker();
    await ocrWorker.loadLanguage('deu');
    await ocrWorker.initialize('deu');
  }
  return ocrWorker;
}

export async function handleUpload(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  const statusEl = document.getElementById('ai-status');
  statusEl.style.display = 'block';
  statusEl.innerHTML = '<div class="spinner" style="margin-right:8px;display:inline-block"></div> Erkenne Beleg...';
  document.getElementById('ocr-result').style.display = 'none';

  try {
    if (!file.type.startsWith('image/')) throw new Error('Nur Bilder (JPG, PNG)');
    if (file.size > 5 * 1024 * 1024) throw new Error('Max 5MB');

    statusEl.innerHTML = '<div class="spinner" style="margin-right:8px;display:inline-block"></div> OCR läuft... (30-60 Sekunden)';
    const worker = await initOCRWorker();
    const result = await worker.recognize(file);
    const text = result.data.text;
    const confidence = result.data.confidence;

    if (!text.trim().length) throw new Error('Kein Text erkannt');

    const p = {
      datum: /(\d{1,2})\.(\d{1,2})\.(\d{4})/.test(text) ? text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)[0].replace(/\./g, (m, i) => i === 2 ? '-' : i === 4 ? '-' : m).split('-').reverse().join('-') : today(),
      betrag: (/(\d{1,3}(?:\.\d{3})*)[,.](\d{2})\s*€/i.exec(text) || ['', '0', '00'])[1] + '.' + (/(\d{1,3}(?:\.\d{3})*)[,.](\d{2})\s*€/i.exec(text) || ['', '0', '00'])[2],
      beschreibung: text.split('\n').find(l => l.trim().length > 5 && l.trim().length < 80) || 'Beleg',
      kategorie: 'Sonstiges'
    };

    document.getElementById('ocr-datum').value = p.datum;
    document.getElementById('ocr-betrag').value = p.betrag;
    document.getElementById('ocr-beschr').value = p.beschreibung.substring(0, 50);

    statusEl.style.display = 'none';
    document.getElementById('ocr-result').style.display = 'block';
    toast(`✓ Erkannt (${Math.round(confidence)}%)`);
  } catch (e) {
    statusEl.innerHTML = `<strong style="color:#d32f2f">❌ ${e.message}</strong>`;
    statusEl.style.color = '#d32f2f';
    document.getElementById('ocr-result').style.display = 'block';
    document.getElementById('ocr-datum').value = today();
  }
}

export function ausgabeAusOCR() {
  const datum = document.getElementById('ocr-datum').value;
  const betrag = parseFloat(document.getElementById('ocr-betrag').value);
  const kategorie = document.getElementById('ocr-kat').value;
  const beschreibung = document.getElementById('ocr-beschr').value || 'Beleg';

  if (!datum || isNaN(betrag) || betrag <= 0) {
    toast('❌ Überprüfe Datum und Betrag');
    return;
  }

  state.data.ausgaben.push({ id: Date.now().toString(), datum, betrag, kategorie, beschreibung });
  saveData();
  resetUpload();
  renderAusgaben();
  showSection('ausgaben');
  toast('✓ Gespeichert');
}

export function resetUpload() {
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  const ocrResult = document.getElementById('ocr-result');
  if (ocrResult) ocrResult.style.display = 'none';
  const aiStatus = document.getElementById('ai-status');
  if (aiStatus) aiStatus.style.display = 'none';
}

window.showAusgabeForm = showAusgabeForm;
window.speichernAusgabe = speichernAusgabe;
window.loescheAusgabe = loescheAusgabe;
window.handleUpload = handleUpload;
window.ausgabeAusOCR = ausgabeAusOCR;
window.resetUpload = resetUpload;
