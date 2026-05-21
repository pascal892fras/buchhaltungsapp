/**
 * Rechnungsverwaltung und Mahnwesen
 */

import { state, saveData } from './state.js';
import { fmt, today, addDays, toast, formatDatum, loadFormDraft, clearFormDraft } from './helpers.js';
import { updateDashboard } from './dashboard.js';
import { makePosRow, getPositionen, calcContainer } from './positions.js';
import { updateKundeSelect } from './navigation.js';
import { druckeDokument } from './templates.js';
import { validateRechnung } from './validation.js';

let rPosC = 0;
let _mahnungContext = null;
let _ausAngebotId = null;  // Referenz zum Angebot das gerade in Rechnung umgewandelt wird

// ─── RECHNUNGEN ──────────────────────────────────────────
export function addRPos() {
  makePosRow('r-positionen', rPosC++, 'calcR');
}

export function calcR() {
  calcContainer('r-positionen', 'r-gesamt');
}

export function showRechnungForm(prefill) {
  document.getElementById('rechnung-liste').style.display = 'none';
  const form = document.getElementById('rechnung-form');
  form.style.display = 'block';

  // Angebots-Referenz merken
  _ausAngebotId = prefill?.ausAngebotId || null;

  // Versuche Draft zu laden
  if (!prefill && loadFormDraft('rechnung-form')) {
    updateKundeSelect('r-kunde');
    calcR();
    toast('Entwurf wiederhergestellt');
    return;
  }

  document.getElementById('r-datum').value = today();
  document.getElementById('r-faellig').value = addDays(today(), state.settings.zahltage || 14);
  document.getElementById('r-nr').value = (state.settings.prefix || 'RE') + '-' +
    new Date().getFullYear() + '-' + String(state.data.rechnungen.length + 1).padStart(3, '0');
  document.getElementById('r-notiz').value = state.settings.fussnote || '';

  updateKundeSelect('r-kunde');
  document.getElementById('r-positionen').innerHTML = '';
  rPosC = 0;

  if (prefill) {
    prefill.positionen.forEach(p => {
      makePosRow('r-positionen', rPosC++, 'calcR');
      const rows = document.querySelectorAll('#r-positionen .pos-row');
      const row = rows[rows.length - 1];
      row.children[0].value = p.beschr;
      row.children[1].value = p.menge;
      row.children[2].value = p.ep;
    });
    document.getElementById('r-kunde').value = prefill.kundeId || '';
    document.getElementById('r-notiz').value = prefill.notiz || state.settings.fussnote || '';
  } else {
    addRPos();
  }

  calcR();
}

export function hideRechnungForm() {
  // Wenn aus Angebot abgebrochen → Angebot bleibt 'offen'
  _ausAngebotId = null;
  document.getElementById('rechnung-liste').style.display = 'block';
  document.getElementById('rechnung-form').style.display = 'none';
}

export function speichernRechnung(pdf) {
  const kid = document.getElementById('r-kunde').value;
  const kobj = state.data.kunden.find((k) => k.id == kid);
  const pos = getPositionen('r-positionen');

  // Warnung wenn kein Kunde, aber trotzdem erlauben
  if (!kid && !confirm('Kein Kunde ausgewählt. Rechnung trotzdem speichern?')) {
    return;
  }

  const r = {
    id: Date.now().toString(),
    nr: document.getElementById('r-nr').value,
    datum: document.getElementById('r-datum').value,
    faellig: document.getElementById('r-faellig').value,
    kundeId: kid,
    kunde: kobj ? kobj.name : '(kein Kunde)',
    positionen: pos,
    notiz: document.getElementById('r-notiz').value,
    gesamt: calcContainer('r-positionen', null),
    status: 'offen',
    mahnstufe: 0,
    mahnungen: [],
  };

  // ✅ NEUE VALIDIERUNG
  const errors = validateRechnung(r);

  if (errors.length > 0) {
    toast(`Fehler beim Speichern:\n${errors.join('\n')}`);
    return;
  }

  state.data.rechnungen.push(r);

  // Angebot-Status auf 'angenommen' setzen (erst jetzt, beim tatsächlichen Speichern)
  if (_ausAngebotId) {
    const ang = state.data.angebote.find(a => a.id == _ausAngebotId);
    if (ang) ang.status = 'angenommen';
    _ausAngebotId = null;
  }

  saveData();
  clearFormDraft('rechnung-form');

  if (pdf) druckeDokument(r, kobj, 'Rechnung');

  hideRechnungForm();
  renderRechnungen();
  updateDashboard();
  toast('Rechnung gespeichert ✓');
}

