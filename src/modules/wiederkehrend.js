/**
 * Wiederkehrende Einträge (Einnahmen & Ausgaben)
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
  // Zeige/Verstecke Kundenwahl je nach Typ
  toggleRecurTypUI();
}

export function hideRecurForm() {
  document.getElementById('recur-form').style.display = 'none';
}

// Zeigt/versteckt Kundenfeld je nach Einnahme/Ausgabe
export function toggleRecurTypUI() {
  const typ = document.getElementById('rec-typ')?.value || 'einnahme';
  const kundeRow = document.getElementById('rec-kunde-row');
  if (kundeRow) {
    kundeRow.style.display = typ === 'einnahme' ? '' : 'none';
  }
}

export function speichernRecur() {
  const typ = document.getElementById('rec-typ').value; // 'einnahme' | 'ausgabe'
  const kid = typ === 'einnahme' ? document.getElementById('rec-kunde').value : null;
  const kobj = kid ? state.data.kunden.find(k => k.id == kid) : null;
  const pos = getPositionen('rec-positionen');

  const r = {
    id: Date.now().toString(),
    typ,                                                         // NEU: 'einnahme' | 'ausgabe'
    name: document.getElementById('rec-name').value || 'Unbenannt',
    kundeId: kid,
    kunde: kobj ? kobj.name : (typ === 'ausgabe' ? '—' : '(kein Kunde)'),
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
    el.innerHTML = '<div class="empty">Noch keine wiederkehrenden Einträge. Klicke "+ Neue Vorlage".</div>';
    return;
  }

  el.innerHTML = state.data.wiederkehrend.map(r => {
    const faellig = r.naechste <= today();
    const typ = r.typ || 'einnahme';
    const typLabel = typ === 'ausgabe' ? 'Ausgabe' : 'Einnahme';
    const typColor = typ === 'ausgabe' ? 'danger' : 'success';
    const btnLabel = typ === 'ausgabe' ? 'Als Ausgabe buchen' : 'Rechnung erstellen';

    return `<div class="recur-card">
      <div class="recur-info">
        <div class="recur-title">
          ${r.name}
          <span class="badge badge-${typColor}" style="font-size:11px">${typLabel}</span>
          <span class="badge badge-${faellig ? 'warning' : 'neutral'}" style="font-size:11px">${faellig ? 'Fällig!' : r.intervall}</span>
        </div>
        <div class="recur-sub">${typ === 'einnahme' ? r.kunde + ' · ' : ''}${fmt(r.gesamt)} · nächste: ${r.naechste} · ${r.intervall}</div>
      </div>
      <div class="recur-actions">
        ${faellig ? `<button class="btn btn-sm btn-primary" onclick="ausfuehrenRecur('${r.id}')">${btnLabel}</button>` : ''}
        <button class="btn btn-sm btn-danger" onclick="loescheRecur('${r.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

export function ausfuehrenRecur(id) {
  const rec = state.data.wiederkehrend.find(r => r.id == id);
  if (!rec) return;

  const typ = rec.typ || 'einnahme';

  if (typ === 'ausgabe') {
    // ─── LOGIK AUSGABE ─────────────────────────────────────
    const ausgabe = {
      id: Date.now().toString(),
      datum: today(),
      betrag: rec.gesamt,
      kategorie: rec.name,
      beschreibung: `Wiederkehrend: ${rec.name}`,
    };
    state.data.ausgaben.push(ausgabe);
    rec.naechste = nextDate(rec.naechste, rec.intervall);
    saveData();
    renderWiederkehrend();
    toast(`Ausgabe "${rec.name}" (${fmt(rec.gesamt)}) gebucht`);

  } else {
    // ─── LOGIK EINNAHME ────────────────────────────────────
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

    if (confirm('Rechnung ' + nr + ' erstellt. PDF speichern?')) {
      druckeDokument(r, kobj, 'Rechnung');
    }
    toast('Rechnung ' + nr + ' erstellt');
  }
}

export function loescheRecur(id) {
  if (confirm('Vorlage löschen?')) {
    state.data.wiederkehrend = state.data.wiederkehrend.filter(r => r.id != id);
    saveData();
    renderWiederkehrend();
  }
}

/**
 * Prüft fällige wiederkehrende Ausgaben und bucht sie automatisch.
 * Wird beim App-Start aufgerufen.
 * Holt auch verpasste Zeiträume nach (z.B. App 3 Monate nicht geöffnet = 3 Buchungen).
 */
export function checkFaelligeAusgaben() {
  let gebucht = 0;
  const heuteStr = today();

  state.data.wiederkehrend.forEach(rec => {
    if (rec.typ !== 'ausgabe') return;

    // Solange das Fälligkeitsdatum <= heute ist, buche die Ausgabe
    while (rec.naechste && rec.naechste <= heuteStr) {
      const ausgabe = {
        id: Date.now().toString() + '-' + gebucht,
        datum: rec.naechste,
        betrag: rec.gesamt,
        kategorie: rec.name,
        beschreibung: `Wiederkehrend: ${rec.name}`,
      };
      state.data.ausgaben.push(ausgabe);
      rec.naechste = nextDate(rec.naechste, rec.intervall);
      gebucht++;
    }
  });

  if (gebucht > 0) {
    saveData();
    toast(`${gebucht} wiederkehrende Ausgabe${gebucht > 1 ? 'n' : ''} automatisch gebucht`);
  }

  return gebucht;
}

// Exportiere für globale Verfügbarkeit
window.addRecPos = addRecPos;
window.calcRec = calcRec;
window.showRecurForm = showRecurForm;
window.hideRecurForm = hideRecurForm;
window.speichernRecur = speichernRecur;
window.ausfuehrenRecur = ausfuehrenRecur;
window.loescheRecur = loescheRecur;
window.toggleRecurTypUI = toggleRecurTypUI;
