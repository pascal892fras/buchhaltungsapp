/**
 * Input-Validierung für Buchhaltungsapp
 * Zentrale Validierungsfunktionen für alle kritischen Operationen
 */

import { isValidDate, isValidBetrag } from './helpers.js';

/**
 * Prüft, ob eine IBAN im gültigen Format ist (Basis-Check)
 *
 * @param {string} iban - IBAN zum Prüfen
 * @returns {boolean} true wenn IBAN-Format gültig ist
 *
 * @example
 * isValidIBAN('DE89370400440532013000')  // → true
 * isValidIBAN('XX123456789')             // → false
 * isValidIBAN('')                        // → false
 */
export function isValidIBAN(iban) {
  if (!iban || typeof iban !== 'string') return false;
  // Basic IBAN format: 2 letters, 2 digits, then alphanumeric
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
  return ibanRegex.test(iban.toUpperCase());
}

/**
 * Prüft, ob ein BIC im gültigen Format ist
 *
 * @param {string} bic - BIC zum Prüfen
 * @returns {boolean} true wenn BIC-Format gültig ist
 *
 * @example
 * isValidBIC('COBADEBC')    // → true
 * isValidBIC('INVALID')     // → false
 */
export function isValidBIC(bic) {
  if (!bic || typeof bic !== 'string') return false;
  // BIC format: 4 letters, 2 letters, 2 alphanumeric, optional 3 alphanumeric
  const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return bicRegex.test(bic.toUpperCase());
}

/**
 * Prüft, ob eine E-Mail gültig ist
 *
 * @param {string} email - E-Mail zum Prüfen
 * @returns {boolean} true wenn E-Mail-Format gültig ist
 *
 * @example
 * isValidEmail('test@example.com')     // → true
 * isValidEmail('invalid.email')        // → false
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validiert eine komplette Rechnung vor dem Speichern
 *
 * @param {Object} rechnung - Objekt mit Rechnungsdaten
 * @param {string} rechnung.nr - Rechnungsnummer
 * @param {string} rechnung.kunde - Kundenname
 * @param {number} rechnung.gesamt - Gesamtbetrag
 * @param {string} rechnung.datum - Rechnungsdatum
 * @param {string} rechnung.faellig - Fälligkeitsdatum
 * @param {Array} rechnung.positionen - Array von Positionen
 * @returns {Array<string>} Array von Fehlermeldungen (leer wenn keine Fehler)
 *
 * @example
 * const errors = validateRechnung(rechnung);
 * if (errors.length > 0) {
 *   toast('Fehler:\n' + errors.join('\n'));
 * }
 */
export function validateRechnung(rechnung) {
  const errors = [];

  if (!rechnung.nr || rechnung.nr.trim() === '') {
    errors.push('Rechnungsnummer erforderlich');
  }

  if (!rechnung.kunde || rechnung.kunde === '(kein Kunde)') {
    errors.push('Kunde erforderlich');
  }

  if (!isValidBetrag(rechnung.gesamt)) {
    errors.push('Betrag muss größer als 0 sein');
  }

  if (!isValidDate(rechnung.datum)) {
    errors.push('Ungültiges Rechnungsdatum');
  }

  if (!isValidDate(rechnung.faellig)) {
    errors.push('Ungültiges Fälligkeitsdatum');
  }

  if (!Array.isArray(rechnung.positionen) || rechnung.positionen.length === 0) {
    errors.push('Mindestens eine Position erforderlich');
  }

  // Prüfe Positionen
  if (Array.isArray(rechnung.positionen)) {
    rechnung.positionen.forEach((pos, idx) => {
      if (!pos.beschr || pos.beschr.trim() === '') {
        errors.push(`Position ${idx + 1}: Beschreibung erforderlich`);
      }
      if (!isValidBetrag(pos.menge)) {
        errors.push(`Position ${idx + 1}: Menge muss > 0 sein`);
      }
      if (!isValidBetrag(pos.ep)) {
        errors.push(`Position ${idx + 1}: Preis muss > 0 sein`);
      }
    });
  }

  return errors;
}

