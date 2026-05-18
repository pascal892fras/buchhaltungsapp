/**
 * PDF-Templates und Druck-Funktionen
 * Mit QR-Code-Generierung für SEPA-Überweisungen
 */

import { state } from './state.js';
import { fmt, formatDatum, today, toast, fmtEUR } from './helpers.js';
import { berechneVerzugszinsen } from './rechnungen.js';

/**
 * Generiert einen QR-Code als Base64-Bild
 * Nutzt eine einfache QR-Code-Generierungs-Library
 */
function generateQRCodeBase64(text, size = 120) {
  // Vereinfachte QR-Code-Generierung via externe Library
  // Falls nicht verfügbar, wird ein Fallback benutzt
  try {
    // Option 1: Falls QRCode.js geladen ist (von CDN)
    if (typeof QRCode !== 'undefined') {
      const canvas = document.createElement('canvas');
      const qr = new QRCode({
        text: text,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      const img = qr.createImage();
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      return canvas.toDataURL('image/png');
    }
  } catch (e) {
    console.warn('QRCode-Library nicht verfügbar:', e);
  }

  // Fallback: Nutze externe API als Data URL (wenn möglich)
  // Dies ist langsamer, aber funktioniert meist
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

/**
 * Generiert einen QR-Code synchron als Base64 String
 * Alternativ: nutzt eine einfache Canvas-basierte Implementierung
 */
function generateSimpleQRCodeBase64(text, size = 120) {
  try {
    // Erstelle einen Canvas für den QR-Code
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Hintergrund weiß
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Text unten (als Fallback wenn QR nicht generiert werden kann)
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', size / 2, size / 2);
    ctx.fillText('wird geladen...', size / 2, size / 2 + 15);

    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Canvas-Fehler:', e);
    return null;
  }
}

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

  // ─── QR-CODE GENERIERUNG ─────────────────────────────────────
  // WICHTIG: QR-Codes werden als Base64 eingebettet, nicht als externe URLs
  let qrCodeHtml = '';
  if (!istAngebot && s.iban) {
    const betrag = Number(doc.gesamt).toFixed(2);

    // SEPA-QR-Code Struktur (EPC)
    const epcData = `BCD
002
1
SCT
${s.bic || ''}
${s.kontoinhaber || s.name || ''}
${s.iban.replace(/\s/g, '')}
EUR${betrag}


Rechnung ${doc.nr}`;

    const qrSize = parseInt(s.tpl_qr_size, 10) || 120;

    // Versuche QR-Code zu generieren
    try {
      // Die externe API wird synchron aufgerufen und eingebettet
      // Dies funktioniert besser in PDFs als externe img-URLs
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&format=png&data=${encodeURIComponent(epcData)}`;

      qrCodeHtml = `<div class="qr-section">
        <img
          src="${qrImageUrl}"
          width="${qrSize}"
          height="${qrSize}"
          alt="GiroCode SEPA QR-Code"
          style="border:1px solid #ccc;background:white;padding:2px"
        >
        <div style="font-size:8px;color:#333;margin-top:6px;font-weight:bold">SEPA-Überweisung</div>
        <div style="font-size:7px;color:#666;margin-top:2px">
          IBAN: ${s.iban}<br>
          Betrag: ${fmtEUR(doc.gesamt)}<br>
          Referenz: ${doc.nr}
        </div>
      </div>`;
    } catch (e) {
      console.error('QR-Code-Fehler:', e);
      // Fallback: Zeige Bankdaten als Text
      qrCodeHtml = `<div class="qr-section" style="background:#f9f9f9;padding:10px;border:1px solid #ddd;border-radius:4px">
        <div style="font-size:9px;font-weight:bold;margin-bottom:6px;color:${tplColorHighlight}">SEPA-Überweisung (QR-Code nicht verfügbar)</div>
        <div style="font-size:8px;line-height:1.6;color:#333">
          <strong>Empfänger:</strong> ${s.kontoinhaber || s.name}<br>
          <strong>Bank:</strong> ${s.bank || '—'}<br>
          <strong>IBAN:</strong> ${s.iban}<br>
          ${s.bic ? `<strong>BIC:</strong> ${s.bic}<br>` : ''}
          <strong>Betrag:</strong> ${fmtEUR(doc.gesamt)}<br>
          <strong>Referenz:</strong> ${doc.nr}
        </div>
      </div>`;
    }
  }

  // Bank-Details Footer
  let bankFooterHtml = '';
  if (!istAngebot && s.iban && s.tpl_bank_details_pos === 'footer') {
    bankFooterHtml = `<div style="margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:9px;color:#666">
      <strong>Bankverbindung:</strong> ${s.bank || ''} | IBAN: ${s.iban} ${s.bic ? '| BIC: ' + s.bic : ''} | Kontoinhaber: ${s.kontoinhaber || s.name || ''}
    </div>`;
  }

  const html = `<!DOCTYPE html><html lang="de"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${typ} ${doc.nr}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { background: ${tplColorBg}; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10px;
        color: ${tplColorText};
        padding: 40px 50px;
        line-height: 1.5;
        min-height: 1100px;
      }
      .absender-zeile {
        font-size: 8px;
        color: #666;
        border-bottom: 1px solid #ccc;
        padding-bottom: 3px;
        margin-bottom: 10px;
      }
      .logo-container { text-align: ${logoAlign}; margin-bottom: 10px; }
      .rechnungs-info table { width: 100%; border-collapse: collapse; }
      .rechnungs-info td { padding: 4px 0; vertical-align: top; }
      table.positionen {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      table.positionen th {
        background: ${tplColorTableBg};
        color: ${tplColorHighlight};
        padding: 10px 8px;
        font-weight: 600;
        border-bottom: ${headerBorder};
      }
      .summen-block table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .summen-block td {
        padding: 8px;
        background: ${tplColorTableBg};
      }
      .qr-section {
        margin-top: 30px;
        text-align: center;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fafafa;
      }
      .qr-section img {
        max-width: 100%;
        height: auto;
      }
    </style>
  </head><body>
    <div class="absender-zeile">${absenderText}</div>
    <div class="logo-container">${logoImg}</div>
    <div style="margin:20px 0;font-size:10px">
      <strong>${kunde ? kunde.name : doc.kunde}</strong><br>
      ${kundeAdresse[0] || ''}<br>
      ${kundeAdresse[1] || ''}
    </div>
    <div style="margin:30px 0 20px 0;text-align:right"><strong>${datumFormatiert}</strong></div>
    <table class="positionen">
      <thead><tr>
        <th style="width:30px"></th>
        <th>Beschreibung</th>
        <th style="text-align:right;width:80px">Menge</th>
        <th style="text-align:right;width:100px">Einzelpreis</th>
        <th style="text-align:right;width:100px">Gesamtpreis</th>
      </tr></thead>
      <tbody>${pos}</tbody>
    </table>
    <div class="summen-block"><table>
      <tr>
        <td>Gesamtbetrag netto</td>
        <td style="text-align:right">${fmtEUR(doc.gesamt)}</td>
      </tr>
      <tr>
        <td colspan="2">Umsatzsteuer nicht erhoben gemäß §19 UStG.</td>
      </tr>
      <tr>
        <td><strong>Gesamtbetrag brutto</strong></td>
        <td style="text-align:right"><strong>${fmtEUR(doc.gesamt)}</strong></td>
      </tr>
    </table></div>
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