export function renderRechnungen() {
  const tb = document.getElementById('rechnung-tbody');

  if (!state.data.rechnungen.length) {
    tb.innerHTML = '<tr><td colspan="7" class="empty">Noch keine Rechnungen</td></tr>';
    return;
  }

  tb.innerHTML = state.data.rechnungen.slice().reverse().map(r => {
    const stufe = r.mahnstufe || 0;
    const istUeberfaellig = r.status === 'offen' && r.faellig && r.faellig < today();

    let statusBadge = '';
    if (r.status === 'bezahlt') {
      statusBadge = `<span class="badge badge-success">Bezahlt</span>`;
    } else if (stufe > 0) {
      const stufenName = stufe === 1 ? '1. Erinnerung' : (stufe === 2 ? '1. Mahnung' : 'Letzte Mahnung');
      statusBadge = `<span class="badge badge-danger">${stufenName}</span>`;
    } else if (istUeberfaellig) {
      statusBadge = `<span class="badge badge-warning">Überfällig</span>`;
    } else {
      statusBadge = `<span class="badge badge-warning">Offen</span>`;
    }

    const mahnBtn = r.status === 'offen' && stufe < 3
      ? `<button class="btn btn-sm" onclick="showMahnungModal('${r.id}')" title="Mahnung erstellen">⚠</button>`
      : '';

    return `<tr>
      <td>${r.nr}</td>
      <td>${r.kunde}</td>
      <td>${r.datum}</td>
      <td>${r.faellig || '—'}</td>
      <td>${fmt(r.gesamt)}</td>
      <td>${statusBadge}</td>
      <td style="display:flex;gap:4px">
        ${r.status === 'offen' ? `<button class="btn btn-sm" onclick="markBezahlt('${r.id}')" title="Als bezahlt markieren">✓</button>` : ''}
        ${mahnBtn}
        <button class="btn btn-sm" onclick="druckeDokumentById('${r.id}','rechnung')" title="Rechnung als PDF">PDF</button>
        <button class="btn btn-sm btn-danger" onclick="loescheRechnung('${r.id}')">✕</button>
      </td>
    </tr>`;
  }).join('');
}

export function markBezahlt(id) {
  const r = state.data.rechnungen.find(r => r.id == id);
  if (r) {
    r.status = 'bezahlt';
    r.bezahltAm = today();
    saveData();
    renderRechnungen();
    updateDashboard();
    toast('Als bezahlt markiert');
  }
}

export function loescheRechnung(id) {
  if (confirm('Rechnung löschen?')) {
    state.data.rechnungen = state.data.rechnungen.filter(r => r.id != id);
    saveData();
    renderRechnungen();
  }
}

export function druckeDokumentById(id, typ) {
  if (typ === 'rechnung') {
    const r = state.data.rechnungen.find(x => x.id == id);
    const k = state.data.kunden.find(x => x.id == r.kundeId);
    druckeDokument(r, k, 'Rechnung');
  } else {
    const r = state.data.angebote.find(x => x.id == id);
    const k = state.data.kunden.find(x => x.id == r.kundeId);
    druckeDokument(r, k, 'Angebot');
  }
}

// ─── MAHNUNGEN ───────────────────────────────────────────

function mahnungStufenName(stufe) {
  return stufe === 1 ? 'Zahlungserinnerung' : stufe === 2 ? 'Erste Mahnung' : 'Letzte Mahnung';
}

export function berechneVerzugszinsen(betrag, faelligDatum, bisDatum) {
  const tage = Math.max(0, Math.round((new Date(bisDatum) - new Date(faelligDatum)) / 86400000));
  const zins = (state.settings.verzugszins_pct || 0) / 100;
  return +(betrag * zins * tage / 365).toFixed(2);
}

