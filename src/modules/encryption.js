/**
 * Datenverschlüsselung für sensible Daten
 * Lokal auf dem Gerät verschlüsselte Speicherung
 */

/**
 * Einfache XOR-basierte Verschlüsselung (für sensible IBAN/Steuernr)
 * HINWEIS: Für echte Sicherheit würde man crypto.js oder libsodium verwenden
 */

const SECRET_KEY = 'BUCHHALTUNG_APP_2024_SECURE'; // In Production aus Umgebung

/**
 * Verschlüsselt einen String
 */
export function encrypt(plaintext) {
  if (!plaintext) return '';

  try {
    // Basis64-Kodierung + einfache XOR-Verschlüsselung
    const utf8 = btoa(String(plaintext)); // Base64 encode
    let encrypted = '';

    for (let i = 0; i < utf8.length; i++) {
      const charCode = utf8.charCodeAt(i);
      const keyCharCode = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      encrypted += String.fromCharCode(charCode ^ keyCharCode);
    }

    return btoa(encrypted); // Nochmal Base64 für Transport
  } catch (error) {
    console.error('Verschlüsselungsfehler:', error);
    return plaintext; // Fallback: unverschlüsselt speichern
  }
}

/**
 * Entschlüsselt einen String
 */
export function decrypt(encrypted) {
  if (!encrypted) return '';

  try {
    const decoded = atob(encrypted); // Base64 decode
    let decrypted = '';

    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyCharCode = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      decrypted += String.fromCharCode(charCode ^ keyCharCode);
    }

    return atob(decrypted); // Rückgängig machen der ersten Base64
  } catch (error) {
    console.error('Entschlüsselungsfehler:', error);
    return encrypted; // Fallback
  }
}

/**
 * Verschlüsselt Bankverbindung
 */
export function encryptBankData(bankData) {
  return {
    ...bankData,
    iban: bankData.iban ? encrypt(bankData.iban) : '',
    bic: bankData.bic ? encrypt(bankData.bic) : '',
    kontoinhaber: bankData.kontoinhaber ? encrypt(bankData.kontoinhaber) : '',
  };
}

/**
 * Entschlüsselt Bankverbindung
 */
export function decryptBankData(encryptedData) {
  return {
    ...encryptedData,
    iban: encryptedData.iban ? decrypt(encryptedData.iban) : '',
    bic: encryptedData.bic ? decrypt(encryptedData.bic) : '',
    kontoinhaber: encryptedData.kontoinhaber ? decrypt(encryptedData.kontoinhaber) : '',
  };
}

/**
 * Verschlüsselt Einstellungen (nur sensible Felder)
 */
export function encryptSettings(settings) {
  return {
    ...settings,
    steuernr: settings.steuernr ? encrypt(settings.steuernr) : '',
    iban: settings.iban ? encrypt(settings.iban) : '',
    bic: settings.bic ? encrypt(settings.bic) : '',
  };
}

/**
 * Entschlüsselt Einstellungen
 */
export function decryptSettings(encryptedSettings) {
  return {
    ...encryptedSettings,
    steuernr: encryptedSettings.steuernr ? decrypt(encryptedSettings.steuernr) : '',
    iban: encryptedSettings.iban ? decrypt(encryptedSettings.iban) : '',
    bic: encryptedSettings.bic ? decrypt(encryptedSettings.bic) : '',
  };
}

/**
 * Maskiert IBAN für Anzeige (z.B. DE89 **** **** **** **** 3000)
 */
export function maskIBAN(iban) {
  if (!iban || iban.length < 8) return '****';
  const visible = iban.slice(-4);
  const hidden = '*'.repeat(iban.length - 4);
  return `${hidden}${visible}`;
}

/**
 * Maskiert Steuernummer (z.B. 123****456)
 */
export function maskSteuernr(steuernr) {
  if (!steuernr || steuernr.length < 4) return '****';
  const start = steuernr.slice(0, 3);
  const end = steuernr.slice(-3);
  const hidden = '*'.repeat(Math.max(0, steuernr.length - 6));
  return `${start}${hidden}${end}`;
}
