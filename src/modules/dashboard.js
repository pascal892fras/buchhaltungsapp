/**
 * Dashboard-Funktionalität
 */

import { state, saveData } from './state.js';
import { fmt, today } from './helpers.js';

export function updateDashboard() {
  const jahr = new Date().getFullYear().toString();

  // Berechnungen
  const ein = state.data.rechnungen
    .filter(r => r.status === 'bezahlt' && r.datum.startsWith(jahr))
    .reduce((s, r) => s + r.gesamt, 0);

  const aus = state.data.ausgaben
    .filter(a => a.datum.startsWith(jahr))
    .reduce((s, a) => s + a.betrag, 0);

  const offen = state.data.rechnungen.filter(r => r.status === 'offen');

  // Aktualisiere Kennzahlen
  document.getElementById('m-ein').textContent = fmt(ein);
  document.getElementById('m-aus').textContent = fmt(aus);
  document.getElementById('m-gew').textContent = fmt(ein - aus);
  document.getElementById('m-off').textContent = offen.length;

  // Offene Rechnungen
  document.getElementById('dash-offen').innerHTML = offen.length
    ? offen.map(r => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
        <span>${r.kunde}</span>
        <span>${fmt(r.gesamt)}</span>
      </div>`).join('')
    : '<div class="empty">Keine offenen Rechnungen</div>';

  // Letzte Aktivitäten
  const all = [
    ...state.data.rechnungen.map(r => ({ d: r.datum, t: 'Rechnung ' + r.nr, b: r.gesamt })),
    ...state.data.ausgaben.map(a => ({ d: a.datum, t: a.beschreibung, b: -a.betrag }))
  ]
    .sort((a, b) => b.d.localeCompare(a.d))
    .slice(0, 6);

  document.getElementById('dash-akt').innerHTML = all.length
    ? all.map(a => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
        <span>${a.d} · ${a.t}</span>
        <span style="color:${a.b >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${a.b >= 0 ? '+' : ''}${fmt(Math.abs(a.b))}
        </span>
      </div>`).join('')
    : '<div class="empty">Noch keine Einträge</div>';

  // Fällige wiederkehrende Rechnungen
  const faellig = state.data.wiederkehrend.filter(r => r.naechste <= today());

  document.getElementById('dash-recur').innerHTML = faellig.length
    ? faellig.map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:500">${r.name}</div>
          <div style="font-size:12px;color:var(--muted)">${r.kunde} · ${fmt(r.gesamt)} · fällig ${r.naechste}</div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="ausfuehrenRecur('${r.id}')">Rechnung erstellen</button>
      </div>`).join('')
    : '<div class="empty">Keine fälligen Rechnungen</div>';
}
