/**
 * Buchhaltungsapp - Refaktorierte Hauptdatei
 *
 * Diese Datei importiert alle Module und orchestriert die Initialisierung.
 * Die App-Logik ist in separate, spezialisierte Module aufgeteilt.
 *
 * Module:
 * - state.js: Datenverwaltung und State Management
 * - helpers.js: Utility-Funktionen (fmt, today, toast, etc.)
 * - navigation.js: Navigation und UI-Kontrolle
 * - dashboard.js: Dashboard-Logik
 * - positions.js: Positionsverwaltung
 * - rechnungen.js: Rechnungen und Mahnungen
 * - angebote.js: Angebote
 * - wiederkehrend.js: Wiederkehrende Rechnungen
 * - kunden.js: Kundenverwaltung
 * - ausgaben.js: Ausgaben und KI-Belegerfassung
 * - templates.js: PDF-Generierung
 * - settings.js: Einstellungen
 * - euer.js: EÜR (Einnahmen-Überschuss-Rechnung)
 * - export.js: CSV-Export
 */

import { state, loadData, saveData, loadSettings, loadLogo } from './modules/state.js';
import { toast } from './modules/helpers.js';
import { showSection } from './modules/navigation.js';
import { updateDashboard } from './modules/dashboard.js';
import { applyDarkmode } from './modules/settings.js';
import { getKategorienHtml } from './modules/kategorien.js';
import { initializeCustomCategoryHandlers } from './modules/custom-categories.js';

// ─── KATEGORIEN INITIALISIEREN ──────────────────────────
function initializeCategorySelects() {
  try {
    const kategorienHtml = getKategorienHtml();

    // Select-Elemente mit Kategorien füllen
    const selectIds = ['a-kat', 'ocr-kat'];

    selectIds.forEach((id) => {
      const select = document.getElementById(id);
      if (select) {
        select.innerHTML = kategorienHtml;
      }
    });
  } catch (e) {
    console.error('Fehler beim Initialisieren der Kategorien:', e);
  }
}

// ─── INITIALISIERUNG ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Lade Daten
    await loadData();
    const settings = await loadSettings();

    // Wende Dark Mode sofort an
    applyDarkmode(state.settings.darkmode === true);

    // Render Initial Dashboard
    updateDashboard();
    showSection('dashboard');

    // Initialisiere Kategorien-Selects
    initializeCategorySelects();

    // Initialisiere Custom Category Handler
    initializeCustomCategoryHandlers();

    // Lade Logo asynchron
    setTimeout(async () => {
      try {
        await loadLogo();
        const { updateSidebarLogo } = await import('./modules/settings.js');
        updateSidebarLogo();
      } catch (e) {
        console.error('Logo-Fehler:', e);
      }
    }, 100);

    // Lade Settings-UI verzögert
    setTimeout(async () => {
      try {
        const { ladeSettings } = await import('./modules/settings.js');
        await ladeSettings();
      } catch (e) {
        console.error('Einstellungen-Fehler:', e);
      }
    }, 500);

  } catch (e) {
    console.error('Init-Fehler:', e);
    alert('Fehler beim Laden der App: ' + e.message);
  }
});

// ─── GLOBAL EXPORTS für Kompatibilität ──────────────────
// Diese Funktionen werden von der HTML aufgerufen und
// sind daher über window verfügbar

import * as navModule from './modules/navigation.js';
import * as dashModule from './modules/dashboard.js';
import * as rechModule from './modules/rechnungen.js';
import * as angModule from './modules/angebote.js';
import * as recModule from './modules/wiederkehrend.js';
import * as kunModule from './modules/kunden.js';
import * as ausModule from './modules/ausgaben.js';
import * as tplModule from './modules/templates.js';
import * as settModule from './modules/settings.js';
import * as euerModule from './modules/euer.js';
import * as expModule from './modules/export.js';

// Navigation
Object.assign(window, navModule);

// Dashboard
Object.assign(window, dashModule);

// Rechnungen
Object.assign(window, rechModule);

// Angebote
Object.assign(window, angModule);

// Wiederkehrend
Object.assign(window, recModule);

// Kunden
Object.assign(window, kunModule);

// Ausgaben
Object.assign(window, ausModule);

// Templates
Object.assign(window, tplModule);

// Settings
Object.assign(window, settModule);

// EÜR
Object.assign(window, euerModule);

// Export
Object.assign(window, expModule);

// ─── GLOBALE SPEZIALFUNKTIONEN ──────────────────────────

/**
 * Speichert und aktualisiert Dashboard
 */
window.save = async function() {
  await saveData();
  updateDashboard();
};

/**
 * Speichert Formulare automatisch (deaktiviert - Performance)
 */
window.setupAutoSave = function() {
  // Auto-Save ist deaktiviert, weil es Performance-Probleme verursacht
  // Manuelle Saves werden stattdessen verwendet
};

console.log('✓ Buchhaltungsapp initialisiert');
console.log('✓ Module: state, helpers, navigation, dashboard, positions');
console.log('✓ Module: rechnungen, angebote, wiederkehrend, kunden');
console.log('✓ Module: ausgaben, templates, settings, euer, export');
