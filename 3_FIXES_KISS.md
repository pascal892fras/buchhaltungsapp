# 🔧 3 SCHNELLE FIXES - KISS PRINZIP

## FIX 1: Wiederkehrende als Ausgaben kennzeichnen

**Problem:** Wiederkehrende Rechnungen sind derzeit als Einnahmen definiert  
**Lösung:** Markiere sie in der UI als "Kostenvorlagen" nicht als "Einnahmen"

**Wo ändern:** `src/modules/dashboard.js` oder `src/modules/wiederkehrend.js`
**Was ändern:** Label von "Einnahmen" zu "Ausgaben" bzw "Kostenvorlagen"

---

## FIX 2: Mahnungs-PDF Generierung

**Problem:** Mahnung erstellen → keine PDF  
**Lösung:** Exportiere PDF nach Mahnung erstellen

**Code zu addieren in rechnungen.js:**
```javascript
// Nach: erstelleMahnung() Funktion
// Füge hinzu:
function generiereMahnungPDF(id) {
  const mahnung = state.data.mahnungen.find(m => m.id === id);
  if (!mahnung) return;
  
  // Nutze gleiche PDF-Funktion wie Rechnungen
  generiereRechnungPDF(mahnung);
}
```

---

## FIX 3: Tabs scrollen nicht den Content

**Problem:** Tab-Leiste scrollt mit Content statt separat  
**Lösung:** Max-height auf Tab-Container + overflow-y: auto

**CSS zu ändern in styles.css:**
```css
.settings-tabs {
  max-height: 60px;  /* 1 Zeile */
  overflow-y: auto;
  flex-wrap: nowrap;
}

.settings-tab-content {
  max-height: calc(100vh - 200px);  /* Rest des Platzes */
  overflow-y: auto;
}
```

---

## 📝 UMSETZUNG

Alle 3 Fixes sind **KISS** - einfach, direkt, effektiv!
