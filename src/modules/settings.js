/**
 * Einstellungen und Konfiguration
 */

import { state, saveSettings, loadLogo, saveLogo } from './state.js';
import { toast, toBase64 } from './helpers.js';
import { encryptSettings, decryptSettings, maskIBAN } from './encryption.js';

export async function speichernSettings() {
  // Firmendaten
  ['name', 'beruf', 'adresse', 'tel', 'mail', 'web', 'steuernr', 'bank', 'kontoinhaber', 'iban', 'bic', 'fussnote', 'angfussnote', 'prefix', 'angprefix'].forEach(k => {
    const el = document.getElementById('s-' + k);
    if (el) state.settings[k] = el.value;
  });

  // ✅ API-Keys
  const anthropicKey = document.getElementById('s-anthropic-api-key');
  if (anthropicKey) {
    const apiKey = anthropicKey.value.trim();
    if (apiKey) {
      localStorage.setItem('anthropic_api_key', apiKey);
      toast('✅ Anthropic API-Key gespeichert');
    }
  }

  state.settings.zahltage = parseInt(document.getElementById('s-zahltage').value) || 14;

  // Darstellung
  const darkEl = document.getElementById('s-darkmode');
  if (darkEl) {
    state.settings.darkmode = darkEl.checked;
    applyDarkmode(state.settings.darkmode);
  }

  // Template-Einstellungen
  [
    'tpl_logo_pos_v', 'tpl_logo_pos_h', 'tpl_logo_size', 'tpl_qr_size',
    'tpl_color_highlight', 'tpl_color_text', 'tpl_color_table_border', 'tpl_color_table_bg', 'tpl_color_bg',
    'tpl_table_style', 'tpl_company_pos', 'tpl_customer_pos', 'tpl_bank_details_pos',
    'tpl_intro_text', 'tpl_greeting'
  ].forEach(k => {
    const el = document.getElementById('s-' + k);
    if (el) state.settings[k] = el.value;
  });

  // Mahnungs-Einstellungen
  const mahnSettings = [
    'mahnung_prefix', 'verzugszins_pct',
    'mahngebuehr_stufe1', 'mahngebuehr_stufe2', 'mahngebuehr_stufe3',
    'mahnung_frist_stufe1', 'mahnung_frist_stufe2', 'mahnung_frist_stufe3',
    'mahnung_text_stufe1', 'mahnung_text_stufe2', 'mahnung_text_stufe3'
  ];

  mahnSettings.forEach(k => {
    const el = document.getElementById('s-' + k);
    if (el) {
      if (k.includes('pct') || k.includes('gebuehr')) {
        state.settings[k] = parseFloat(el.value) || 0;
      } else if (k.includes('frist')) {
        state.settings[k] = parseInt(el.value) || 7;
      } else {
        state.settings[k] = el.value;
      }
    }
  });

  state.settings = encryptSettings(state.settings);
  await saveSettings();
  const c = document.getElementById('s-confirm');
  if (c) {
    c.style.display = 'block';
    setTimeout(() => c.style.display = 'none', 2500);
  }
  toast('Einstellungen gespeichert');
}

