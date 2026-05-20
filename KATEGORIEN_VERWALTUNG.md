# 📁 KATEGORIEN VERWALTUNG

## ✅ IMPLEMENTIERT - Kategorien dynamisch geladen!

### 📍 Zentrale Verwaltung
**`src/modules/kategorien.js`** ← **HAUPTQUELLE** ✓

```javascript
export const AUSGABEN_KATEGORIEN = [
  { id: 'buero', name: 'Büromaterial', beschreibung: 'Papier, Stifte, Drucker, Toner, etc.' },
  { id: 'software', name: 'Software/IT', beschreibung: 'Lizenzen, SaaS, Adobe, Microsoft, etc.' },
  { id: 'fahrt', name: 'Fahrtkosten', beschreibung: 'Benzin, Parkgebühren, Maut, etc.' },
  { id: 'telefon', name: 'Telefon/Internet', beschreibung: 'Telekom, Vodafone, O2, DSL-Provider, etc.' },
  { id: 'bildung', name: 'Weiterbildung', beschreibung: 'Kurse, Trainings, Seminare, Udemy, etc.' },
  { id: 'werbung', name: 'Werbung', beschreibung: 'Anzeigen, Marketing, Print, Facebook Ads, etc.' },
  { id: 'maschinen', name: 'Maschinen', beschreibung: 'Maschinen, Anlagen, Werkzeuge, Ausrüstung, etc.' },
  { id: 'bewirtung', name: 'Bewirtungsbelege', beschreibung: 'Essen, Getränke, Restaurant, Catering, etc.' },
  { id: 'waren', name: 'Waren', beschreibung: 'Wareneinkauf, Materialien, Rohstoffe, etc.' },
  { id: 'dienstleistungen', name: 'Dienstleistungen', beschreibung: 'Freelancer, Handwerker, Dienstleistungsgebühren, etc.' },
  { id: 'sonstiges', name: 'Sonstiges', beschreibung: 'Andere Ausgaben' },
  { id: 'custom', name: 'Benutzerdefiniert', beschreibung: 'Frei beschreibbare Kategorie', isCustom: true },
];
```

---

## 🎯 NEUE KATEGORIEN (12 insgesamt)

| ID | Name | Beschreibung |
|-----|------|------|
| buero | Büromaterial | Papier, Stifte, Drucker, Toner, etc. |
| software | Software/IT | Lizenzen, SaaS, Adobe, Microsoft, etc. |
| fahrt | Fahrtkosten | Benzin, Parkgebühren, Maut, etc. |
| telefon | Telefon/Internet | Telekom, Vodafone, O2, DSL-Provider, etc. |
| bildung | Weiterbildung | Kurse, Trainings, Seminare, Udemy, etc. |
| werbung | Werbung | Anzeigen, Marketing, Print, Facebook Ads, etc. |
| **maschinen** | **Maschinen** | **Maschinen, Anlagen, Werkzeuge, Ausrüstung, etc.** |
| **bewirtung** | **Bewirtungsbelege** | **Essen, Getränke, Restaurant, Catering, etc.** |
| **waren** | **Waren** | **Wareneinkauf, Materialien, Rohstoffe, etc.** |
| **dienstleistungen** | **Dienstleistungen** | **Freelancer, Handwerker, Dienstleistungsgebühren, etc.** |
| sonstiges | Sonstiges | Andere Ausgaben |
| **custom** | **Benutzerdefiniert** | **Frei beschreibbare Kategorie** |

---

## 🔧 IMPLEMENTIERUNG - ABGESCHLOSSEN ✅

### 1️⃣ Kategorien.js aktualisiert ✓
- ✅ Neue Kategorien hinzugefügt (Maschinen, Bewirtung, Waren, Dienstleistungen)
- ✅ Benutzerdefinierte Kategorie hinzugefügt
- ✅ Icons entfernt
- ✅ getKategorienHtml() optimiert (mit Value-Attribute)