/**
 * Validiert ein Angebot vor dem Speichern
 *
 * @param {Object} angebot - Objekt mit Angebotsdaten
 * @returns {Array<string>} Array von Fehlermeldungen
 *
 * @example
 * const errors = validateAngebot(angebot);
 */
export function validateAngebot(angebot) {
  const errors = [];

  if (!angebot.nr || angebot.nr.trim() === '') {
    errors.push('Angebotsnummer erforderlich');
  }

  if (!angebot.kunde || angebot.kunde === '(kein Kunde)') {
    errors.push('Kunde erforderlich');
  }

  if (!isValidBetrag(angebot.gesamt)) {
    errors.push('Betrag muss größer als 0 sein');
  }

  if (!isValidDate(angebot.datum)) {
    errors.push('Ungültiges Angebotsdatum');
  }

  if (!Array.isArray(angebot.positionen) || angebot.positionen.length === 0) {
    errors.push('Mindestens eine Position erforderlich');
  }

  return errors;
}

/**
 * Validiert Kundendetails vor dem Speichern
 *
 * @param {Object} kunde - Kundenobjekt
 * @param {string} kunde.name - Kundenname
 * @param {string} kunde.adresse - Kundenadresse
 * @returns {Array<string>} Array von Fehlermeldungen
 *
 * @example
 * const errors = validateKunde(kunde);
 */
export function validateKunde(kunde) {
  const errors = [];

  if (!kunde.name || kunde.name.trim() === '') {
    errors.push('Kundenname erforderlich');
  }

  if (kunde.name && kunde.name.length > 100) {
    errors.push('Kundenname zu lang (max. 100 Zeichen)');
  }

  if (kunde.email && !isValidEmail(kunde.email)) {
    errors.push('Ungültige E-Mail-Adresse');
  }

  return errors;
}

/**
 * Validiert Ausgabedaten vor dem Speichern
 *
 * @param {Object} ausgabe - Ausgabeobjekt
 * @param {string} ausgabe.datum - Ausgabedatum
 * @param {number} ausgabe.betrag - Ausgabebetrag
 * @param {string} ausgabe.kategorie - Kategorie
 * @returns {Array<string>} Array von Fehlermeldungen
 *
 * @example
 * const errors = validateAusgabe(ausgabe);
 */
export function validateAusgabe(ausgabe) {
  const errors = [];

  if (!isValidDate(ausgabe.datum)) {
    errors.push('Ungültiges Datum');
  }

  if (!isValidBetrag(ausgabe.betrag)) {
    errors.push('Betrag muss größer als 0 sein');
  }

  if (!ausgabe.kategorie || ausgabe.kategorie.trim() === '') {
    errors.push('Kategorie erforderlich');
  }

  return errors;
}

/**
 * Validiert Banking-Informationen vor dem Speichern
 *
 * @param {Object} bankInfo - Banking-Informationen
 * @param {string} bankInfo.iban - IBAN
 * @param {string} bankInfo.bic - BIC
 * @param {string} bankInfo.kontoinhaber - Kontoinhaber
 * @returns {Array<string>} Array von Fehlermeldungen
 *
 * @example
 * const errors = validateBankInfo(bankInfo);
 */
export function validateBankInfo(bankInfo) {
  const errors = [];

  if (bankInfo.iban && !isValidIBAN(bankInfo.iban)) {
    errors.push('Ungültige IBAN-Format');
  }

  if (bankInfo.bic && !isValidBIC(bankInfo.bic)) {
    errors.push('Ungültiges BIC-Format');
  }

  if (bankInfo.kontoinhaber && bankInfo.kontoinhaber.length > 70) {
    errors.push('Kontoinhaber zu lang (max. 70 Zeichen)');
  }

  return errors;
}