export async function ladeSettings() {
  // Entschlüssele sensible Daten
  state.settings = decryptSettings(state.settings);

  // ✅ API-Keys laden
  const anthropicKey = document.getElementById('s-anthropic-api-key');
  if (anthropicKey) {
    const storedKey = localStorage.getItem('anthropic_api_key');
    if (storedKey) {
      anthropicKey.value = storedKey;
    }
  }

  // Firmendaten
  ['name', 'beruf', 'adresse', 'tel', 'mail', 'web', 'steuernr', 'bank', 'kontoinhaber', 'iban', 'bic', 'fussnote', 'angfussnote', 'prefix', 'angprefix'].forEach(k => {
    const el = document.getElementById('s-' + k);
    if (el && state.settings[k] !== undefined) el.value = state.settings[k];
  });

  if (state.settings.zahltage) {
    document.getElementById('s-zahltage').value = state.settings.zahltage;
  }

  // Darstellung
  const darkEl = document.getElementById('s-darkmode');
  if (darkEl) darkEl.checked = state.settings.darkmode === true;

  // Template-Einstellungen laden
  const tplKeys = [
    'tpl_logo_pos_v', 'tpl_logo_pos_h', 'tpl_logo_size', 'tpl_qr_size',
    'tpl_color_highlight', 'tpl_color_text', 'tpl_color_table_border', 'tpl_color_table_bg', 'tpl_color_bg',
    'tpl_table_style', 'tpl_company_pos', 'tpl_customer_pos', 'tpl_bank_details_pos',
    'tpl_intro_text', 'tpl_greeting'
  ];

  tplKeys.forEach(k => {
    const el = document.getElementById('s-' + k);
    if (el && state.settings[k]) el.value = state.settings[k];
  });

  // Mahnungs-Einstellungen laden
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  };

  setVal('s-mahnung-prefix', state.settings.mahnung_prefix);
  setVal('s-verzugszins', state.settings.verzugszins_pct);
  setVal('s-mahngebuehr-1', state.settings.mahngebuehr_stufe1);
  setVal('s-mahngebuehr-2', state.settings.mahngebuehr_stufe2);
  setVal('s-mahngebuehr-3', state.settings.mahngebuehr_stufe3);
  setVal('s-mahnung-frist-1', state.settings.mahnung_frist_stufe1);
  setVal('s-mahnung-frist-2', state.settings.mahnung_frist_stufe2);
  setVal('s-mahnung-frist-3', state.settings.mahnung_frist_stufe3);
  setVal('s-mahnung-text-1', state.settings.mahnung_text_stufe1);
  setVal('s-mahnung-text-2', state.settings.mahnung_text_stufe2);
  setVal('s-mahnung-text-3', state.settings.mahnung_text_stufe3);

  // Logo laden
  if (!state.logoData) {
    state.logoData = await loadLogo();
  }

  if (state.logoData) {
    document.getElementById('logo-preview-img').src = state.logoData;
    document.getElementById('logo-preview').style.display = 'block';
    document.getElementById('btn-logo-delete').style.display = 'inline-flex';
  }
}

// ─── DARKMODE ────────────────────────────────────────────
export function applyDarkmode(enabled) {
  if (enabled) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export async function toggleDarkmode(enabled) {
  state.settings.darkmode = !!enabled;
  applyDarkmode(state.settings.darkmode);
  await saveSettings();
}

// ─── LOGO VERWALTUNG ─────────────────────────────────────
export async function handleLogoUpload(input) {
  if (!input.files.length) return;

  const file = input.files[0];

  // Größen-Check
  if (file.size > 5000000) {
    toast('Logo zu groß! Maximal 5MB erlaubt.');
    input.value = '';
    return;
  }

  const base64 = await toBase64(file);
  const dataUrl = `data:${file.type};base64,${base64}`;

  state.logoData = dataUrl;
  await saveLogo(dataUrl);

  document.getElementById('logo-preview-img').src = dataUrl;
  document.getElementById('logo-preview').style.display = 'block';
  document.getElementById('btn-logo-delete').style.display = 'inline-flex';

  updateSidebarLogo();
  toast('Logo hochgeladen');
}

export function updateSidebarLogo() {
  const logoImg = document.getElementById('sidebar-logo-img');
  const logoText = document.getElementById('sidebar-logo-text');

  if (state.logoData) {
    logoImg.src = state.logoData;
    logoImg.style.display = 'block';
    logoText.style.display = 'none';
  } else {
    logoImg.style.display = 'none';
    logoText.style.display = 'block';
  }
}

export async function loescheLogo() {
  if (!confirm('Logo wirklich entfernen?')) return;

  state.logoData = '';
  await saveLogo('');

  document.getElementById('logo-preview').style.display = 'none';
  document.getElementById('btn-logo-delete').style.display = 'none';
  document.getElementById('logo-upload').value = '';

  updateSidebarLogo();
  toast('Logo entfernt');
}

// Exportiere für globale Verfügbarkeit
window.speichernSettings = speichernSettings;
window.ladeSettings = ladeSettings;
window.toggleDarkmode = toggleDarkmode;
window.handleLogoUpload = handleLogoUpload;
window.loescheLogo = loescheLogo;
