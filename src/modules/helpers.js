/**
 * Utility Helper Functions
 * Enthält zentrale Utility-Funktionen für Formatierung, Datumsverwaltung und UI-Interaktion
 */

/**
 * Prüft, ob ein Datum im gültigen Format ist
 *
 * @param {string} dateStr - Datum im Format YYYY-MM-DD
 * @returns {boolean} true wenn Datum gültig ist
 *
 * @example
 * isValidDate('2024-01-15')  // → true
 * isValidDate('2024-13-01')  // → false
 */
export function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Prüft, ob ein Betrag gültig ist (positive Dezimalzahl)
 *
 * @param {number|string} betrag - Zu prüfender Betrag
 * @returns {boolean} true wenn Betrag > 0 ist
 *
 * @example
 * isValidBetrag(100.50)   // → true
 * isValidBetrag('50.00')  // → true
 * isValidBetrag(0)        // → false
 */
export function isValidBetrag(betrag) {
  const num = parseFloat(betrag);
  return !isNaN(num) && num > 0;
}

/**
 * Formatiert eine Zahl als Euro-Betrag mit Währungssymbol
 *
 * @param {number|string} n - Die zu formatierende Zahl
 * @returns {string} Formatierter Betrag mit € Symbol (z.B. "1.234,56 €")
 *
 * @example
 * fmt(1234.567)  // → "1.234,57 €"
 * fmt(99.99)     // → "99,99 €"
 * fmt(null)      // → "0,00 €"
 */
export function fmt(n) {
  return Number(n).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}

/**
 * Gibt das heutige Datum im ISO-Format YYYY-MM-DD zurück
 *
 * @returns {string} Heutiges Datum im Format YYYY-MM-DD
 *
 * @example
 * today()  // → "2024-01-15"
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Addiert eine bestimmte Anzahl von Tagen zu einem Datum
 *
 * @param {string} d - Ausgangsdatum im Format YYYY-MM-DD
 * @param {number} n - Anzahl der hinzuzufügenden Tage
 * @returns {string} Neues Datum im Format YYYY-MM-DD
 *
 * @example
 * addDays('2024-01-15', 5)   // → "2024-01-20"
 * addDays('2024-01-31', 1)   // → "2024-02-01"
 * addDays('2024-01-15', -5)  // → "2024-01-10"
 */
export function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split('T')[0];
}

/**
 * Berechnet das nächste Datum basierend auf einem Wiederholungsintervall
 *
 * @param {string} from - Ausgangsdatum im Format YYYY-MM-DD
 * @param {string} intervall - Wiederholungsintervall: 'monatlich', 'quartalsweise', 'halbjaehrlich', 'jaehrlich'
 * @returns {string} Nächstes Datum im Format YYYY-MM-DD
 *
 * @example
 * nextDate('2024-01-15', 'monatlich')       // → "2024-02-15"
 * nextDate('2024-01-15', 'jaehrlich')       // → "2025-01-15"
 * nextDate('2024-01-15', 'quartalsweise')   // → "2024-04-15"
 */
export function nextDate(from, intervall) {
  const d = new Date(from);
  if (intervall === 'monatlich') d.setMonth(d.getMonth() + 1);
  else if (intervall === 'quartalsweise') d.setMonth(d.getMonth() + 3);
  else if (intervall === 'halbjaehrlich') d.setMonth(d.getMonth() + 6);
  else if (intervall === 'jaehrlich') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Zeigt eine Toast-Benachrichtigung für 2,5 Sekunden
 *
 * @param {string} msg - Nachricht zum Anzeigen
 * @returns {void}
 *
 * @example
 * toast('Rechnung gespeichert')  // Zeigt Benachrichtigung
 */
export function toast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }
}

/**
 * Formatiert Datum von ISO-Format YYYY-MM-DD zu deutschem Format DD.MM.YYYY
 *
 * @param {string} d - Datum im Format YYYY-MM-DD
 * @returns {string} Datum im Format DD.MM.YYYY oder '—' wenn Eingabe leer
 *
 * @example
 * formatDatum('2024-01-15')  // → "15.01.2024"
 * formatDatum(null)          // → "—"
 */
export function formatDatum(d) {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return d;
}

