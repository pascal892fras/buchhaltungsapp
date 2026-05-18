/**
 * Unit Tests für validation.js
 * Testet alle Validierungsfunktionen
 *
 * Ausführen mit: npm test
 */

import {
  isValidIBAN,
  isValidBIC,
  isValidEmail,
  validateRechnung,
  validateAngebot,
  validateKunde,
  validateAusgabe,
  validateBankInfo,
} from '../validation.js';

describe('validation.js - Input Validation', () => {
  /**
   * ─── IBAN Validation Tests ───────────────────
   */
  describe('isValidIBAN()', () => {
    it('should validate correct IBANs', () => {
      expect(isValidIBAN('DE89370400440532013000')).toBe(true);
      expect(isValidIBAN('FR1420041010050500013M02606')).toBe(true);
      expect(isValidIBAN('GB82WEST12345698765432')).toBe(true);
    });

    it('should reject invalid IBANs', () => {
      expect(isValidIBAN('XX123456789')).toBe(false);
      expect(isValidIBAN('DE8937040044053')).toBe(false); // Too short
      expect(isValidIBAN('123456789')).toBe(false);
    });

    it('should reject null, undefined, empty', () => {
      expect(isValidIBAN(null)).toBe(false);
      expect(isValidIBAN(undefined)).toBe(false);
      expect(isValidIBAN('')).toBe(false);
    });

    it('should handle lowercase', () => {
      expect(isValidIBAN('de89370400440532013000')).toBe(true);
    });
  });

  /**
   * ─── BIC Validation Tests ────────────────────
   */
  describe('isValidBIC()', () => {
    it('should validate correct BICs', () => {
      expect(isValidBIC('COBADEBC')).toBe(true);
      expect(isValidBIC('DEUTDEDE')).toBe(true);
      expect(isValidBIC('SOLADEST')).toBe(true);
    });

    it('should reject invalid BICs', () => {
      expect(isValidBIC('INVALID')).toBe(false);
      expect(isValidBIC('CO123')).toBe(false);
    });

    it('should reject null or empty', () => {
      expect(isValidBIC(null)).toBe(false);
      expect(isValidBIC('')).toBe(false);
    });
  });

  /**
   * ─── Email Validation Tests ──────────────────
   */
  describe('isValidEmail()', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@company.co.uk')).toBe(true);
      expect(isValidEmail('info@test-domain.de')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should reject null or empty', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  /**
   * ─── Rechnung Validation Tests ──────────────
   */
  describe('validateRechnung()', () => {
    const validRechnung = {
      nr: 'RE-2024-001',
      kunde: 'Max Mustermann',
      gesamt: 100.5,
      datum: '2024-01-15',
      faellig: '2024-02-15',
      positionen: [{ beschr: 'Service', menge: 1, ep: 100 }],
    };

    it('should validate correct invoice', () => {
      const errors = validateRechnung(validRechnung);
      expect(errors.length).toBe(0);
    });

    it('should reject missing invoice number', () => {
      const r = { ...validRechnung, nr: '' };
      const errors = validateRechnung(r);
      expect(errors).toContain('Rechnungsnummer erforderlich');
    });

    it('should reject missing customer', () => {
      const r = { ...validRechnung, kunde: '(kein Kunde)' };
      const errors = validateRechnung(r);
      expect(errors).toContain('Kunde erforderlich');
    });

    it('should reject invalid amount', () => {
      const r = { ...validRechnung, gesamt: 0 };
      const errors = validateRechnung(r);
      expect(errors).toContain('Betrag muss größer als 0 sein');
    });

    it('should reject invalid dates', () => {
      const r = { ...validRechnung, datum: '2024-13-01' };
      const errors = validateRechnung(r);
      expect(errors).toContain('Ungültiges Rechnungsdatum');
    });

    it('should reject missing positions', () => {
      const r = { ...validRechnung, positionen: [] };
      const errors = validateRechnung(r);
      expect(errors).toContain('Mindestens eine Position erforderlich');
    });

    it('should validate position data', () => {
      const r = {
        ...validRechnung,
        positionen: [
          { beschr: '', menge: 1, ep: 100 }, // Missing description
          { beschr: 'Service', menge: 0, ep: 100 }, // Invalid quantity
          { beschr: 'Service', menge: 1, ep: -10 }, // Negative price
        ],
      };
      const errors = validateRechnung(r);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Beschreibung erforderlich'))).toBe(true);
    });
  });

  /**
   * ─── Angebot Validation Tests ──────────────
   */
  describe('validateAngebot()', () => {
    const validAngebot = {
      nr: 'ANG-2024-001',
      kunde: 'Max Mustermann',
      gesamt: 100.5,
      datum: '2024-01-15',
      positionen: [{ beschr: 'Service', menge: 1, ep: 100 }],
    };

    it('should validate correct offer', () => {
      const errors = validateAngebot(validAngebot);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid offer', () => {
      const r = { ...validAngebot, gesamt: -50 };
      const errors = validateAngebot(r);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * ─── Kunde Validation Tests ────────────────
   */
  describe('validateKunde()', () => {
    it('should validate correct customer', () => {
      const errors = validateKunde({ name: 'Max Mustermann' });
      expect(errors.length).toBe(0);
    });

    it('should reject missing name', () => {
      const errors = validateKunde({ name: '' });
      expect(errors).toContain('Kundenname erforderlich');
    });

    it('should reject invalid email', () => {
      const errors = validateKunde({ name: 'Test', email: 'invalid-email' });
      expect(errors).toContain('Ungültige E-Mail-Adresse');
    });

    it('should allow valid email', () => {
      const errors = validateKunde({ name: 'Test', email: 'test@example.com' });
      const emailErrors = errors.filter((e) => e.includes('E-Mail'));
      expect(emailErrors.length).toBe(0);
    });
  });

  /**
   * ─── Ausgabe Validation Tests ──────────────
   */
  describe('validateAusgabe()', () => {
    it('should validate correct expense', () => {
      const errors = validateAusgabe({
        datum: '2024-01-15',
        betrag: 50.5,
        kategorie: 'Materialien',
      });
      expect(errors.length).toBe(0);
    });

    it('should reject invalid expense', () => {
      const errors = validateAusgabe({
        datum: 'invalid',
        betrag: 0,
        kategorie: '',
      });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * ─── Banking Info Validation Tests ────────
   */
  describe('validateBankInfo()', () => {
    it('should validate correct banking info', () => {
      const errors = validateBankInfo({
        iban: 'DE89370400440532013000',
        bic: 'COBADEBC',
        kontoinhaber: 'Max Mustermann',
      });
      expect(errors.length).toBe(0);
    });

    it('should reject invalid IBAN', () => {
      const errors = validateBankInfo({
        iban: 'INVALID',
        bic: 'COBADEBC',
      });
      expect(errors).toContain('Ungültige IBAN-Format');
    });

    it('should reject invalid BIC', () => {
      const errors = validateBankInfo({
        iban: 'DE89370400440532013000',
        bic: 'INVALID',
      });
      expect(errors).toContain('Ungültiges BIC-Format');
    });

    it('should allow empty optional fields', () => {
      const errors = validateBankInfo({
        iban: '',
        bic: '',
        kontoinhaber: '',
      });
      expect(errors.length).toBe(0);
    });
  });
});