### 2️⃣ app-refactored.js aktualisiert ✓
```javascript
// Neue Funktion hinzugefügt:
function initializeCategorySelects() {
  const kategorienHtml = getKategorienHtml();
  const selectIds = ['a-kat', 'ocr-kat'];
  selectIds.forEach((id) => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = kategorienHtml;
    }
  });
}

// Aufgerufen in DOMContentLoaded:
initializeCategorySelects();
```

### 3️⃣ index.html aktualisiert ✓
- ✅ Select `a-kat` geleert (wird dynamisch gefüllt)
- ✅ Select `ocr-kat` geleert (wird dynamisch gefüllt)
- ✅ Placeholder "Lädt..." beim Start

---

## 🚀 VERWENDUNG

### Import
```javascript
import { 
  AUSGABEN_KATEGORIEN, 
  getKategorienNames,
  getKategorieByName,
  getKategorieById,
  getKategorienHtml 
} from './modules/kategorien.js';
```

### In der App (AUTOMATISCH!)
```javascript
// Die Kategorien werden beim Start automatisch geladen
// initializeCategorySelects() wird in DOMContentLoaded aufgerufen
```

### Kategorie nachschlagen
```javascript
const kat = getKategorieByName('Maschinen');
console.log(kat.id);           // 'maschinen'
console.log(kat.beschreibung); // 'Maschinen, Anlagen, Werkzeuge...'

// Oder nach ID:
const kat2 = getKategorieById('bewirtung');
console.log(kat2.name); // 'Bewirtungsbelege'
```

---

## ✨ BESONDERHEITEN

### Benutzerdefinierte Kategorie
Die neue Kategorie "Benutzerdefiniert" hat ein spezielles Flag:
```javascript
{ 
  id: 'custom', 
  name: 'Benutzerdefiniert', 
  beschreibung: 'Frei beschreibbare Kategorie',
  isCustom: true  // ← Flag für spezielle Behandlung
}
```

**Verwendung:**
```javascript
// In der OCR-Erkennung oder Ausgaben-Handling:
if (selectedKat.isCustom) {
  // Zeige Textfeld zur manuellen Eingabe
  document.getElementById('custom-kat-input').style.display = 'block';
}
```

---

## 📊 STATUS

✅ **Implementierung: 100% FERTIG!**

| Aufgabe | Status |
|---------|--------|
| Kategorien.js aktualisiert | ✅ |
| Icons entfernt | ✅ |
| Neue Kategorien hinzugefügt | ✅ |
| Benutzerdefiniert-Kategorie | ✅ |
| Dynamisches HTML-Laden | ✅ |
| app-refactored.js aktualisiert | ✅ |
| index.html angepasst | ✅ |

---

## 🎯 NÄCHSTE SCHRITTE (Optional)

- [ ] Benutzerdefinierte Kategorie-Eingabe im UI
- [ ] Kategorien in Settings speichern/laden
- [ ] Kategorien-Filter in Berichten
- [ ] Tests für neue Kategorien schreiben


### **In der HTML (ALT)**
📍 `src/index.html` - Line 214 und 291

```html
<!-- AUSGABEN-FORM (Line 214) -->
<select id="a-kat">
  <option>Büromaterial</option>
  <option>Software/IT</option>
  <option>Fahrtkosten</option>
  <option>Telefon/Internet</option>
  <option>Weiterbildung</option>
  <option>Werbung</option>
  <option>Sonstiges</option>
</select>

<!-- OCR-ERGEBNIS FORM (Line 291) -->
<select id="ocr-kat">
  <option>Büromaterial</option>
  <option>Software/IT</option>
  <option>Fahrtkosten</option>
  <option>Telefon/Internet</option>
  <option>Weiterbildung</option>
  <option>Werbung</option>
  <option>Sonstiges</option>
</select>
```

---

## 🔄 WIE KATEGORIEN VERWENDEN

