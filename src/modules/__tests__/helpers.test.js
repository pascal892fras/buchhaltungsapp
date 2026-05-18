/**
 * Unit Tests für helpers.js
 * Testet alle kritischen Utility-Funktionen
 *
 * Ausführen mit: npm test
 */

import {
  fmt,
  today,
  addDays,
  nextDate,
  formatDatum,
  fmtEUR,
  isValidDate,
  isValidBetrag,
} from '../helpers.js';

describe('helpers.js - Utility Functions', () => {
  /**
   * ─── fmt() Tests ─────────────────────────────────
   * Testet EUR-Formatierung mit €-Symbol
   */
  describe('fmt()', () => {
    it('should format number as EUR with € symbol', () => {
      expect(fmt(1000)).toBe('1.000,00 €');
      expect(fmt(99.99)).toBe('99,99 €');
      expect(fmt(0)).toBe('0,00 €');
    });

    it('should handle decimal numbers', () => {
      expect(fmt(1234.567)).toBe('1.234,57 €');
      expect(fmt(100.5)).toBe('100,50 €');
    });

    it('should handle negative numbers', () => {
      expect(fmt(-50)).toBe('-50,00 €');
      expect(fmt(-1000.99)).toBe('-1.000,99 €');
    });

    it('should handle null and undefined', () => {
      expect(fmt(null)).toBe('0,00 €');
      expect(fmt(undefined)).toBe('0,00 €');
    });

    it('should coerce string numbers', () => {
      expect(fmt('100')).toBe('100,00 €');
      expect(fmt('99.99')).toBe('99,99 €');
    });

    it('should handle very large numbers', () => {
      expect(fmt(999999.99)).toBe('999.999,99 €');
    });
  });

  /**
   * ─── today() Tests ─────────────────────────────
   * Testet heutiges Datum im YYYY-MM-DD Format
   */
  describe('today()', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const result = today();
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      expect(result).toMatch(regex);
    });

    it('should return a valid date', () => {
      const result = today();
      const date = new Date(result);
      expect(!isNaN(date.getTime())).toBe(true);
    });

    it('should be the current date', () => {
      const result = today();
      const now = new Date();
      const expected =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(now.getDate()).padStart(2, '0');

      expect(result).toBe(expected);
    });
  });

  /**
   * ─── addDays() Tests ──────────────────────────
   * Testet das Addieren von Tagen zu einem Datum
   */
  describe('addDays()', () => {
    it('should add days to a date', () => {
      expect(addDays('2024-01-15', 5)).toBe('2024-01-20');
      expect(addDays('2024-01-15', 10)).toBe('2024-01-25');
    });

    it('should handle month boundaries', () => {
      expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // Leap year
    });

    it('should handle year boundaries', () => {
      expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
    });

    it('should support negative days (subtraction)', () => {
      expect(addDays('2024-01-15', -5)).toBe('2024-01-10');
      expect(addDays('2024-02-01', -1)).toBe('2024-01-31');
    });

    it('should handle zero days', () => {
      expect(addDays('2024-01-15', 0)).toBe('2024-01-15');
    });

    it('should handle large numbers of days', () => {
      expect(addDays('2024-01-01', 365)).toBe('2025-01-01');
    });
  });

  /**
   * ─── nextDate() Tests ─────────────────────────
   * Testet Berechnung des nächsten Datums basierend auf Intervallen
   */
  describe('nextDate()', () => {
    it('should add one month for monatlich', () => {
      expect(nextDate('2024-01-15', 'monatlich')).toBe('2024-02-15');
      expect(nextDate('2024-12-15', 'monatlich')).toBe('2025-01-15');
    });

    it('should add three months for quartalsweise', () => {
      expect(nextDate('2024-01-15', 'quartalsweise')).toBe('2024-04-15');
      expect(nextDate('2024-12-15', 'quartalsweise')).toBe('2025-03-15');
    });

    it('should add six months for halbjaehrlich', () => {
      expect(nextDate('2024-01-15', 'halbjaehrlich')).toBe('2024-07-15');
      expect(nextDate('2024-07-15', 'halbjaehrlich')).toBe('2025-01-15');
    });

    it('should add one year for jaehrlich', () => {
      expect(nextDate('2024-01-15', 'jaehrlich')).toBe('2025-01-15');
      expect(nextDate('2024-02-29', 'jaehrlich')).toBe('2025-02-28'); // Leap year
    });

    it('should handle end-of-month dates', () => {
      const jan31Next = nextDate('2024-01-31', 'monatlich');
      const date = new Date(jan31Next);
      expect(date.getMonth()).toBe(1); // February
    });
  });

  /**
   * ─── formatDatum() Tests ──────────────────────
   * Testet Formatierung von YYYY-MM-DD zu DD.MM.YYYY
   */
  describe('formatDatum()', () => {
    it('should convert YYYY-MM-DD to DD.MM.YYYY', () => {
      expect(formatDatum('2024-01-15')).toBe('15.01.2024');
      expect(formatDatum('2024-12-31')).toBe('31.12.2024');
    });

    it('should handle single digit months and days', () => {
      expect(formatDatum('2024-01-05')).toBe('05.01.2024');
      expect(formatDatum('2024-05-01')).toBe('01.05.2024');
    });

    it('should return — for null or empty', () => {
      expect(formatDatum(null)).toBe('—');
      expect(formatDatum(undefined)).toBe('—');
      expect(formatDatum('')).toBe('—');
    });

    it('should handle invalid format gracefully', () => {
      expect(formatDatum('invalid')).toBe('invalid');
      expect(formatDatum('15.01.2024')).toBe('15.01.2024'); // Already formatted
    });
  });

  /**
   * ─── fmtEUR() Tests ──────────────────────────
   * Testet EUR-Formatierung ohne €-Symbol
   */
  describe('fmtEUR()', () => {
    it('should format number as EUR without € symbol', () => {
      expect(fmtEUR(1000)).toBe('1.000,00 EUR');
      expect(fmtEUR(99.99)).toBe('99,99 EUR');
    });

    it('should use German locale formatting', () => {
      expect(fmtEUR(1234.567)).toBe('1.234,57 EUR');
    });

    it('should handle null and undefined', () => {
      expect(fmtEUR(null)).toBe('0,00 EUR');
      expect(fmtEUR(undefined)).toBe('0,00 EUR');
    });
  });

  /**
   * ─── Date Validation Helper Tests ─────────────
   */
  describe('isValidDate()', () => {
    it('should validate correct dates', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(isValidDate('2024-13-01')).toBe(false); // Invalid month
      expect(isValidDate('2024-02-30')).toBe(false); // Invalid day
    });

    it('should reject invalid formats', () => {
      expect(isValidDate('15.01.2024')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  /**
   * ─── Amount Validation Helper Tests ──────────
   */
  describe('isValidBetrag()', () => {
    it('should accept positive numbers', () => {
      expect(isValidBetrag(100)).toBe(true);
      expect(isValidBetrag(0.01)).toBe(true);
      expect(isValidBetrag('50.00')).toBe(true);
    });

    it('should reject zero and negative', () => {
      expect(isValidBetrag(0)).toBe(false);
      expect(isValidBetrag(-10)).toBe(false);
      expect(isValidBetrag('-50.00')).toBe(false);
    });

    it('should reject invalid values', () => {
      expect(isValidBetrag('abc')).toBe(false);
      expect(isValidBetrag(null)).toBe(false);
      expect(isValidBetrag(undefined)).toBe(false);
    });
  });
});