export function showMahnungModal(rechnungId) {
  const r = state.data.rechnungen.find(x => x.id == rechnungId);
  if (!r) return;
  if (r.status === 'bezahlt') {
    toast('Rechnung ist bereits bezahlt');
    return;
  }

  _mahnungContext = { rechnungId };
  const k = state.data.kunden.find(x => x.id == r.kundeId);

  document.getElementById('mahnung-modal-title').textContent = 'Mahnung – Rechnung ' + r.nr;
  document.getElementById('mahnung-modal-info').innerHTML =
    `<strong>${k ? k.name : r.kunde}</strong> · Rechnungsdatum ${r.datum} · Fällig ${r.faellig || '—'} · Betrag ${fmt(r.gesamt)}` +
    (r.mahnstufe ? `<br>Bereits gesendet: ${mahnungStufenName(r.mahnstufe)}` : '');

  // Stufen-Select
  const sel = document.getElementById('mahnung-stufe-select');
  const nextStufe = Math.min(3, (r.mahnstufe || 0) + 1);
  sel.innerHTML = '';

  for (let i = nextStufe; i <= 3; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Stufe ${i} – ${mahnungStufenName(i)}`;
    sel.appendChild(opt);
  }

  sel.onchange = () => aktualisiereMahnungVorschau(r);
  aktualisiereMahnungVorschau(r);
  document.getElementById('mahnung-modal').style.display = 'flex';
}

function aktualisiereMahnungVorschau(r) {
  const stufe = parseInt(document.getElementById('mahnung-stufe-select').value);
  const gebuehr = stufe === 1 ? (state.settings.mahngebuehr_stufe1 || 0) :
                  stufe === 2 ? (state.settings.mahngebuehr_stufe2 || 0) :
                  (state.settings.mahngebuehr_stufe3 || 0);
  const frist = stufe === 1 ? (state.settings.mahnung_frist_stufe1 || 7) :
                stufe === 2 ? (state.settings.mahnung_frist_stufe2 || 7) :
                (state.settings.mahnung_frist_stufe3 || 7);
  const heute = today();
  const zinsen = (stufe >= 2 && r.faellig) ? berechneVerzugszinsen(r.gesamt, r.faellig, heute) : 0;
  const neueFaellig = addDays(heute, frist);
  const vorigeGebuehren = (r.mahnungen || []).reduce((sum, m) => sum + (m.gebuehr || 0), 0);
  const gesamt = +(r.gesamt + vorigeGebuehren + gebuehr + zinsen).toFixed(2);

  const preview = document.getElementById('mahnung-preview');
  preview.innerHTML = `
    <div><strong>${mahnungStufenName(stufe)}</strong></div>
    <div>Offener Rechnungsbetrag: <strong>${fmt(r.gesamt)}</strong></div>
    ${vorigeGebuehren > 0 ? `<div>Bisherige Mahngebühren: <strong>${fmt(vorigeGebuehren)}</strong></div>` : ''}
    ${gebuehr > 0 ? `<div>Mahngebühr (Stufe ${stufe}): <strong>${fmt(gebuehr)}</strong></div>` : ''}
    ${zinsen > 0 ? `<div>Verzugszinsen (${(state.settings.verzugszins_pct || 0).toLocaleString('de-DE')}% p.a.): <strong>${fmt(zinsen)}</strong></div>` : ''}
    <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">Gesamtforderung: <strong>${fmt(gesamt)}</strong></div>
    <div style="margin-top:6px">Neue Zahlungsfrist: <strong>${neueFaellig}</strong> (${frist} Tage)</div>
  `;
}

export function hideMahnungModal() {
  document.getElementById('mahnung-modal').style.display = 'none';
  _mahnungContext = null;
}

export function erstelleMahnung() {
  if (!_mahnungContext) return;

  const r = state.data.rechnungen.find(x => x.id == _mahnungContext.rechnungId);
  if (!r) return;

  const stufe = parseInt(document.getElementById('mahnung-stufe-select').value);
  const gebuehr = stufe === 1 ? (state.settings.mahngebuehr_stufe1 || 0) :
                  stufe === 2 ? (state.settings.mahngebuehr_stufe2 || 0) :
                  (state.settings.mahngebuehr_stufe3 || 0);
  const frist = stufe === 1 ? (state.settings.mahnung_frist_stufe1 || 7) :
                stufe === 2 ? (state.settings.mahnung_frist_stufe2 || 7) :
                (state.settings.mahnung_frist_stufe3 || 7);
  const heute = today();
  const zinsen = (stufe >= 2 && r.faellig) ? berechneVerzugszinsen(r.gesamt, r.faellig, heute) : 0;
  const neueFaellig = addDays(heute, frist);

  const mahnungNr = (state.settings.mahnung_prefix || 'M') + '-' + new Date().getFullYear() +
    '-' + r.nr.replace(/[^a-zA-Z0-9]/g, '') + '-S' + stufe;
  const vorigeGebuehren = (r.mahnungen || []).reduce((sum, m) => sum + (m.gebuehr || 0), 0);

  const mahnung = {
    id: Date.now().toString(),
    nr: mahnungNr,
    stufe,
    datum: heute,
    faellig: neueFaellig,
    gebuehr,
    vorigeGebuehren: +vorigeGebuehren.toFixed(2),
    zinsen,
    gesamt: +(r.gesamt + vorigeGebuehren + gebuehr + zinsen).toFixed(2)
  };

  if (!r.mahnungen) r.mahnungen = [];
  r.mahnungen.push(mahnung);
  r.mahnstufe = stufe;

  saveData();

  const k = state.data.kunden.find(x => x.id == r.kundeId);
  druckeMahnung(r, k, mahnung);

  hideMahnungModal();
  renderRechnungen();
  toast(mahnungStufenName(stufe) + ' erstellt');
}

export function druckeMahnung(rechnung, kunde, mahnung) {
  // KISS: Mahnung als erweitertes Dokument bauen und druckeDokument nutzen
  const mahnungDoc = {
    ...rechnung,
    nr: mahnung.nr,
    datum: mahnung.datum,
    faellig: mahnung.faellig,
    istMahnung: true,
    mahnstufe: mahnung.stufe,
    mahnGebuehr: mahnung.gebuehr || 0,
    mahnZinsen: mahnung.zinsen || 0,
    mahnGesamt: mahnung.gesamt,
    notiz: mahnungText(mahnung.stufe, rechnung, mahnung)
  };
  druckeDokument(mahnungDoc, kunde, 'Mahnung');
}

function mahnungText(stufe, rechnung, mahnung) {
  const stufenName = stufe === 1 ? 'Zahlungserinnerung' : stufe === 2 ? '1. Mahnung' : 'Letzte Mahnung';
  return `${stufenName} für Rechnung ${rechnung.nr}\n` +
    `Ursprünglicher Betrag: ${mahnung.gesamt} €\n` +
    (mahnung.gebuehr ? `Mahngebühr: ${mahnung.gebuehr} €\n` : '') +
    (mahnung.zinsen ? `Verzugszinsen: ${mahnung.zinsen} €\n` : '') +
    `Neuer Gesamtbetrag: ${mahnung.gesamt} €`;
}

// ─── INLINE NEUKUNDE ─────────────────────────────────────
export function handleKundeSelect(selectEl) {
  const form = document.getElementById('r-neukunde-form');
  if (selectEl.value === '__neu__') {
    form.style.display = 'block';
    document.getElementById('r-nk-name').focus();
  } else {
    form.style.display = 'none';
  }
}

export function hideInlineNeukunde() {
  document.getElementById('r-neukunde-form').style.display = 'none';
  document.getElementById('r-kunde').value = '';
}

export function speichernInlineNeukunde() {
  const name = document.getElementById('r-nk-name').value.trim();
  if (!name) {
    toast('Bitte Name/Firma eingeben');
    return;
  }

  // Kunden-Nummer: manuell oder automatisch
  let kundennummer = document.getElementById('r-nk-kundennr').value.trim();
  if (!kundennummer) {
    kundennummer = 'K-' + String(state.data.kunden.length + 1).padStart(3, '0');
  }

  const neuerKunde = {
    id: Date.now().toString(),
    kundennummer,
    name,
    kontakt: document.getElementById('r-nk-kontakt').value.trim(),
    mail: document.getElementById('r-nk-mail').value.trim(),
    tel: document.getElementById('r-nk-tel').value.trim(),
    adresse: document.getElementById('r-nk-adresse').value.trim(),
  };

  // In Kundendatenbank speichern
  state.data.kunden.push(neuerKunde);
  saveData();

  // Select aktualisieren und neuen Kunden auswählen
  const select = document.getElementById('r-kunde');
  const option = document.createElement('option');
  option.value = neuerKunde.id;
  option.textContent = neuerKunde.name;
  select.appendChild(option);
  select.value = neuerKunde.id;

  // Formular ausblenden und alle Felder leeren
  document.getElementById('r-neukunde-form').style.display = 'none';
  document.getElementById('r-nk-kundennr').value = '';
  document.getElementById('r-nk-name').value = '';
  document.getElementById('r-nk-kontakt').value = '';
  document.getElementById('r-nk-mail').value = '';
  document.getElementById('r-nk-tel').value = '';
  document.getElementById('r-nk-adresse').value = '';

  toast(`Kunde "${name}" (${kundennummer}) angelegt ✓`);
}

// Exportiere für globale Verfügbarkeit
window.addRPos = addRPos;
window.calcR = calcR;
window.showRechnungForm = showRechnungForm;
window.hideRechnungForm = hideRechnungForm;
window.speichernRechnung = speichernRechnung;
window.markBezahlt = markBezahlt;
window.loescheRechnung = loescheRechnung;
window.druckeDokumentById = druckeDokumentById;
window.showMahnungModal = showMahnungModal;
window.hideMahnungModal = hideMahnungModal;
window.erstelleMahnung = erstelleMahnung;
window.handleKundeSelect = handleKundeSelect;
window.hideInlineNeukunde = hideInlineNeukunde;
window.speichernInlineNeukunde = speichernInlineNeukunde;
