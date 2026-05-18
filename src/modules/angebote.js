/**
 * Angebotsverwaltung
 */

import { state, saveData } from './state.js';
import { fmt, today, toast, loadFormDraft, clearFormDraft } from './helpers.js';
import { makePosRow, getPositionen, calcContainer } from './positions.js';
import { updateKundeSelect, showSection } from './navigation.js';
import { druckeDokument } from './templates.js';

let angPosC = 0;

export function addAngPos() {
  makePosRow('ang-positionen', angPosC++, 'calcAng');
}

export function calcAng() {
  calcContainer('ang-positionen', 'ang-gesamt');
}

export function showAngebotForm() {
  document.getElementById('angebot-liste').style.display = 'none';
  const form = document.getElementById('angebot-form');
  form.style.display = 'block';

  // Versuche Draft zu laden
  if (loadFormDraft('angebot-form')) {
    updateKundeSelect('ang-kunde');
    calcAng();
    toast('Entwurf wiederhergestellt');
    return;
  }

  document.getElementById('ang-datum').value = today();
  const g = new Date();
  g.setDate(g.getDate() + 30);
  document.getElementById('ang-gueltig').value = g.toISOString().split('T')[0];
  document.getElementById('ang-nr').value = (state.settings.angprefix || 'ANG') + '-' +
    new Date().getFullYear() + '-' + String(state.data.angebote.length + 1).padStart(3, '0');
  document.getElementById('ang-fussnote').value = state.settings.angfussnote || '';

  updateKundeSelect('ang-kunde');
  document.getElementById('ang-positionen').innerHTML = '';
  angPosC = 0;
  addAngPos();
  calcAng();
}

export function hideAngebotForm() {
  document.getElementById('angebot-liste').style.display = 'block';
  document.getElementById('angebot-form').style.display = 'none';
}

export function speichernAngebot(pdf) {
  const kid = document.getElementById('ang-kunde').value;
  const kobj = state.data.kunden.find(k => k.id == kid);
  const pos = getPositionen('ang-positionen');

  const a = {
    id: Date.now().toString(),
    nr: document.getElementById('ang-nr').value,
    datum: document.getElementById('ang-datum').value,
    gueltig: document.getElementById('ang-gueltig').value,
    kundeId: kid,
    kunde: kobj ? kobj.name : '(kein Kunde)',
    positionen: pos,
    notiz: document.getElementById('ang-notiz').value,
    fussnote: document.getElementById('ang-fussnote').value,
    gesamt: calcContainer('ang-positionen', null),
    status: 'offen'
  };

  state.data.angebote.push(a);
  saveData();
  clearFormDraft('angebot-form');

  if (pdf) druckeDokument(a, kobj, 'Angebot');

  hideAngebotForm();
  renderAngebote();
  toast('Angebot gespeichert');
}

export function renderAngebote() {
  const tb = document.getElementById('angebot-tbody');

  if (!state.data.angebote.length) {
    tb.innerHTML = '<tr><td colspan="7" class="empty">Noch keine Angebote</td></tr>';
    return;
  }

  tb.innerHTML = state.data.angebote.slice().reverse().map(a => `<tr>
    <td>${a.nr}</td>
    <td>${a.kunde}</td>
    <td>${a.datum}</td>
    <td>${a.gueltig || '—'}</td>
    <td>${fmt(a.gesamt)}</td>
    <td><span class="badge badge-${a.status === 'angenommen' ? 'success' : a.status === 'abgelehnt' ? 'danger' : 'neutral'}">
      ${a.status === 'angenommen' ? 'Angenommen' : a.status === 'abgelehnt' ? 'Abgelehnt' : 'Offen'}
    </span></td>
    <td style="display:flex;gap:4px">
      ${a.status === 'offen' ? `<button class="btn btn-sm" onclick="angebotZuRechnung('${a.id}')" title="In Rechnung umwandeln">→ RE</button>` : ''}
      <button class="btn btn-sm" onclick="druckeDokumentById('${a.id}','angebot')">PDF</button>
      <button class="btn btn-sm btn-danger" onclick="loescheAngebot('${a.id}')">✕</button>
    </td>
  </tr>`).join('');
}

export function angebotZuRechnung(id) {
  const a = state.data.angebote.find(x => x.id == id);
  if (!a) return;

  a.status = 'angenommen';
  showSection('rechnungen', document.querySelectorAll('.nav-item')[2]);
  window.showRechnungForm({ positionen: a.positionen, kundeId: a.kundeId, notiz: state.settings.fussnote });
  toast('Angebot in Rechnung übernommen');
}

export function loescheAngebot(id) {
  if (confirm('Angebot löschen?')) {
    state.data.angebote = state.data.angebote.filter(a => a.id != id);
    saveData();
    renderAngebote();
  }
}

// Exportiere für globale Verfügbarkeit
window.addAngPos = addAngPos;
window.calcAng = calcAng;
window.showAngebotForm = showAngebotForm;
window.hideAngebotForm = hideAngebotForm;
window.speichernAngebot = speichernAngebot;
window.angebotZuRechnung = angebotZuRechnung;
window.loescheAngebot = loescheAngebot;
