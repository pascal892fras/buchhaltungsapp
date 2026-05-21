/**
 * PDF-Templates und Druck-Funktionen
 * Dies ist ein großes Modul - für die Vollversion siehe den Original-Code
 */

import { state } from './state.js';
import { fmt, formatDatum, today, toast, fmtEUR } from './helpers.js';
import { berechneVerzugszinsen } from './rechnungen.js';

export function druckeDokument(doc, kunde, typ) {
  const s = state.settings;
  const istAngebot = typ === 'Angebot';

  // Template-Einstellungen mit Defaults
  const tplColorHighlight = s.tpl_color_highlight || '#000000';
  const tplColorText = s.tpl_color_text || '#333333';
  const tplColorTableBorder = s.tpl_color_table_border || '#e0e0e0';
  const tplColorTableBg = s.tpl_color_table_bg || '#fef9e6';
  const tplColorBg = s.tpl_color_bg || '#ffffff';
  const tplTableStyle = s.tpl_table_style || 'modern';
  const tplLogoH = s.tpl_logo_pos_h || 'right';
  const tplLogoSize = s.tpl_logo_size || '140';

  // Datumsformatierung
  const datumFormatiert = formatDatum(doc.datum);
  const faelligFormatiert = formatDatum(doc.faellig);
  const kundennummer = kunde ? (kunde.kundennummer || '—') : '—';

  // Tabellen-Stil
  let rowBorder, headerBorder;
  if (tplTableStyle === 'classic') {
    rowBorder = '2px solid ' + tplColorTableBorder;
    headerBorder = '2px solid ' + tplColorTableBorder;
  } else if (tplTableStyle === 'minimal') {
    rowBorder = 'none';
    headerBorder = '1px solid ' + tplColorTableBorder;
  } else {
    rowBorder = '1px solid ' + tplColorTableBorder;
    headerBorder = '1px solid ' + tplColorTableBorder;
  }

  // Positionstabelle
  const pos = doc.positionen.map((p, i) => `<tr>
    <td style="padding:10px 8px;border-bottom:${rowBorder};color:${tplColorText}">${i + 1}.</td>
    <td style="padding:10px 8px;border-bottom:${rowBorder};color:${tplColorText}">${p.beschr}</td>
    <td style="text-align:right;padding:10px 8px;border-bottom:${rowBorder};color:${tplColorText}">${Number(p.menge).toFixed(2).replace('.', ',')} Stk</td>
    <td style="text-align:right;padding:10px 8px;border-bottom:${rowBorder};color:${tplColorText}">${fmtEUR(p.ep)}</td>
    <td style="text-align:right;padding:10px 8px;border-bottom:${rowBorder};color:${tplColorText}">${fmtEUR(p.menge * p.ep)}</td>
  </tr>`).join('');

  const logoImg = state.logoData ? `<img src="${state.logoData}" style="max-width:${tplLogoSize}px;max-height:80px;object-fit:contain">` : '';
  const logoAlign = tplLogoH === 'left' ? 'left' : tplLogoH === 'center' ? 'center' : 'right';

  const kundeAdresse = kunde ? (kunde.adresse || '').split('\n') : [];
  const firmaAdresse = (s.adresse || '').split('\n');
  const absenderText = `${s.name || 'Firmenname'} / ${firmaAdresse[0] || ''} / ${firmaAdresse[1] || ''}`;

  // QR-Code für Zahlungen
  let qrCodeHtml = '';
  if (!istAngebot && s.iban) {
    const betrag = Number(doc.gesamt).toFixed(2);
    const epcData = `BCD\n002\n1\nSCT\n${s.bic || ''}\n${s.kontoinhaber || s.name || ''}\n${s.iban.replace(/\s/g, '')}\nEUR${betrag}\n\n\nRechnung ${doc.nr}`;
    const qrDataEncoded = encodeURIComponent(epcData);
    const qrSize = parseInt(s.tpl_qr_size, 10) || 120;
    qrCodeHtml = `<div class="qr-section">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${qrDataEncoded}" width="${qrSize}" height="${qrSize}" alt="GiroCode" onerror="this.style.display='none'">
      <div style="font-size:8px;color:#666;margin-top:4px">Scannen für Überweisung</div>
      <div style="font-size:8px;color:#666">${fmtEUR(doc.gesamt)}</div>
    </div>`;
  }

  // Bank-Details
  let bankFooterHtml = '';
  if (!istAngebot && s.iban && s.tpl_bank_details_pos === 'footer') {
    bankFooterHtml = `<div style="margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:9px;color:#666">
      <strong>Bankverbindung:</strong> ${s.bank || ''} | IBAN: ${s.iban} ${s.bic ? '| BIC: ' + s.bic : ''} | Kontoinhaber: ${s.kontoinhaber || s.name || ''}
    </div>`;
  }

  // Intro-Text und Grußformel aus Einstellungen
  const introText = s.tpl_intro_text || 'Sehr geehrte Damen und Herren,<br><br>hiermit stellen wir Ihnen folgende Leistungen in Rechnung:';
  const greeting = s.tpl_greeting || 'Mit freundlichen Grüßen';
  const angebotIntro = 'Sehr geehrte Damen und Herren,<br><br>wir unterbreiten Ihnen folgendes Angebot:';

  // Notiz/Fußnote
  const notizText = istAngebot
    ? (doc.notiz || s.angfussnote || '')
    : (doc.notiz || s.fussnote || '');
  const notizHtml = notizText
    ? `<div style="margin-top:20px;font-size:9px;color:#666;white-space:pre-line">${notizText}</div>`
    : '';

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>${typ} ${doc.nr}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:${tplColorBg}}
    body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:${tplColorText};padding:40px 50px;line-height:1.5;min-height:1100px}
    .absender-zeile{font-size:8px;color:#666;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:10px}
    .logo-container{text-align:${logoAlign};margin-bottom:10px}
    .rechnungs-info table{width:100%;border-collapse:collapse}
    .rechnungs-info td{padding:4px 0;vertical-align:top}
    table.positionen{width:100%;border-collapse:collapse;margin:20px 0}
    table.positionen th{background:${tplColorTableBg};color:${tplColorHighlight};padding:10px 8px;font-weight:600;border-bottom:${headerBorder}}
    .summen-block table{width:100%;border-collapse:collapse;margin-top:10px}
    .summen-block td{padding:8px;background:${tplColorTableBg}}
    .qr-section{margin-top:30px;text-align:center;padding:8px;border:1px dashed #ccc;border-radius:4px}
  </style></head><body>
    <div class="absender-zeile">${absenderText}</div>
    <div class="logo-container">${logoImg}</div>
    <div style="margin:20px 0;font-size:10px"><strong>${kunde ? kunde.name : doc.kunde}</strong><br>${kundeAdresse[0] || ''}<br>${kundeAdresse[1] || ''}</div>
    <div style="margin:30px 0 10px 0;text-align:right"><strong>${datumFormatiert}</strong></div>
    <h1 style="font-size:16px;color:${tplColorHighlight};margin:20px 0 5px 0">${typ} ${doc.nr}</h1>
    ${!istAngebot ? `<div style="font-size:9px;color:#666;margin-bottom:15px">Fällig am: ${faelligFormatiert}</div>` : ''}
    <div style="font-size:10px;margin:15px 0 20px 0;line-height:1.6">${istAngebot ? angebotIntro : introText}</div>
    <table class="positionen">
      <thead><tr>
        <th></th><th>Beschreibung</th><th style="text-align:right;width:80px">Menge</th><th style="text-align:right;width:100px">Einzelpreis</th><th style="text-align:right;width:100px">Gesamtpreis</th>
      </tr></thead>
      <tbody>${pos}</tbody>
    </table>
    <div class="summen-block"><table>
      <tr><td>Gesamtbetrag netto</td><td style="text-align:right">${fmtEUR(doc.gesamt)}</td></tr>
      <tr><td colspan="2">Umsatzsteuer nicht erhoben gemäß §19 UStG.</td></tr>
      <tr><td><strong>Gesamtbetrag brutto</strong></td><td style="text-align:right"><strong>${fmtEUR(doc.gesamt)}</strong></td></tr>
    </table></div>
    ${notizHtml}
    <div style="margin-top:30px;font-size:10px">${greeting}<br><br><strong>${s.name || ''}</strong></div>
    ${qrCodeHtml}
    ${bankFooterHtml}
  </body></html>`;

  window.api.printPDF(html, `${typ}_${doc.nr.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`);
}

export function vorschauTemplate() {
  const beispielDoc = {
    nr: 'RE-2024-001',
    datum: today(),
    faellig: today(),
    kundeId: '1',
    kunde: 'Musterfirma GmbH',
    positionen: [
      { beschr: 'Beratungsleistung', menge: 5, ep: 120 },
      { beschr: 'Softwareentwicklung', menge: 10, ep: 85 }
    ],
    gesamt: 1450,
    status: 'offen'
  };

  const beispielKunde = {
    id: '1',
    name: 'Musterfirma GmbH',
    kontakt: 'Max Mustermann',
    adresse: 'Musterstraße 123\n12345 Musterstadt',
    mail: 'info@musterfirma.de',
    tel: '0123 456789'
  };

  druckeDokument(beispielDoc, beispielKunde, 'Rechnung');
  toast('Vorschau wird generiert...');
}

// Exportiere für globale Verfügbarkeit
window.druckeDokument = druckeDokument;
window.vorschauTemplate = vorschauTemplate;
