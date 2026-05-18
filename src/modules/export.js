/**
 * CSV Export
 */

import { state } from './state.js';
import { toast } from './helpers.js';

export async function exportCSV() {
  let csv = 'Typ;Datum;Beschreibung;Kategorie;Betrag (€);Status;Kunde\n';

  // Rechnungen
  state.data.rechnungen.forEach(r => {
    csv += `Einnahme;${r.datum};Rechnung ${r.nr};;${r.gesamt.toFixed(2).replace('.', ',')};${r.status === 'bezahlt' ? 'Bezahlt' : 'Offen'};${r.kunde}\n`;
  });

  // Angebote
  state.data.angebote.forEach(a => {
    csv += `Angebot;${a.datum};Angebot ${a.nr};;${a.gesamt.toFixed(2).replace('.', ',')};${a.status};${a.kunde}\n`;
  });

  // Ausgaben
  state.data.ausgaben.forEach(a => {
    csv += `Ausgabe;${a.datum};${a.beschreibung};${a.kategorie};-${a.betrag.toFixed(2).replace('.', ',')};;\n`;
  });

  // Mahnungen
  state.data.rechnungen.forEach(r => {
    (r.mahnungen || []).forEach(m => {
      const stufeName = m.stufe === 1 ? 'Zahlungserinnerung' : m.stufe === 2 ? 'Erste Mahnung' : 'Letzte Mahnung';
      csv += `Mahnung;${m.datum};${m.nr} (zu ${r.nr}) – ${stufeName};;${m.gesamt.toFixed(2).replace('.', ',')};;\n`;
    });
  });

  // Summen
  const ein = state.data.rechnungen.filter(r => r.status === 'bezahlt').reduce((s, r) => s + r.gesamt, 0);
  const aus = state.data.ausgaben.reduce((s, a) => s + a.betrag, 0);

  csv += `\n;;Einnahmen gesamt (bezahlt);;${ein.toFixed(2).replace('.', ',')};;\n`;
  csv += `;;Ausgaben gesamt;;-${aus.toFixed(2).replace('.', ',')};;\n`;
  csv += `;;Gewinn/Verlust;;${(ein - aus).toFixed(2).replace('.', ',')};;\n`;

  const ok = await window.api.exportCSV(csv, `buchhaltung_${state.settings.name || 'export'}_${new Date().getFullYear()}.csv`);
  if (ok) toast('CSV gespeichert');
}

// Exportiere für globale Verfügbarkeit
window.exportCSV = exportCSV;
