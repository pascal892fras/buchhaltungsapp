# 🔐 API-Key Management – Implementierungsguide

## 🎯 Überblick

Die App nutzt derzeit die **Anthropic Claude API** für die KI-Belegerfassung (OCR). Der API-Key fehlt aber in den Einstellungen – **das ist ein kritisches Sicherheitsloch!**

Dieses Dokument zeigt:
- ✅ Sichere API-Key-Speicherung
- ✅ Frontend-Integration in Einstellungen
- ✅ Backend-Handling mit Electron
- ✅ Lokale Alternativen (offline OCR)

---

## 🔴 Aktueller Status

### Problem
```javascript
// In ausgaben.js existiert bereits API-Handling, aber:
// ❌ API-Key ist NICHT im UI konfigurierbar
// ❌ API-Key könnte hardcoded sein
// ❌ Keine Fehlerbehandlung für fehlende Keys
// ❌ Keine lokale Alternative
```

### Gefahren
- 🔴 **Sicherheit**: API-Key könnte in Code exponiert sein
- 🔴 **Wartbarkeit**: Key-Wechsel erfordert Code-Änderung
- 🔴 **UX**: User kann nicht eigenen Key nutzen
- 🔴 **Offline**: App funktioniert nicht ohne Internet

---

## ✅ Lösung 1: Sichere API-Key Verwaltung (Online)

### 1.1 HTML-UI in Einstellungen ergänzen

Füge folgende Sektion in `index.html` ein (nach Rechnungseinstellungen, vor "Mahnungen"):

