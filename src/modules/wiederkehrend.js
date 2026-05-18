/**
 * Wiederkehrende Rechnungen
 */

import { state, saveData } from './state.js';
import { fmt, today, addDays, nextDate, toast } from './helpers.js';
import { makePosRow, getPositionen, calcContainer } from './positions.js';
import { updateKundeSelect } from './navigation.js';
import { druckeDokument } from './templates.js';

let recPosC = 0;

export function addRecPos() {
  makePosRow('rec-positionen', recPosC++, 'calcRec');
}

export function calcRec() {
  calcContainer('rec-positionen', 'rec-gesamt');
}

export function showRecurForm() {
  document.getElementById('recur-form').style.display = 'block';
  document.getElementById('rec-naechste').value = today();
  updateKundeSelect('rec-kunde');
  document.getElementById('rec-positionen').innerHTML = '';
  recPosC = 0;
  addRecPos();
  calcRec();
}

export function hideRecurForm() {
  document.getElementById('recur-form').style.display = 'none';
}

export function speichernRecur() {
  const kid = document.getElementById('rec-kunde').value;
  const kobj = state.data.kunden.find(k => k.id == kid);
  const pos = getPositionen('rec-positionen');

  const r = {
    id: Date.now().toString(),
    name: document.getElementById('rec-name').value || 'Unbenannt',
    kundeId: kid,
    kunde: kobj ? kobj.name : '(kein Kunde)',
    intervall: document.getElementById('rec-intervall').value,
    naechste: document.getElementById('rec-naechste').value,
    zahltage: parseInt(document.getElementById('rec-zahltage').value) || 14,
    positionen: pos,
    notiz: document.getElementById('rec-notiz').value,
    gesamt: calcContainer('rec-positionen', null)
  };

  state.data.wiederkehrend.push(r);
  saveData();
  hideRecurForm();
  renderWiederkehrend();
  toast('Vorlage gespeichert');
}

export function renderWiederkehrend() {
  const el = document.getElementById('recur-liste');

  if (!state.data.wiederkehrend.length) {
    el.innerHTML = '<div class="empty">Noch keine wiederkehrenden Rechnungen. Klicke "+ Neue Vorlage".</div>';
    return;
  }

  el.innerHTML = state.data.wiederkehrend.map(r => {
    const faellig = r.naechste <= today();
    return `<div class="recur-card">
      <div class="recur-info">
        <div class="recur-title">${r.name} <span class="badge badge-${faellig ? 'warning' : 'neutral'}" style="font-size:11px">${faellig ? 'Fällig!' : r.intervall}</span></div>
        <div class="recur-sub">${r.kunde} · ${fmt(r.gesamt)} · nächste: ${r.naechste} · ${r.intervall}</div>
      </div>
      <div class="recur-actions">
        ${faellig ? `<button class="btn btn-sm btn-primary" onclick="ausfuehrenRecur('${r.id}')">Rechnung erstellen</button>` : ''}
        <button class="btn btn-sm btn-danger" onclick="loescheRecur('${r.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

export function ausfuehrenRecur(id) {
  const rec = state.data.wiederkehrend.find(r => r.id == id);
  if (!rec) return;

  const kobj = state.data.kunden.find(k => k.id == rec.kundeId);
  const nr = (state.settings.prefix || 'RE') + '-' + new Date().getFullYear() +
    '-' + String(state.data.rechnungen.length + 1).padStart(3, '0');
  const faellig = addDays(today(), rec.zahltage);

  const r = {
    id: Date.now().toString(),
    nr,
    datum: today(),
    faellig,
    kundeId: rec.kundeId,
    kunde: rec.kunde,
    positionen: rec.positionen,
    notiz: rec.notiz || state.settings.fussnote || '',
    gesamt: rec.gesamt,
    status: 'offen',
    mahnstufe: 0,
    mahnungen: []
  };

  state.data.rechnungen.push(r);
  rec.naechste = nextDate(rec.naechste, rec.intervall);
  saveData();
  renderWiederkehrend();

  const dashModule = require('./dashboard.js');
  dashModule.updateDashboard();

  if (confirm('Rechnung ' + nr + ' erstellt. PDF speichern?')) {
    druckeDokument(r, kobj, 'Rechnung');
  }

  toast('Rechnung ' + nr + ' erstellt');
}

export function loescheRecur(id) {
  if (confirm('Vorlage löschen?')) {
    state.data.wiederkehrend = state.data.wiederkehrend.filter(r => r.id != id);
    saveData();
    renderWiederkehrend();
  }
}

// Exportiere für globale Verfügbarkeit
window.addRecPos = addRecPos;
window.calcRec = calcRec;
window.showRecurForm = showRecurForm;
window.hideRecurForm = hideRecurForm;
window.speichernRecur = speichernRecur;
window.ausfuehrenRecur = ausfuehrenRecur;
window.loescheRecur = loescheRecur;
