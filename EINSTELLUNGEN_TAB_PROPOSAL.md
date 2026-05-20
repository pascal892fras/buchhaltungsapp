# 📋 EINSTELLUNGEN TAB-STRUKTUR: VORSCHLAG

## 🎯 AKTUELLE STRUKTUR (Probleme)
❌ Zu lang (eine große Seite)
❌ Schwer zu navigieren
❌ Visuelle Überlastung
❌ Verwandte Inhalte vermischt

---

## ✅ VORSCHLAG: 3-TAB LAYOUT

### **TAB 1: Branding & Design**
```
├─ Deine Daten (Firmenname, Beruf, Adresse)
├─ Logo / Branding
│  ├─ Logo hochladen
│  ├─ Logo-Größe
│  └─ Logo-Position
├─ Darstellung
│  ├─ Dark Mode
│  └─ Theme-Farben
└─ PDF-Template Grundlagen
   ├─ Logo-Positionierung
   ├─ Logo-Größe
   └─ Tabellen-Stil
```

### **TAB 2: Kontakt & Finanzen**
```
├─ Kontaktdaten
│  ├─ Telefon
│  ├─ E-Mail
│  ├─ Website
│  └─ Steuernummer
├─ Bankverbindung
│  ├─ Kontoinhaber
│  ├─ Bank
│  ├─ IBAN (verschlüsselt)
│  └─ BIC (verschlüsselt)
└─ Adresse
   └─ Vollständige Adresse
```

### **TAB 3: Rechnungs- & Mahnungseinstellungen**
```
├─ Rechnungseinstellungen
│  ├─ Nummernprefix (RE)
│  ├─ Zahlungsziel (Tage)
│  ├─ Standard-Fußnote
│  ├─ Intro-Text
│  └─ Grußformel
├─ Angebots-Einstellungen
│  ├─ Nummernprefix (ANG)
│  └─ Standard-Fußnote
├─ PDF-Farben & Layout
│  ├─ Farben (Highlight, Text, Border, BG)
│  ├─ QR-Code Größe
│  └─ Layout-Positionen
└─ Mahnungen
   ├─ Verzugszinsen p.a.
   ├─ Mahngebühren (3 Stufen)
   ├─ Zahlungsfristen (3 Stufen)
   └─ Textbausteine (3 Stufen)
```

---

## 📐 UI-DESIGN MOCKUP

```
┌─────────────────────────────────────────────┐
│  ⚙️ EINSTELLUNGEN                           │
├─────────────────────────────────────────────┤
│                                             │
│  [Branding] [Kontakt] [Rechnungen]  ← Tabs │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  TAB 1 CONTENT:                             │
│  ┌─────────────────────────────────────┐   │
│  │ Deine Daten                         │   │
│  │ ─────────────────────────────────── │   │
│  │ Firmenname:     [________]          │   │
│  │ Berufsbezeichn: [________]          │   │
│  │                                     │   │
│  │ Logo / Branding                     │   │
│  │ ─────────────────────────────────── │   │
│  │ [Upload Logo]  [Löschen]            │   │
│  │                                     │   │
│  │ Darstellung                         │   │
│  │ ─────────────────────────────────── │   │
│  │ ☑ Dark Mode aktivieren              │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Einstellungen speichern]                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎨 CSS/STYLING

### Tab-Navigation
```css
.settings-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  margin-bottom: 24px;
}

.settings-tab {
  padding: 12px 20px;
  cursor: pointer;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--muted);
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.settings-tab:hover {
  color: var(--text);
}

.settings-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.settings-tab-content {
  display: none;
}