```html
        <!-- KI-API KONFIGURATION -->
        <h3 style="margin-top:24px">🤖 KI-Integration (Belegerfassung)</h3>
        <p style="font-size:12px;color:var(--hint);margin-bottom:12px">
          Konfiguriere deinen API-Key für automatische Belegerfassung mit KI
        </p>
        
        <div style="background:var(--bg);border-left:3px solid var(--accent);padding:12px;border-radius:var(--radius);margin-bottom:12px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="s-ai-enabled" style="width:auto;margin:0">
            <span>KI-Belegerfassung aktivieren</span>
          </label>
          <div style="font-size:11px;color:var(--hint);margin-top:4px">
            Nur mit gültigem API-Key funktionsfähig
          </div>
        </div>

        <div class="grid2">
          <div>
            <label>AI-Provider</label>
            <select id="s-ai-provider" onchange="updateAIProviderInfo()">
              <option value="anthropic">Anthropic Claude (empfohlen)</option>
              <option value="openai">OpenAI GPT-4 Vision</option>
              <option value="local">Lokal (offline, kostenlos)</option>
            </select>
          </div>
          <div style="font-size:11px;color:var(--hint);padding-top:28px">
            <div id="s-ai-provider-info">
              Claude API: Beste Qualität, 3€ pro 1M Tokens
            </div>
          </div>
        </div>

        <!-- ANTHROPIC CLAUDE -->
        <div id="s-ai-anthropic-config" style="margin-top:12px;padding:12px;background:var(--bg);border-radius:var(--radius)">
          <h4 style="font-size:13px;margin-bottom:8px">Anthropic Claude Konfiguration</h4>
          
          <label>API-Key (wird verschlüsselt gespeichert)</label>
          <div style="display:flex;gap:8px">
            <input 
              type="password" 
              id="s-anthropic-key" 
              placeholder="sk-ant-..."
              style="flex:1"
            >
            <button class="btn btn-sm" onclick="toggleApiKeyVisibility('s-anthropic-key')" style="width:auto">
              👁️
            </button>
          </div>
          <div style="font-size:11px;color:var(--hint);margin-top:4px">
            🔐 Sicher lokal gespeichert. <a href="https://console.anthropic.com/" target="_blank" style="color:var(--accent)">API-Key holen →</a>
          </div>

          <label style="margin-top:12px">Modell</label>
          <select id="s-anthropic-model">
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (schnell & günstig)</option>
            <option value="claude-3-opus-20250219">Claude 3 Opus (beste Qualität)</option>
          </select>

          <label style="margin-top:12px">Max. Dateigröße (MB)</label>
          <input 
            type="number" 
            id="s-anthropic-max-file-size" 
            value="10" 
            min="1" 
            max="100"
            style="width:120px"
          >

          <div style="margin-top:12px">
            <button class="btn btn-sm" onclick="testAnthropicConnection()">
              🧪 Verbindung testen
            </button>
            <span id="s-anthropic-test-result" style="font-size:11px;margin-left:8px"></span>
          </div>
        </div>

        <!-- OPENAI GPT-4V -->
        <div id="s-ai-openai-config" style="display:none;margin-top:12px;padding:12px;background:var(--bg);border-radius:var(--radius)">
          <h4 style="font-size:13px;margin-bottom:8px">OpenAI GPT-4 Vision Konfiguration</h4>
          
          <label>API-Key (wird verschlüsselt gespeichert)</label>
          <div style="display:flex;gap:8px">
            <input 
              type="password" 
              id="s-openai-key" 
              placeholder="sk-..."
              style="flex:1"
            >
            <button class="btn btn-sm" onclick="toggleApiKeyVisibility('s-openai-key')" style="width:auto">
              👁️
            </button>
          </div>
          <div style="font-size:11px;color:var(--hint);margin-top:4px">
            🔐 Sicher lokal gespeichert. <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent)">API-Key holen →</a>
          </div>

          <div style="margin-top:12px">
            <button class="btn btn-sm" onclick="testOpenAIConnection()">
              🧪 Verbindung testen
            </button>
            <span id="s-openai-test-result" style="font-size:11px;margin-left:8px"></span>
          </div>
        </div>

        <!-- LOKAL OCR -->
        <div id="s-ai-local-config" style="display:none;margin-top:12px;padding:12px;background:var(--success);border-radius:var(--radius);opacity:0.9">
          <h4 style="font-size:13px;margin-bottom:8px">✅ Lokal (Offline) OCR</h4>
          <p style="font-size:12px;margin:0">
            ✓ Kostenlos<br>
            ✓ Offline funktionsfähig<br>
            ✓ Keine Datenweitergabe<br>
            ⚠️ Qualität: 70% (vs 95% mit KI)
          </p>
          <button class="btn btn-sm" onclick="downloadLocalOCRModel()" style="margin-top:12px">
            📥 OCR-Modell installieren
          </button>
          <span id="s-local-ocr-status" style="font-size:11px;margin-left:8px;color:var(--hint)"></span>
        </div>

        <!-- ALLGEMEINE AI-EINSTELLUNGEN -->
        <h4 style="margin-top:16px;font-size:13px">Allgemeine KI-Einstellungen</h4>
        <div class="grid2">
          <div>
            <label>Standard-Kategorie (wenn nicht erkannt)</label>
            <select id="s-ai-default-category">
              <option>Büromaterial</option>
              <option>Software/IT</option>
              <option>Fahrtkosten</option>
              <option>Telefon/Internet</option>
              <option>Weiterbildung</option>
              <option>Werbung</option>
              <option>Sonstiges</option>
            </select>
          </div>
          <div>
            <label>Erkannten Daten immer prüfen?</label>
            <select id="s-ai-require-review">
              <option value="always">Immer bestätigen</option>
              <option value="unsure">Nur bei Unsicherheit (< 80%)</option>
              <option value="never">Auto-Speichern</option>
            </select>
          </div>
        </div>

        <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:var(--radius)">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" id="s-ai-logging" style="width:auto;margin:0" checked>
            <span>OCR-Anfragen protokollieren (für Debugging)</span>
          </label>
        </div>
```

### 1.2 JavaScript-Funktionen für Settings (modules/settings.js)

