/**
 * Einnahmen-Überschuss-Rechnung (EÜR)
 */

import { state } from './state.js';
import { fmt, today, formatDatum, fmtEUR, toast } from './helpers.js';

// Zufluss-Datum gemäß §4 Abs. 3 EStG
function einnahmeDatum(r) {
  return r.bezahltAm || r.datum;
}

export function initEUER() {
  const sel = document.getElementById('euer-jahr');
  const jahre = new Set();

  state.data.rechnungen.forEach(r => {
    const d = einnahmeDatum(r);
    if (d) jahre.add(d.substring(0, 4));
  });

  state.data.ausgaben.forEach(a => {
    if (a.datum) jahre.add(a.datum.substring(0, 4));
  });

  const currentYear = new Date().getFullYear().toString();
  jahre.add(currentYear);
  const sortiert = [...jahre].sort().reverse();
  const aktuellWert = sel.value || currentYear;

  sel.innerHTML = sortiert.map(j => `<option value="${j}"${j === aktuellWert ? ' selected' : ''}>${j}</option>`).join('');
  renderEUER();
}

export function renderEUER() {
  const jahr = document.getElementById('euer-jahr').value || new Date().getFullYear().toString();

  // Einnahmen: bezahlte Rechnungen nach Zahlungsdatum (Zufluss-Prinzip)
  const einnahmenList = state.data.rechnungen.filter(r =>
    r.status === 'bezahlt' && einnahmeDatum(r) && einnahmeDatum(r).startsWith(jahr)
  );

  const ausgabenList = state.data.ausgaben.filter(a => a.datum && a.datum.startsWith(jahr));

  // Offene Forderungen
  const offenList = state.data.rechnungen.filter(r =>
    r.status === 'offen' && r.datum && r.datum.startsWith(jahr)
  );

  const sumEin = einnahmenList.reduce((s, r) => s + r.gesamt, 0);
  const sumAus = ausgabenList.reduce((s, a) => s + a.betrag, 0);
  const sumOffen = offenList.reduce((s, r) => s + r.gesamt, 0);

  document.getElementById('euer-einnahmen').textContent = fmt(sumEin);
  document.getElementById('euer-ausgaben').textContent = fmt(sumAus);
  document.getElementById('euer-gewinn').textContent = fmt(sumEin - sumAus);
  document.getElementById('euer-offen').textContent = fmt(sumOffen);

  // Einnahmen-Tabelle
  const einTb = document.getElementById('euer-einnahmen-tbody');
  einTb.innerHTML = einnahmenList.length
    ? einnahmenList.slice().sort((a, b) => einnahmeDatum(a).localeCompare(einnahmeDatum(b)))
        .map(r => `<tr>
          <td>${einnahmeDatum(r)}</td>
          <td>${r.nr}</td>
          <td>${r.kunde}</td>
          <td style="text-align:right">${fmt(r.gesamt)}</td>
        </tr>`).join('')
    : '<tr><td colspan="4" class="empty">Keine Einnahmen</td></tr>';

  // Ausgaben nach Kategorie
  const katSum = {};
  ausgabenList.forEach(a => {
    katSum[a.kategorie] = (katSum[a.kategorie] || 0) + a.betrag;
  });

  const katEintraege = Object.entries(katSum).sort((a, b) => b[1] - a[1]);
  const katTb = document.getElementById('euer-kat-tbody');
  katTb.innerHTML = katEintraege.length
    ? katEintraege.map(([kat, betrag]) => {
        const anteil = sumAus > 0 ? (betrag / sumAus * 100).toFixed(1) : '0,0';
        return `<tr>
          <td>${kat}</td>
          <td style="text-align:right">${fmt(betrag)}</td>
          <td style="text-align:right">${anteil.replace('.', ',')}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="3" class="empty">Keine Ausgaben</td></tr>';

  // Detail-Ausgaben
  const ausTb = document.getElementById('euer-ausgaben-tbody');
  ausTb.innerHTML = ausgabenList.length
    ? ausgabenList.slice().sort((a, b) => a.datum.localeCompare(b.datum))
        .map(a => `<tr>
          <td>${a.datum}</td>
          <td>${a.beschreibung || '—'}</td>
          <td><span class="badge badge-neutral">${a.kategorie}</span></td>
          <td style="text-align:right">${fmt(a.betrag)}</td>
        </tr>`).join('')
    : '<tr><td colspan="4" class="empty">Keine Ausgaben</td></tr>';
}

export function druckeEUER() {
  const jahr = document.getElementById('euer-jahr').value || new Date().getFullYear().toString();
  const einnahmenList = state.data.rechnungen.filter(r =>
    r.status === 'bezahlt' && einnahmeDatum(r) && einnahmeDatum(r).startsWith(jahr)
  );
  const ausgabenList = state.data.ausgaben.filter(a => a.datum && a.datum.startsWith(jahr));

  const sumEin = einnahmenList.reduce((s, r) => s + r.gesamt, 0);
  const sumAus = ausgabenList.reduce((s, a) => s + a.betrag, 0);
  const gewinn = sumEin - sumAus;

  const katSum = {};
  ausgabenList.forEach(a => {
    katSum[a.kategorie] = (katSum[a.kategorie] || 0) + a.betrag;
  });
  const katEintraege = Object.entries(katSum).sort((a, b) => b[1] - a[1]);

  const s = state.settings;
  const tplColorHighlight = s.tpl_color_highlight || '#000000';
  const tplColorText = s.tpl_color_text || '#333333';
  const tplColorBg = s.tpl_color_bg || '#ffffff';
  const tplColorTableBg = s.tpl_color_table_bg || '#fef9e6';
  const firmaAdresse = (s.adresse || '').split('\n');

  const einnahmenRows = einnahmenList.slice().sort((a, b) => einnahmeDatum(a).localeCompare(einnahmeDatum(b)))
    .map(r => `<tr>
      <td>${formatDatum(einnahmeDatum(r))}</td>
      <td>${r.nr}</td>
      <td>${r.kunde}</td>
      <td style="text-align:right">${fmtEUR(r.gesamt)}</td>
    </tr>`).join('');

  const katRows = katEintraege.map(([kat, betrag]) => {
    const anteil = sumAus > 0 ? (betrag / sumAus * 100).toFixed(1).replace('.', ',') : '0,0';
    return `<tr>
      <td>${kat}</td>
      <td style="text-align:right">${fmtEUR(betrag)}</td>
      <td style="text-align:right">${anteil}%</td>
    </tr>`;
  }).join('');

  const ausgabenRows = ausgabenList.slice().sort((a, b) => a.datum.localeCompare(b.datum))
    .map(a => `<tr>
      <td>${formatDatum(a.datum)}</td>
      <td>${a.beschreibung || '—'}</td>
      <td>${a.kategorie}</td>
      <td style="text-align:right">${fmtEUR(a.betrag)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>EÜR ${jahr}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:${tplColorBg}}
    body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:${tplColorText};padding:40px 50px;line-height:1.5}
    .absender{font-size:8px;color:#666;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:20px}
    h1{font-size:20px;color:${tplColorHighlight};margin-bottom:4px}
    .sub{font-size:11px;color:#666;margin-bottom:20px}
    .summary{display:flex;gap:12px;margin:20px 0}
    .summary-card{flex:1;padding:12px;background:${tplColorTableBg};border-radius:4px;text-align:center}
    .summary-card .lbl{font-size:9px;text-transform:uppercase;color:#666}
    .summary-card .val{font-size:16px;font-weight:600;color:${tplColorHighlight};margin-top:4px}
    .summary-card.gewinn{border:2px solid ${tplColorHighlight}}
    h2{font-size:13px;color:${tplColorHighlight};margin:25px 0 10px;border-bottom:1px solid #ccc;padding-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:9.5px}
    th{background:${tplColorTableBg};color:${tplColorHighlight};padding:8px;text-align:left;font-size:9px;font-weight:600}
    td{padding:6px 8px;border-bottom:1px solid #eee}
    tfoot td{font-weight:700;border-top:2px solid ${tplColorHighlight};background:${tplColorTableBg};color:${tplColorHighlight}}
  </style></head><body>
    <div class="absender">${s.name || 'Firmenname'} / ${firmaAdresse[0] || ''} / ${firmaAdresse[1] || ''}${s.steuernr ? ' / Steuer-Nr. ' + s.steuernr : ''}</div>
    <h1>Einnahmen-Überschuss-Rechnung</h1>
    <div class="sub">Geschäftsjahr ${jahr} · gemäß §4 Abs. 3 EStG · Kleinunternehmerregelung §19 UStG</div>

    <div class="summary">
      <div class="summary-card"><div class="lbl">Betriebseinnahmen</div><div class="val">${fmtEUR(sumEin)}</div></div>
      <div class="summary-card"><div class="lbl">Betriebsausgaben</div><div class="val">${fmtEUR(sumAus)}</div></div>
      <div class="summary-card gewinn"><div class="lbl">${gewinn >= 0 ? 'Gewinn' : 'Verlust'}</div><div class="val">${fmtEUR(gewinn)}</div></div>
    </div>

    <h2>Betriebseinnahmen (bezahlte Rechnungen ${jahr})</h2>
    <table>
      <thead><tr><th>Datum</th><th>Rechnung</th><th>Kunde</th><th style="text-align:right">Betrag</th></tr></thead>
      <tbody>${einnahmenRows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:14px">Keine Einnahmen</td></tr>'}</tbody>
      <tfoot><tr><td colspan="3">Summe Betriebseinnahmen</td><td style="text-align:right">${fmtEUR(sumEin)}</td></tr></tfoot>
    </table>

    <h2>Betriebsausgaben nach Kategorie</h2>
    <table>
      <thead><tr><th>Kategorie</th><th style="text-align:right">Betrag</th><th style="text-align:right">Anteil</th></tr></thead>
      <tbody>${katRows || '<tr><td colspan="3" style="text-align:center;color:#999;padding:14px">Keine Ausgaben</td></tr>'}</tbody>
      <tfoot><tr><td>Summe Betriebsausgaben</td><td style="text-align:right">${fmtEUR(sumAus)}</td><td style="text-align:right">100,0%</td></tr></tfoot>
    </table>

    <h2>Betriebsausgaben – Detail</h2>
    <table>
      <thead><tr><th>Datum</th><th>Beschreibung</th><th>Kategorie</th><th style="text-align:right">Betrag</th></tr></thead>
      <tbody>${ausgabenRows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:14px">Keine Ausgaben</td></tr>'}</tbody>
    </table>

    <div style="margin-top:30px;font-size:9px;color:#666;border-top:1px solid #ddd;padding-top:10px">
      Erstellt am ${formatDatum(today())} · Diese Aufstellung dient als Anlage zur Steuererklärung.
    </div>
  </body></html>`;

  window.api.printPDF(html, `EUER_${jahr}.pdf`);
  toast('EÜR PDF wird erstellt');
}

// Exportiere für globale Verfügbarkeit
window.initEUER = initEUER;
window.renderEUER = renderEUER;
window.druckeEUER = druckeEUER;