/**
 * Formatiert Zahl als EUR-Betrag ohne Währungssymbol
 *
 * @param {number|string} n - Die zu formatierende Zahl
 * @returns {string} Formatierter Betrag (z.B. "1.234,56 EUR")
 *
 * @example
 * fmtEUR(1234.567)  // → "1.234,57 EUR"
 * fmtEUR(99.99)     // → "99,99 EUR"
 */
export function fmtEUR(n) {
  return Number(n).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' EUR';
}

/**
 * Konvertiert eine File zu Base64-Encoded String
 *
 * @param {File} file - Die zu konvertierende Datei
 * @returns {Promise<string>} Base64-encodierter String der Datei
 * @throws {Error} Wenn FileReader auf einen Fehler trifft
 *
 * @example
 * const file = document.getElementById('file-input').files[0];
 * const base64 = await toBase64(file);
 */
export async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Form Draft Management - Speichern und Laden von Formular-Entwürfen
 */

/**
 * Speichert den aktuellen Zustand eines Formulars als Draft im localStorage
 * Ermöglicht es Benutzern, ihre Eingaben zu resumieren, wenn sie das Formular später öffnen
 *
 * @param {string} formId - ID des zu speichernden Formulars (z.B. "rechnung-form")
 * @returns {void}
 *
 * @example
 * saveFormDraft('rechnung-form');
 * // Speichert alle Input-, Select- und Textarea-Felder sowie Positionen
 */
export function saveFormDraft(formId) {
  const drafts = JSON.parse(localStorage.getItem('formDrafts') || '{}');
  const form = document.getElementById(formId);
  if (!form || form.style.display === 'none') return;

  const formData = {};
  form.querySelectorAll('input, select, textarea').forEach((el) => {
    if (el.id) formData[el.id] = el.value;
  });

  // Positionen separat speichern
  const posContainer = form.querySelector('[id$="-positionen"]');
  if (posContainer) {
    formData._positions = [];
    posContainer.querySelectorAll('.pos-row').forEach((row) => {
      formData._positions.push({
        beschr: row.children[0].value,
        menge: row.children[1].value,
        ep: row.children[2].value,
      });
    });
  }

  drafts[formId] = formData;
  localStorage.setItem('formDrafts', JSON.stringify(drafts));
}

/**
 * Lädt einen gespeicherten Formular-Entwurf und füllt das Formular damit
 *
 * @param {string} formId - ID des zu ladenden Formulars
 * @returns {boolean} true wenn Draft geladen wurde, false wenn kein Draft existiert
 *
 * @example
 * if (loadFormDraft('rechnung-form')) {
 *   toast('Entwurf wiederhergestellt');
 * }
 */
export function loadFormDraft(formId) {
  const drafts = JSON.parse(localStorage.getItem('formDrafts') || '{}');
  const draft = drafts[formId];
  if (!draft) return false;

  // Normale Felder
  Object.keys(draft).forEach((key) => {
    if (key !== '_positions') {
      const el = document.getElementById(key);
      if (el) el.value = draft[key];
    }
  });

  // Positionen
  if (draft._positions && draft._positions.length > 0) {
    const posContainer = document.querySelector(`#${formId} [id$="-positionen"]`);
    if (posContainer) {
      posContainer.innerHTML = '';
      const formType = formId.includes('rechnung')
        ? 'r'
        : formId.includes('angebot')
          ? 'ang'
          : 'rec';
      const makeRowFn = formType === 'r' ? 'addRPos' : formType === 'ang' ? 'addAngPos' : 'addRecPos';
      const calcFn = formType === 'r' ? 'calcR' : formType === 'ang' ? 'calcAng' : 'calcRec';

      draft._positions.forEach((pos) => {
        window[makeRowFn]();
        const rows = posContainer.querySelectorAll('.pos-row');
        const row = rows[rows.length - 1];
        if (row) {
          row.children[0].value = pos.beschr;
          row.children[1].value = pos.menge;
          row.children[2].value = pos.ep;
        }
      });
      window[calcFn]();
    }
  }

  return true;
}

/**
 * Löscht einen gespeicherten Formular-Entwurf
 *
 * @param {string} formId - ID des Formulars, dessen Draft gelöscht werden soll
 * @returns {void}
 *
 * @example
 * clearFormDraft('rechnung-form');
 * // Draft ist nun gelöscht
 */
export function clearFormDraft(formId) {
  const drafts = JSON.parse(localStorage.getItem('formDrafts') || '{}');
  delete drafts[formId];
  localStorage.setItem('formDrafts', JSON.stringify(drafts));
}