```javascript
// ═════════════════════════════════════════════════════════
// 🤖 KI-API MANAGEMENT
// ═════════════════════════════════════════════════════════

/**
 * Aktualisiert die Info-Texte für verschiedene AI-Provider
 */
export function updateAIProviderInfo() {
  const provider = document.getElementById('s-ai-provider').value;
  const infoEl = document.getElementById('s-ai-provider-info');
  
  const infos = {
    anthropic: '✅ Claude API: Beste Qualität beim Lesen von Rechnungen\n💰 Kosten: ~0,003€ pro Beleg\n⚡ Speed: 2-5 Sekunden',
    openai: '✅ GPT-4 Vision: Ausgezeichnete OCR-Qualität\n💰 Kosten: ~0,05€ pro Beleg\n⚡ Speed: 3-8 Sekunden',
    local: '✅ Lokal: Kostenlos & offline\n💰 Kosten: 0€ (lokal)\n⚡ Speed: 1-3 Sekunden\n⚠️ Qualität: 70% (statt 95%)'
  };
  
  infoEl.textContent = infos[provider] || '';
  
  // Zeige/verstecke entsprechende Config-Panels
  document.getElementById('s-ai-anthropic-config').style.display = 
    provider === 'anthropic' ? 'block' : 'none';
  document.getElementById('s-ai-openai-config').style.display = 
    provider === 'openai' ? 'block' : 'none';
  document.getElementById('s-ai-local-config').style.display = 
    provider === 'local' ? 'block' : 'none';
}

/**
 * Schaltet API-Key-Sichtbarkeit um (Password ↔ Text)
 */
export function toggleApiKeyVisibility(elementId) {
  const el = document.getElementById(elementId);
  const isPassword = el.type === 'password';
  el.type = isPassword ? 'text' : 'password';
  
  // Nach 5 Sekunden wieder verstecken
  if (!isPassword) {
    setTimeout(() => {
      el.type = 'password';
    }, 5000);
  }
}

/**
 * Testet die Anthropic Claude Connection
 */
export async function testAnthropicConnection() {
  const statusEl = document.getElementById('s-anthropic-test-result');
  const key = document.getElementById('s-anthropic-key').value;
  
  if (!key) {
    statusEl.textContent = '❌ API-Key erforderlich';
    return;
  }
  
  statusEl.textContent = '⏳ Teste...';
  
  try {
    const result = await window.api.testApiConnection({
      provider: 'anthropic',
      apiKey: key
    });
    
    if (result.success) {
      statusEl.textContent = '✅ Verbindung erfolgreich!';
      statusEl.style.color = 'var(--success)';
    } else {
      statusEl.textContent = `❌ Fehler: ${result.error}`;
      statusEl.style.color = 'var(--danger)';
    }
  } catch (error) {
    statusEl.textContent = `❌ ${error.message}`;
    statusEl.style.color = 'var(--danger)';
  }
}

/**
 * Testet die OpenAI Connection
 */
export async function testOpenAIConnection() {
  const statusEl = document.getElementById('s-openai-test-result');
  const key = document.getElementById('s-openai-key').value;
  
  if (!key) {
    statusEl.textContent = '❌ API-Key erforderlich';
    return;
  }
  
  statusEl.textContent = '⏳ Teste...';
  
  try {
    const result = await window.api.testApiConnection({
      provider: 'openai',
      apiKey: key
    });
    
    if (result.success) {
      statusEl.textContent = '✅ Verbindung erfolgreich!';
      statusEl.style.color = 'var(--success)';
    } else {
      statusEl.textContent = `❌ Fehler: ${result.error}`;
      statusEl.style.color = 'var(--danger)';
    }
  } catch (error) {
    statusEl.textContent = `❌ ${error.message}`;
    statusEl.style.color = 'var(--danger)';
  }
}

/**
 * Lädt das lokale OCR-Modell herunter
 */
export async function downloadLocalOCRModel() {
  const statusEl = document.getElementById('s-local-ocr-status');
  statusEl.textContent = '⏳ Lade OCR-Modell... (ca. 50MB)';
  
  try {
    const result = await window.api.downloadLocalOCRModel();
    
    if (result.success) {
      statusEl.textContent = '✅ Modell installiert';
      statusEl.style.color = 'var(--success)';
    } else {
      statusEl.textContent = `❌ ${result.error}`;
      statusEl.style.color = 'var(--danger)';
    }
  } catch (error) {
    statusEl.textContent = `❌ ${error.message}`;
    statusEl.style.color = 'var(--danger)';
  }
}

/**
 * Lädt Settings aus localStorage
 */
export function loadAISettings() {
  const settings = state.settings;
  
  // Basis-Settings
  document.getElementById('s-ai-enabled').checked = settings.aiEnabled ?? true;
  document.getElementById('s-ai-provider').value = settings.aiProvider ?? 'anthropic';
  
  // Anthropic
  document.getElementById('s-anthropic-key').value = 
    settings.anthropicKey ? '••••••••' : '';
  document.getElementById('s-anthropic-model').value = 
    settings.anthropicModel ?? 'claude-3-5-sonnet-20241022';
  document.getElementById('s-anthropic-max-file-size').value = 
    settings.anthropicMaxFileSize ?? 10;
  
  // OpenAI
  document.getElementById('s-openai-key').value = 
    settings.openaiKey ? '••••••••' : '';
  
  // Allgemein
  document.getElementById('s-ai-default-category').value = 
    settings.aiDefaultCategory ?? 'Sonstiges';
  document.getElementById('s-ai-require-review').value = 
    settings.aiRequireReview ?? 'always';
  document.getElementById('s-ai-logging').checked = 
    settings.aiLogging ?? true;
  
  updateAIProviderInfo();
}

/**
 * Speichert AI-Settings verschlüsselt
 */
export async function saveAISettings() {
  try {
    const settings = {
      aiEnabled: document.getElementById('s-ai-enabled').checked,
      aiProvider: document.getElementById('s-ai-provider').value,
      
      // Nur speichern, wenn neu eingegeben (nicht "••••••••")
      anthropicKey: document.getElementById('s-anthropic-key').value.startsWith('sk-ant-') 
        ? document.getElementById('s-anthropic-key').value 
        : state.settings.anthropicKey,
      anthropicModel: document.getElementById('s-anthropic-model').value,
      anthropicMaxFileSize: parseInt(document.getElementById('s-anthropic-max-file-size').value),
      
      openaiKey: document.getElementById('s-openai-key').value.startsWith('sk-') 
        ? document.getElementById('s-openai-key').value 
        : state.settings.openaiKey,
      
      aiDefaultCategory: document.getElementById('s-ai-default-category').value,
      aiRequireReview: document.getElementById('s-ai-require-review').value,
      aiLogging: document.getElementById('s-ai-logging').checked,
    };
    
    // Speichern über IPC (wird im Main-Process verschlüsselt)
    await window.api.saveAISettings(settings);
    
    // Local state updaten
    Object.assign(state.settings, settings);
    
    toast('✅ KI-Einstellungen gespeichert', 'success');
    
  } catch (error) {
    console.error('Fehler beim Speichern der KI-Einstellungen:', error);
    toast(`❌ Fehler: ${error.message}`, 'error');
  }
}
```

