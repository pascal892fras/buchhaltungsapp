/**
 * Benutzerdefinierte Kategorien Handling
 * Verwaltet das Anzeigen/Verstecken von Custom-Input Feldern
 */

import { getKategorieById } from './kategorien.js';

/**
 * Initialisiert Event-Listener für Kategorie-Selects
 * Zeigt/versteckt Custom-Input Feld je nach Auswahl
 */
export function initializeCustomCategoryHandlers() {
  // Ausgaben-Form Handler
  const ausgabenKatSelect = document.getElementById('a-kat');
  if (ausgabenKatSelect) {
    ausgabenKatSelect.addEventListener('change', () => {
      handleCategoryChange('a-kat', 'a-custom-kat-container', 'a-custom-kat');
    });
  }

  // OCR-Form Handler
  const ocrKatSelect = document.getElementById('ocr-kat');
  if (ocrKatSelect) {
    ocrKatSelect.addEventListener('change', () => {
      handleCategoryChange('ocr-kat', 'ocr-custom-kat-container', 'ocr-custom-kat');
    });
  }
}

/**
 * Handelt Kategorie-Wechsel
 * Zeigt Custom-Input wenn "custom" ausgewählt
 */
function handleCategoryChange(selectId, containerId, inputId) {
  const select = document.getElementById(selectId);
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);

  if (!select || !container || !input) {
    console.error(`Fehler: Elemente nicht gefunden (${selectId}, ${containerId}, ${inputId})`);
    return;
  }

  const selectedId = select.value;
  const kategorie = getKategorieById(selectedId);

  if (kategorie?.isCustom) {
    // Zeige Custom-Input
    container.style.display = 'block';
    input.focus();
  } else {
    // Verstecke Custom-Input und leere es
    container.style.display = 'none';
    input.value = '';
  }
}

/**
 * Holt die endgültige Kategorie (custom-Text oder normale Kategorie)
 * @param {string} selectId - ID des Selects (z.B. 'a-kat')
 * @param {string} customInputId - ID des Custom-Input Feldes
 * @returns {object} - { kategorieName: string, kategorieId: string, isCustom: boolean }
 */
export function getFinalCategory(selectId, customInputId) {
  const select = document.getElementById(selectId);
  const customInput = document.getElementById(customInputId);

  if (!select) {
    console.error(`Select ${selectId} nicht gefunden`);
    return null;
  }

  const selectedId = select.value;
  const kategorie = getKategorieById(selectedId);

  if (kategorie?.isCustom) {
    const customText = customInput?.value?.trim();

    if (!customText) {
      throw new Error('Bitte geben Sie einen Kategorienamen ein!');
    }

    return {
      kategorieName: customText,
      kategorieId: 'custom',
      isCustom: true,
    };
  }

  return {
    kategorieName: kategorie?.name || 'Unbekannt',
    kategorieId: selectedId || 'unknown',
    isCustom: false,
  };
}

/**
 * Validiert dass eine Kategorie ausgewählt/eingegeben wurde
 */
export function validateCategory(selectId, customInputId) {
  const select = document.getElementById(selectId);
  const customInput = document.getElementById(customInputId);

  if (!select || !select.value) {
    throw new Error('Bitte wählen Sie eine Kategorie aus!');
  }

  const kategorie = getKategorieById(select.value);

  if (kategorie?.isCustom) {
    if (!customInput?.value?.trim()) {
      throw new Error('Bitte geben Sie einen Kategorienamen ein!');
    }
  }

  return true;
}

/**
 * Reset: Leert alle Custom-Input Felder
 */
export function resetCustomInputs() {
  const inputs = document.querySelectorAll('[id$="-custom-kat"]');
  inputs.forEach((input) => {
    input.value = '';
    input.parentElement.style.display = 'none';
  });
}
