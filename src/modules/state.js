/**
 * State Management
 * Zentrale Verwaltung von Applikationsdaten und Einstellungen
 */

export const state = {
  data: {
    kunden: [],
    rechnungen: [],
    ausgaben: [],
    angebote: [],
    wiederkehrend: []
  },

  settings: {
    // Firmendaten
    name: '',
    beruf: '',
    adresse: '',
    tel: '',
    mail: '',
    web: '',
    steuernr: '',

    // Bankverbindung
    bank: '',
    kontoinhaber: '',
    iban: '',
    bic: '',
    zahltage: 14,

    // Rechnungs- & Angebots-Nummern
    prefix: 'RE',
    angprefix: 'ANG',
    fussnote: 'Gemäß §19 UStG wird keine Umsatzsteuer ausgewiesen.',
    angfussnote: 'Dieses Angebot ist freibleibend und unverbindlich. Preise in Euro, netto gemäß §19 UStG.',

    // App-Darstellung
    darkmode: false,

    // Template-Einstellungen
    tpl_logo_pos_v: 'top',
    tpl_logo_pos_h: 'right',
    tpl_logo_size: '140',
    tpl_qr_size: '120',
    tpl_color_highlight: '#000000',
    tpl_color_text: '#000000',
    tpl_color_table_border: '#000000',
    tpl_color_table_bg: '#fef9e6',
    tpl_color_bg: '#ffffff',
    tpl_company_pos: 'top-left',
    tpl_customer_pos: 'left',
    tpl_intro_text: 'Sehr geehrte Damen und Herren,<br><br>vielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!<br>Hiermit stelle ich Ihnen die folgenden Leistungen in Rechnung:',
    tpl_greeting: 'Mit freundlichen Grüßen',
    tpl_bank_details_pos: 'footer',
    tpl_table_style: 'modern',

    // Mahnungen
    mahnung_prefix: 'M',
    mahngebuehr_stufe1: 0,
    mahngebuehr_stufe2: 5,
    mahngebuehr_stufe3: 10,
    verzugszins_pct: 9.12,
    mahnung_frist_stufe1: 7,
    mahnung_frist_stufe2: 7,
    mahnung_frist_stufe3: 7,
    mahnung_text_stufe1: 'bei Durchsicht unserer Buchhaltung haben wir festgestellt, dass die unten aufgeführte Rechnung bisher nicht beglichen wurde. Möglicherweise ist Ihnen dies entgangen – wir möchten Sie daher freundlich an die ausstehende Zahlung erinnern. Bitte überweisen Sie den offenen Betrag bis zum genannten Datum.',
    mahnung_text_stufe2: 'trotz unserer Zahlungserinnerung konnten wir bisher keinen Zahlungseingang feststellen. Wir fordern Sie hiermit auf, den ausstehenden Betrag inkl. Mahngebühren und Verzugszinsen umgehend zu begleichen. Eine weitere Mahnung würde zusätzliche Kosten verursachen.',
    mahnung_text_stufe3: 'trotz mehrfacher Aufforderung haben Sie die offene Forderung bisher nicht beglichen. Dies ist unsere letzte Mahnung. Sollte der Gesamtbetrag nicht bis zum unten genannten Termin auf unserem Konto eingegangen sein, sehen wir uns gezwungen, ohne weitere Ankündigung das gerichtliche Mahnverfahren einzuleiten bzw. die Forderung an ein Inkassobüro zu übergeben.'
  },

  logoData: '',
  positionCounters: {
    r: 0,
    ang: 0,
    rec: 0
  }
};

/**
 * Speichern und Laden von Daten
 */
export async function loadData() {
  const loaded = await window.api.loadData();
  if (!loaded.angebote) loaded.angebote = [];
  if (!loaded.wiederkehrend) loaded.wiederkehrend = [];

  // Migration: Mahnungs-Felder auf bestehenden Rechnungen
  loaded.rechnungen.forEach(r => {
    if (r.mahnstufe === undefined) r.mahnstufe = 0;
    if (!r.mahnungen) r.mahnungen = [];
    if (r.status === 'bezahlt' && !r.bezahltAm) r.bezahltAm = r.datum;
  });

  state.data = loaded;
  return loaded;
}

export async function saveData() {
  await window.api.saveData(state.data);
}

export async function loadSettings() {
  const loaded = await window.api.loadSettings();
  if (loaded && Object.keys(loaded).length) {
    Object.assign(state.settings, loaded);
  }
  return state.settings;
}

export async function saveSettings() {
  await window.api.saveSettings(state.settings);
}

export async function loadLogo() {
  try {
    const logo = await window.api.loadLogo();
    state.logoData = logo;
    return logo;
  } catch (e) {
    console.error('Logo-Fehler:', e);
    return '';
  }
}

export async function saveLogo(logoData) {
  state.logoData = logoData;
  await window.api.saveLogo(logoData);
}