### 1.3 Backend-Integration (main.js)

```javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ═════════════════════════════════════════════════════════
// 🔐 API-KEY VERSCHLÜSSELUNG
// ═════════════════════════════════════════════════════════

const ENCRYPTION_KEY = crypto.scryptSync('buchhaltung-app', 'salt', 32);

function encryptAPIKey(apiKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptAPIKey(encryptedKey) {
  const [iv, encrypted] = encryptedKey.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ═════════════════════════════════════════════════════════
// 📁 IPC-HANDLER FÜR AI-SETTINGS
// ═════════════════════════════════════════════════════════

ipcMain.handle('ai:save-settings', async (event, settings) => {
  try {
    const aiSettingsPath = path.join(app.getPath('userData'), 'buchhaltung_ai_settings.json');
    
    // Verschlüssele API-Keys
    const encrypted = {
      ...settings,
      anthropicKey: settings.anthropicKey 
        ? encryptAPIKey(settings.anthropicKey) 
        : null,
      openaiKey: settings.openaiKey 
        ? encryptAPIKey(settings.openaiKey) 
        : null,
    };
    
    fs.writeFileSync(aiSettingsPath, JSON.stringify(encrypted, null, 2), 'utf8');
    
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Speichern der AI-Settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai:load-settings', async (event) => {
  try {
    const aiSettingsPath = path.join(app.getPath('userData'), 'buchhaltung_ai_settings.json');
    
    if (!fs.existsSync(aiSettingsPath)) {
      return { success: true, data: {} };
    }
    
    const encrypted = JSON.parse(fs.readFileSync(aiSettingsPath, 'utf8'));
    
    // Entschlüssele API-Keys
    const decrypted = {
      ...encrypted,
      anthropicKey: encrypted.anthropicKey ? decryptAPIKey(encrypted.anthropicKey) : null,
      openaiKey: encrypted.openaiKey ? decryptAPIKey(encrypted.openaiKey) : null,
    };
    
    return { success: true, data: decrypted };
  } catch (error) {
    console.error('Fehler beim Laden der AI-Settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai:test-connection', async (event, { provider, apiKey }) => {
  try {
    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: 'Antworte nur mit OK'
          }]
        })
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error?.message || 'API-Fehler' };
      }
      
    } else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Ungültiger API-Key' };
      }
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

---

## ✅ Lösung 2: Lokale OCR-Alternative (Offline)

### Tesseract.js für lokale OCR

```javascript
// modules/local-ocr.js
import Tesseract from 'tesseract.js';

