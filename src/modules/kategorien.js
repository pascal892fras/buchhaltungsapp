/**
 * Ausgaben-Kategorien Konfiguration
 * Zentrale Verwaltung aller Belegkategorien
 */

export const AUSGABEN_KATEGORIEN = [
  {
    id: 'buero',
    name: 'Büromaterial',
    beschreibung: 'Papier, Stifte, Drucker, Toner, etc.',
  },
  {
    id: 'software',
    name: 'Software/IT',
    beschreibung: 'Lizenzen, SaaS, Adobe, Microsoft, etc.',
  },
  {
    id: 'fahrt',
    name: 'Fahrtkosten',
    beschreibung: 'Benzin, Parkgebühren, Maut, etc.',
  },
  {
    id: 'telefon',
    name: 'Telefon/Internet',
    beschreibung: 'Telekom, Vodafone, O2, DSL-Provider, etc.',
  },
  {
    id: 'bildung',
    name: 'Weiterbildung',
    beschreibung: 'Kurse, Trainings, Seminare, Udemy, etc.',
  },
  {
    id: 'werbung',
    name: 'Werbung',
    beschreibung: 'Anzeigen, Marketing, Print, Facebook Ads, etc.',
  },
  {
    id: 'maschinen',
    name: 'Maschinen',
    beschreibung: 'Maschinen, Anlagen, Werkzeuge, Ausrüstung, etc.',
  },
  {
    id: 'bewirtung',
    name: 'Bewirtungsbelege',
    beschreibung: 'Essen, Getränke, Restaurant, Catering, etc.',
  },
  {
    id: 'waren',
    name: 'Waren',
    beschreibung: 'Wareneinkauf, Materialien, Rohstoffe, etc.',
  },
  {
    id: 'dienstleistungen',
    name: 'Dienstleistungen',
    beschreibung: 'Freelancer, Handwerker, Dienstleistungsgebühren, etc.',
  },
  {
    id: 'sonstiges',
    name: 'Sonstiges',
    beschreibung: 'Andere Ausgaben',
  },
  {
    id: 'custom',
    name: 'Benutzerdefiniert',
    beschreibung: 'Frei beschreibbare Kategorie',
    isCustom: true,
  },
];


/**
 * Gibt Array mit nur Namen zurück
 */
export function getKategorienNames() {
  return AUSGABEN_KATEGORIEN.map((k) => k.name);
}

/**
 * Sucht Kategorie nach Name
 */
export function getKategorieByName(name) {
  return AUSGABEN_KATEGORIEN.find((k) => k.name === name);
}

/**
 * Sucht Kategorie nach ID
 */
export function getKategorieById(id) {
  return AUSGABEN_KATEGORIEN.find((k) => k.id === id);
}

/**
 * Gibt HTML für Select-Optionen zurück (ohne Icons)
 */
export function getKategorienHtml() {
  return AUSGABEN_KATEGORIEN.map((k) => `<option value="${k.id}">${k.name}</option>`).join(
    ''
  );
}

/**
 * Exportiert Kategorien für CSV/JSON
 */
export function exportKategorien() {
  return {
    version: '1.0',
    exported: new Date().toISOString(),
    kategorien: AUSGABEN_KATEGORIEN,
  };
}