### 1️⃣ Import in JavaScript
```javascript
import { AUSGABEN_KATEGORIEN, getKategorienNames } from './modules/kategorien.js';

// Alle Kategorien
console.log(AUSGABEN_KATEGORIEN);

// Nur Namen
const names = getKategorienNames();
// ["Büromaterial", "Software/IT", "Fahrtkosten", ...]
```

### 2️⃣ Dynamisch in HTML laden
```javascript
// Placeholder in HTML:
<select id="a-kat" data-category-select></select>

// In app-refactored.js:
import { getKategorienHtml } from './modules/kategorien.js';
const select = document.getElementById('a-kat');
select.innerHTML = getKategorienHtml();
```

### 3️⃣ Kategorie nachschlagen
```javascript
import { getKategorieByName, getKategorieById } from './modules/kategorien.js';

// Nach Name
const kategorie = getKategorieByName('Software/IT');
console.log(kategorie.icon); // 💻
console.log(kategorie.beschreibung);

// Nach ID
const kat = getKategorieById('fahrt');
```

### 4️⃣ Kategorien exportieren
```javascript
import { exportKategorien } from './modules/kategorien.js';

const json = exportKategorien();
// { version: "1.0", exported: "2024-05-18T...", kategorien: [...] }
```

---

## 🎯 NÄCHSTE SCHRITTE

### Priorität 1: Dynamisches Laden
```javascript
// In app-refactored.js hinzufügen:
import { getKategorienHtml } from './modules/kategorien.js';

window.addEventListener('DOMContentLoaded', () => {
  // Alle Select-Elemente mit Kategorien füllen
  document.getElementById('a-kat').innerHTML = getKategorienHtml();
  document.getElementById('ocr-kat').innerHTML = getKategorienHtml();
  // ... weitere selects
});
```

### Priorität 2: Bessere Anzeige
```html
<!-- Verbesserte HTML mit Icons -->
<select id="a-kat">
  <option>📎 Büromaterial</option>
  <option>💻 Software/IT</option>
  <option>🚗 Fahrtkosten</option>
  <!-- etc. -->
</select>
```

### Priorität 3: Admin-Interface
- UI zum Hinzufügen/Löschen von Kategorien
- Kategorien in localStorage speichern
- Export/Import von Kategorien-Sets

---

## 📊 KATEGORIEN ÜBERSICHT

| ID | Name | Icon | Beispiele |
|-----|------|------|-----------|
| buero | Büromaterial | 📎 | Papier, Stifte, Drucker, Toner |
| software | Software/IT | 💻 | Adobe, Microsoft, Lizenzen, SaaS |
| fahrt | Fahrtkosten | 🚗 | Benzin, Parkgebühren, Maut |
| telefon | Telefon/Internet | 📱 | Telekom, Vodafone, O2, DSL |
| bildung | Weiterbildung | 📚 | Kurse, Trainings, Seminare |
| werbung | Werbung | 📢 | Anzeigen, Marketing, Facebook Ads |
| sonstiges | Sonstiges | 📦 | Alles andere |

---

## ✨ VORTEILE DER ZENTRALEN VERWALTUNG

✅ **Single Source of Truth** – Eine Stelle zum Ändern  
✅ **Wartbar** – Alle Kategorien an einem Ort  
✅ **Erweiterbar** – Neue Kategorien leicht hinzufügbar  
✅ **Typsicher** – Mit IDs statt Magic Strings  
✅ **Exportierbar** – Kategorien-Sets weitergeben  
✅ **Dokumentiert** – Mit Icon & Beschreibung  
✅ **Testbar** – Validieren in Unit-Tests  

---

## 🐛 BUG GEFIXT

❌ **Fehler in HTML gefunden:** "Großmaschinen" ← ✓ Gelöscht!

**Lage:** `src/index.html`, Line 214
**Problem:** Unvollständiges `<option>Großmaschinen>` ohne Closing Tag
**Lösung:** Entfernt + Kategorien bereinigt