export async function performLocalOCR(imageData) {
  try {
    const result = await Tesseract.recognize(
      imageData,
      'deu', // Deutsch
      { logger: m => console.log('OCR Progress:', m.progress) }
    );
    
    // Extrahiere Informationen aus OCR-Text
    const text = result.data.text;
    
    return {
      success: true,
      datum: extractDate(text),
      betrag: extractAmount(text),
      beschreibung: extractDescription(text),
      kategorie: guessCategory(text),
      confidence: result.data.confidence
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function extractDate(text) {
  // Regex für Datum-Muster
  const dateRegex = /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/;
  const match = text.match(dateRegex);
  
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? '20' + year : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

function extractAmount(text) {
  // Regex für Euro-Beträge
  const amountRegex = /(?:€|EUR|€\s*)(\d+)[.,](\d{2})/;
  const match = text.match(amountRegex);
  
  if (match) {
    return `${match[1]}.${match[2]}`;
  }
  
  return '';
}

function extractDescription(text) {
  // Extrahiere Unternehmensname/Beschreibung (erste Zeile meist)
  const lines = text.split('\n').filter(l => l.trim());
  return lines[0] || '';
}

function guessCategory(text) {
  const lower = text.toLowerCase();
  
  const categories = {
    'Büromaterial': ['papier', 'stift', 'büro', 'drucker'],
    'Software/IT': ['software', 'lizenz', 'saas', 'cloud', 'microsoft', 'adobe'],
    'Fahrtkosten': ['tanke', 'benzin', 'auto', 'pkw', 'kilometer'],
    'Telefon/Internet': ['telefon', 'internet', 'telekom', 'vodafone', 'o2'],
    'Weiterbildung': ['kurs', 'training', 'schulung', 'seminar'],
    'Werbung': ['anzeige', 'werbung', 'marketing', 'social media'],
  };
  
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return cat;
    }
  }
  
  return 'Sonstiges';
}
```

---

## 🔐 Sicherheits-Best-Practices

### ✅ Dos
```javascript
// ✅ API-Keys verschlüsselt speichern
const encrypted = encryptAPIKey(apiKey);
fs.writeFileSync(settingsFile, encrypted);

// ✅ Keys aus Memory nach Nutzung löschen
let apiKey = decryptAPIKey(encrypted);
// ... nutzen ...
apiKey = null; // GC wird aufgeräumt

// ✅ Keys NIEMALS in Logs anzeigen
console.log('API-Key:', key.substring(0, 8) + '****');

// ✅ Benutzer aufklären, dass Keys sicher sind
// (zeige Verschlüsselungs-Infos)
```

### ❌ Don'ts
```javascript
// ❌ API-Keys im Frontend speichern (exposed!)
localStorage.setItem('apiKey', key);

// ❌ Keys in Version Control committen
// .gitignore benutzen!

// ❌ Keys in Error-Messages anzeigen
console.error('Failed to call API:', apiKey, error);

// ❌ Keys in PDFs/Exports enthalten
exportUserData() // must NOT include keys!
```

---

## 🚀 Implementierungs-Roadmap

### Phase 1: Frontend UI (2-3 Stunden)
- [ ] HTML-Sektion in index.html hinzufügen
- [ ] CSS-Styling anpassen
- [ ] Provider-Umschalter testen

### Phase 2: Backend Security (2-3 Stunden)
- [ ] Encryption/Decryption in main.js
- [ ] IPC-Handler schreiben
- [ ] API-Connection-Test implementieren

### Phase 3: Frontend Logic (1-2 Stunden)
- [ ] settings.js Functions schreiben
- [ ] Form-Handling & Validation
- [ ] Settings laden/speichern

### Phase 4: Lokale OCR (Optional, 3-4 Stunden)
- [ ] Tesseract.js integrieren
- [ ] Local-OCR-Fallback einbauen
- [ ] Model-Download-Manager

### Phase 5: Testing (1 Stunde)
- [ ] Connection-Tests durchführen
- [ ] Encryption/Decryption verifizieren
- [ ] Fehler-Szenarien testen

**Gesamtaufwand: 8-12 Stunden** (mit lokaler OCR bis 15 Stunden)

---

## 📋 Checkliste für Sicherheit

- [ ] API-Keys werden verschlüsselt gespeichert
- [ ] Keys werden NICHT in Logs angezeigt
- [ ] .env-Datei im .gitignore
- [ ] IPC-Kommunikation validiert
- [ ] User wird gewarnt vor unsicherer Key-Speicherung
- [ ] Settings haben Zugriffskontrolle
- [ ] Alte Keys werden bei Update überschrieben
- [ ] Backup enthält KEINE API-Keys

---

## 🔗 Referenzen

- [Anthropic API Docs](https://docs.anthropic.com/)
- [OpenAI Vision Docs](https://platform.openai.com/docs/guides/vision)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
- [Tesseract.js Docs](https://github.com/naptha/tesseract.js)
- [Electron Security](https://www.electronjs.org/docs/tutorial/security)

