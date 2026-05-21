/**
 * Navigation und UI-Kontrolle
 */

import { state } from './state.js';
import { updateDashboard } from './dashboard.js';
import { renderRechnungen } from './rechnungen.js';
import { renderAngebote } from './angebote.js';
import { renderKunden } from './kunden.js';
import { renderAusgaben } from './ausgaben.js';
import { renderWiederkehrend } from './wiederkehrend.js';
import { initEUER } from './euer.js';
import { ladeSettings } from './settings.js';

/**
 * Zeigt einen bestimmten Bereich (Section) der App
 */
export function showSection(id, el) {
  // Alle Sections verstecken
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Gewählte Section anzeigen
  document.getElementById('sec-' + id).classList.add('active');
  if (el) el.classList.add('active');

  // Titel aktualisieren
  const titles = {
    dashboard: 'Dashboard',
    angebote: 'Angebote',
    rechnungen: 'Rechnungen',
    wiederkehrend: 'Wiederkehrende Rechnungen',
    ausgaben: 'Ausgaben',
    euer: 'Einnahmen-Überschuss-Rechnung',
    erfassen: 'Beleg erfassen',
    kunden: 'Kunden',
    einstellungen: 'Einstellungen'
  };

  document.getElementById('topbar-title').textContent = titles[id] || id;

  // Section-spezifische Aktionen
  setTopbarActions(id);

  // Inhalte laden
  if (id === 'rechnungen') renderRechnungen();
  if (id === 'angebote') renderAngebote();
  if (id === 'kunden') renderKunden();
  if (id === 'ausgaben') renderAusgaben();
  if (id === 'wiederkehrend') renderWiederkehrend();
  if (id === 'euer') initEUER();
  if (id === 'einstellungen') ladeSettings();
}

/**
 * Setzt die Aktions-Buttons in der Top-Bar
 */
export function setTopbarActions(id) {
  const el = document.getElementById('topbar-actions');
  const csvBtn = `<button class="btn btn-sm btn-success" onclick="exportCSV()"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> CSV Export</button>`;

  if (id === 'dashboard') {
    el.innerHTML = csvBtn;
  } else if (id === 'rechnungen') {
    el.innerHTML = csvBtn + `<button class="btn btn-sm btn-primary" onclick="showRechnungForm()">+ Neue Rechnung</button>`;
  } else if (id === 'angebote') {
    el.innerHTML = `<button class="btn btn-sm btn-primary" onclick="showAngebotForm()">+ Neues Angebot</button>`;
  } else if (id === 'wiederkehrend') {
    el.innerHTML = `<button class="btn btn-sm btn-primary" onclick="showRecurForm()">+ Neue Vorlage</button>`;
  } else if (id === 'ausgaben') {
    el.innerHTML = csvBtn + `<button class="btn btn-sm btn-primary" onclick="showAusgabeForm()">+ Neue Ausgabe</button>`;
  } else if (id === 'euer') {
    el.innerHTML = csvBtn + `<button class="btn btn-sm btn-primary" onclick="druckeEUER()">📄 EÜR als PDF</button>`;
  } else if (id === 'kunden') {
    el.innerHTML = `<button class="btn btn-sm btn-primary" onclick="showKundeForm()">+ Neuer Kunde</button>`;
  } else {
    el.innerHTML = '';
  }
}

/**
 * Aktualisiert Customer-Select-Felder
 */
export function updateKundeSelect(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.innerHTML = '<option value="">-- Kunde wählen --</option>' +
    '<option value="__neu__">+ Neuer Kunde anlegen</option>' +
    state.data.kunden.map(k => `<option value="${k.id}">${k.name}</option>`).join('');
}
