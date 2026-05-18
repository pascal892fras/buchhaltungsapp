/**
 * Tests für Buchhaltungsapp
 * Jest Tests für kritische Funktionen
 */

import { validators, validate, validateOrThrow } from '../modules/validation.js';
import { AppError, ErrorTypes } from '../modules/error-handling.js';
import { encrypt, decrypt, maskIBAN } from '../modules/encryption.js';

// ═══════════════════════════════════════════════════════════════════
// VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Validation - Betrag', () => {
  test('sollte gültige Beträge akzeptieren', () => {
    const errors = validators.betrag(100.50, 'Betrag');
    expect(errors.length).toBe(0);
  });

  test('sollte negative Beträge ablehnen', () => {
    const errors = validators.betrag(-50, 'Betrag');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('größer als 0');
  });

  test('sollte Null/undefined ablehnen', () => {
    const errors = validators.betrag(null, 'Betrag');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('erforderlich');
  });

  test('sollte zu große Beträge ablehnen', () => {
    const errors = validators.betrag(2000000, 'Betrag');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('1.000.000');
  });

  test('sollte nicht-numerische Eingaben ablehnen', () => {
    const errors = validators.betrag('abc', 'Betrag');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Zahl');
  });
});

describe('Validation - Datum', () => {
  test('sollte gültige Daten akzeptieren', () => {
    const today = new Date().toISOString().split('T')[0];
    const errors = validators.datum(today, 'Datum');
    expect(errors.length).toBe(0);
  });

  test('sollte zukünftige Daten ablehnen (wenn nicht erlaubt)', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const errors = validators.datum(dateStr, 'Datum', false);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Zukunft');
  });

  test('sollte zukünftige Daten akzeptieren (wenn erlaubt)', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const errors = validators.datum(dateStr, 'Datum', true);
    expect(errors.length).toBe(0);
  });

  test('sollte zu alte Daten ablehnen', () => {
    const tooOld = '2010-01-01';
    const errors = validators.datum(tooOld, 'Datum', false);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('10 Jahre');
  });

  test('sollte ungültige Datumsformate ablehnen', () => {
    const errors = validators.datum('31.12.2023', 'Datum');
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('Validation - String', () => {
  test('sollte gültige Strings akzeptieren', () => {
    const errors = validators.string('Mustername', 'Name');
    expect(errors.length).toBe(0);
  });

  test('sollte zu kurze Strings ablehnen', () => {
    const errors = validators.string('A', 'Name', 2, 500);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('mindestens');
  });

  test('sollte zu lange Strings ablehnen', () => {
    const longString = 'a'.repeat(600);
    const errors = validators.string(longString, 'Name', 2, 500);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('nicht länger');
  });

  test('sollte leere Strings ablehnen', () => {
    const errors = validators.string('', 'Name');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('erforderlich');
  });
});

describe('Validation - Email', () => {
  test('sollte gültige E-Mails akzeptieren', () => {
    const errors = validators.email('test@example.com', 'Email');
    expect(errors.length).toBe(0);
  });

  test('sollte ungültige E-Mails ablehnen', () => {
    const errors = validators.email('invalid@', 'Email');
    expect(errors.length).toBeGreaterThan(0);
  });

  test('sollte leere E-Mails ignorieren', () => {
    const errors = validators.email('', 'Email');
    expect(errors.length).toBe(0); // Optional
  });
});

describe('Validation - IBAN', () => {
  test('sollte gültige IBANs akzeptieren', () => {
    const errors = validators.iban('DE89370400440532013000', 'IBAN');
    expect(errors.length).toBe(0);
  });

  test('sollte ungültige IBANs ablehnen', () => {
    const errors = validators.iban('XX123456789', 'IBAN');
    expect(errors.length).toBeGreaterThan(0);
  });

  test('sollte leere IBANs ignorieren', () => {
    const errors = validators.iban('', 'IBAN');
    expect(errors.length).toBe(0); // Optional
  });
});

describe('Validation - Rechnung', () => {
  test('sollte gültige Rechnungsdaten akzeptieren', () => {
    const rechnung = {
      nummer: 'RE-001',
      datum: '2024-01-15',
      faellig: '2024-02-15',
      betrag: 1000,
      kunde: 'Musterkunde',
      positionen: [{ menge: 1, preis: 1000 }],
    };
    const errors = validators.rechnung(rechnung);
    expect(errors.length).toBe(0);
  });

  test('sollte Rechnungen ohne Positionen ablehnen', () => {
    const rechnung = {
      nummer: 'RE-001',
      datum: '2024-01-15',
      faellig: '2024-02-15',
      betrag: 1000,
      kunde: 'Musterkunde',
      positionen: [],
    };
    const errors = validators.rechnung(rechnung);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Position');
  });
});

// ═══════════════════════════════════════════════════════════════════
// ENCRYPTION TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Encryption', () => {
  test('sollte Strings verschlüsseln und entschlüsseln', () => {
    const original = 'DE89370400440532013000';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(encrypted).not.toBe(original); // Sollte anders aussehen
    expect(decrypted).toBe(original); // Sollte wieder original sein
  });

  test('sollte leere Strings handhaben', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  test('maskIBAN sollte IBAN korrekt maskieren', () => {
    const iban = 'DE89370400440532013000';
    const masked = maskIBAN(iban);
    expect(masked).toContain('****');
    expect(masked).toEndWith('3000');
    expect(masked).not.toContain('0044');
  });

  test('maskIBAN sollte kurze IBANs handhaben', () => {
    const iban = 'DE89';
    const masked = maskIBAN(iban);
    expect(masked).toContain('****');
  });
});

// ═══════════════════════════════════════════════════════════════════
// ERROR HANDLING TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Error Handling', () => {
  test('sollte AppError erstellen können', () => {
    const error = new AppError(
      ErrorTypes.VALIDATION_ERROR,
      'Test-Fehler',
      { field: 'test' }
    );
    expect(error.type).toBe(ErrorTypes.VALIDATION_ERROR);
    expect(error.message).toBe('Test-Fehler');
    expect(error.details.field).toBe('test');
  });

  test('AppError sollte zu JSON konvertierbar sein', () => {
    const error = new AppError(ErrorTypes.DATA_ERROR, 'Datenfehler');
    const json = error.toJSON();
    expect(json.type).toBe(ErrorTypes.DATA_ERROR);
    expect(json.message).toBe('Datenfehler');
    expect(json.timestamp).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Integration - Rechnungsworkflow', () => {
  test('kompletter Rechnungserstellungsprozess sollte funktionieren', () => {
    const rechnung = {
      nummer: 'RE-001',
      datum: '2024-01-15',
      faellig: '2024-02-15',
      betrag: 1500.99,
      kunde: 'Max Mustermann',
      positionen: [
        { beschreibung: 'Beratung', menge: 5, preis: 300 },
        { beschreibung: 'Umsetzung', menge: 1, preis: 0.99 },
      ],
    };

    // Validiere
    const errors = validators.rechnung(rechnung);
    expect(errors.length).toBe(0);

    // Betrag sollte korrekt sein
    const totalBetrag = rechnung.positionen.reduce(
      (sum, pos) => sum + pos.menge * pos.preis,
      0
    );
    expect(totalBetrag).toBe(1500.99);
  });

  test('sollte ungültige Rechnungen mit korrekten Fehlern ablehnen', () => {
    const rechnung = {
      nummer: 'R', // Zu kurz
      datum: '2024-13-45', // Ungültig
      faellig: '2023-01-01', // Zu alt
      betrag: -100, // Negativ
      kunde: '', // Leer
      positionen: [], // Leer
    };

    const errors = validators.rechnung(rechnung);
    expect(errors.length).toBeGreaterThan(0);
  });
});