.settings-tab-content.active {
  display: block;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 🧩 HTML-STRUKTUR

```html
<!-- EINSTELLUNGEN -->
<div class="section" id="sec-einstellungen">
  <div class="card">
    
    <!-- TAB NAVIGATION -->
    <div class="settings-tabs">
      <button class="settings-tab active" data-tab="branding">
        🎨 Branding & Design
      </button>
      <button class="settings-tab" data-tab="kontakt">
        👤 Kontakt & Finanzen
      </button>
      <button class="settings-tab" data-tab="rechnungen">
        📄 Rechnungseinstellungen
      </button>
    </div>

    <!-- TAB 1: BRANDING -->
    <div class="settings-tab-content active" id="tab-branding">
      <h3>Deine Daten</h3>
      <!-- Content hier -->
      
      <h3 style="margin-top:24px">Logo / Branding</h3>
      <!-- Logo Content -->
    </div>

    <!-- TAB 2: KONTAKT -->
    <div class="settings-tab-content" id="tab-kontakt">
      <h3>Kontaktdaten</h3>
      <!-- Kontakt Content -->
      
      <h3 style="margin-top:24px">Bankverbindung</h3>
      <!-- Bank Content -->
    </div>

    <!-- TAB 3: RECHNUNGEN -->
    <div class="settings-tab-content" id="tab-rechnungen">
      <h3>Rechnungseinstellungen</h3>
      <!-- Rechnungs Content -->
      
      <h3 style="margin-top:24px">Mahnungen</h3>
      <!-- Mahnungs Content -->
    </div>

    <!-- SAVE BUTTON (außerhalb Tabs) -->
    <div style="margin-top:24px;display:flex;gap:8px">
      <button class="btn btn-primary" onclick="speichernSettings()">
        Einstellungen speichern
      </button>
      <button class="btn" onclick="vorschauTemplate()">
        📄 Vorschau anzeigen
      </button>
    </div>
    <div id="s-confirm" style="display:none;margin-top:8px;font-size:12px;color:var(--success)">
      ✓ Gespeichert
    </div>
    
  </div>
</div>
```

---

## 💻 JAVASCRIPT

```javascript
// settings-tabs.js
export function initializeSettingsTabs() {
  const tabs = document.querySelectorAll('.settings-tab');
  const contents = document.querySelectorAll('.settings-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Deaktiviere alle Tabs
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      // Aktiviere gewählten Tab
      tab.classList.add('active');
      document.getElementById(`tab-${tabName}`).classList.add('active');
      
      // Optional: Speichere Preference
      localStorage.setItem('lastSettingsTab', tabName);
    });
  });

  // Stelle letzten Tab wieder her
  const lastTab = localStorage.getItem('lastSettingsTab') || 'branding';
  document.querySelector(`[data-tab="${lastTab}"]`)?.click();
}
```

---

## ✨ VORTEILE DIESER STRUKTUR

✅ **Übersichtlich** – Logische Gruppierung verwandter Einstellungen  
✅ **Kurz** – Jeder Tab ist kompakt statt eine lange Seite  
✅ **Intuitiv** – Benutzer findet schnell was er sucht  
✅ **Modern** – Tab-Interface ist Standard  
✅ **Wartbar** – Leicht neue Settings hinzufügbar  
✅ **Responsive** – Tabs auch auf Handy ok  

---

## 📊 VERGLEICH

### VORHER (Alte Struktur)
```
Einstellungen (1 lange Seite)
├─ Deine Daten
├─ Bankverbindung
├─ Logo
├─ Darstellung
├─ Rechnungseinstellungen
├─ Angebote
├─ PDF-Templates
├─ Mahnungen
└─ → TOO LONG, user scrollt vorbei
```

### NACHHER (Tab-Struktur)
```
TAB 1: Branding & Design  → Kurz, fokussiert
TAB 2: Kontakt & Finanzen → Kurz, fokussiert
TAB 3: Rechnungen        → Kurz, fokussiert
```

---

## 🎯 IMPLEMENTIERUNGS-ROADMAP

**Aufwand: ~3-4 Stunden**

1. ⏳ HTML umstrukturieren (60 min)
2. ⏳ CSS für Tabs (30 min)
3. ⏳ JavaScript für Tab-Navigation (20 min)
4. ⏳ Alle Inhalte in Tabs verschieben (60 min)
5. ⏳ Testen & Responsive-Fixes (30 min)

---

## 🚀 SOLLEN WIR IMPLEMENTIEREN?

**JA!** Ich würde diese Struktur empfehlen. Soll ich:

1. ✅ HTML umstrukturieren (Tabs hinzufügen)
2. ✅ CSS schreiben (Tab-Styling)
3. ✅ JavaScript integrieren (Tab-Logik)
4. ✅ Alle Content verschieben

**Oder möchtest du noch Änderungen am Vorschlag?**
