# 📋 TODO: KATEGORIEN DYNAMISCH LADEN

## STATUS: ⏳ IN PROGRESS

### Aufgabe 1: Dynamisches HTML-Laden (30 min)
**Datei:** `src/app-refactored.js`

```javascript
// Am Ende der initializeApp() Funktion hinzufügen:

import { getKategorienHtml } from './modules/kategorien.js';

function initializeCategorySelects() {
  const selectIds = [
    'a-kat',      // Ausgaben Form
    'ocr-kat',    // OCR Erkannte Kategorien
  ];
  
  const html = getKategorienHtml();
  
  selectIds.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = html;
    }
  });
}

// Aufrufen in DOMContentLoaded:
window.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...
  initializeCategorySelects();
});
```

---

### Aufgabe 2: Mit Icons anzeigen (15 min)
**Datei:** `src/modules/kategorien.js`

```javascript
// Funktion hinzufügen:
export function getKategorienHtmlWithIcons() {
  return AUSGABEN_KATEGORIEN
    .map((k) => `<option title="${k.beschreibung}">${k.icon} ${k.name}</option>`)
    .join('');
}
```

**HTML nutzten:**
```javascript
// Statt getKategorienHtml() verwenden:
select.innerHTML = getKategorienHtmlWithIcons();
```

---

### Aufgabe 3: Kategorien speichern (20 min)
**Datei:** `src/modules/settings.js`

```javascript
// In speichernSettings() hinzufügen:
const customCategories = document.getElementById('s-custom-categories')?.value;
if (customCategories) {
  state.settings.customKategorien = customCategories.split('\n').filter(c => c.trim());
}

// In ladeSettings() hinzufügen:
if (state.settings.customKategorien) {
  document.getElementById('s-custom-categories').value = state.settings.customKategorien.join('\n');
}
```

---

### Aufgabe 4: HTML für Custom Categories (20 min)
**Datei:** `src/index.html` - Settings Section

```html
<!-- Nach Mahnungen-Section hinzufügen: -->
<h3 style="margin-top:24px">Ausgaben-Kategorien</h3>
<p style="font-size:12px;color:var(--hint);margin-bottom:12px">Benutzerdefinierte Kategorien (eine pro Zeile)</p>

<textarea id="s-custom-categories" rows="6" placeholder="Büromaterial&#10;Software/IT&#10;Fahrtkosten&#10;Telefon/Internet&#10;Weiterbildung&#10;Werbung&#10;Sonstiges"></textarea>

<div style="font-size:11px;color:var(--hint);margin-top:4px">
  💡 Tipp: Kategorien werden in Ausgaben- und OCR-Formularen verwendet
</div>
```

---

### Aufgabe 5: Tests für Kategorien (15 min)
**Datei:** `src/modules/__tests__/kategorien.test.js`

```javascript
import { 
  AUSGABEN_KATEGORIEN, 
  getKategorienNames,
  getKategorieByName,
  getKategorieById 
} from '../kategorien.js';

describe('Kategorien', () => {
  test('sollte 7 Standardkategorien haben', () => {
    expect(AUSGABEN_KATEGORIEN.length).toBe(7);
  });

  test('getKategorienNames sollte nur Namen zurückgeben', () => {
    const names = getKategorienNames();
    expect(names).toContain('Büromaterial');
    expect(names).toContain('Software/IT');
  });

  test('getKategorieByName sollte Kategorie finden', () => {
    const kat = getKategorieByName('Fahrtkosten');
    expect(kat.id).toBe('fahrt');
    expect(kat.icon).toBe('🚗');
  });

  test('getKategorieById sollte Kategorie finden', () => {
    const kat = getKategorieById('software');
    expect(kat.name).toBe('Software/IT');
  });

  test('alle Kategorien sollten erforderliche Felder haben', () => {
    AUSGABEN_KATEGORIEN.forEach(k => {
      expect(k.id).toBeDefined();
      expect(k.name).toBeDefined();
      expect(k.icon).toBeDefined();
      expect(k.beschreibung).toBeDefined();
    });
  });
});
```

---

## ✅ ABGESCHLOSSEN

- ✅ `kategorien.js` erstellt
- ✅ HTML-Bug gefixt ("Großmaschinen" entfernt)
- ✅ Dokumentation geschrieben

## ⏳ TODO

- ⏳ Aufgabe 1-5 implementieren (100 min total)
- ⏳ Tests laufen lassen
- ⏳ Settings UI erweitern
- ⏳ Custom Categories speichern/laden

---

## 📌 WICHTIG

**Diese Komponente ist das Fundament für:**
- ✅ Ausgaben-Verwaltung
- ✅ OCR-Kategorisierung
- ✅ EÜR-Auswertung
- ✅ Mobile-App Kategorien

**Daher sollten alle 5 Aufgaben diese Woche erledigt werden!**
