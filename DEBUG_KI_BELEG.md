# 🐛 DEBUG-GUIDE - KI-BELEGERFASSUNG

## PROBLEM: "KI-Erkennung fehlgeschlagen"

### Schritt 1: Browser-Cache leeren

Die alte Version könnte noch im Cache sein!

**Chrome/Edge:**
1. F12 → DevTools öffnen
2. Rechtsklick auf Refresh-Button → "Leeren und harte Neuladen"
3. ODER: Strg+Shift+Delete → Cache leeren

**Firefox:**
1. Strg+Shift+Delete → Cache leeren
2. App neu laden

---

### Schritt 2: Prüfen, ob API-Key gespeichert ist

**Im Browser öffnen (F12 → Console):**

```javascript
// Prüfe API-Key
const apiKey = localStorage.getItem('anthropic_api_key');
console.log('API-Key gespeichert:', apiKey ? '✅ JA' : '❌ NEIN');
console.log('Wert:', apiKey);
```

**Wenn NEIN:** API-Key muss noch gespeichert werden!

```javascript
// Speichern (ersetze XXX mit deinem Key)
localStorage.setItem('anthropic_api_key', 'sk-ant-XXX');
console.log('✅ API-Key gespeichert');
```

---

### Schritt 3: Detaillierte Error-Logs prüfen

**In Browser-Console (F12):**

```javascript
// Simuliere Beleg-Upload
handleUpload({
  files: [
    {
      name: 'test.jpg',
      type: 'image/jpeg',
      size: 1000000,  // 1MB
      // HINWEIS: Das wird nicht wirklich funktionieren, aber zeigt Fehler
    }
  ]
});
```

Schau nach Fehlermeldungen in der Console!

---

### Schritt 4: Manueller API-Test

```javascript
// Teste Anthropic API direkt
const apiKey = localStorage.getItem('anthropic_api_key');

if (!apiKey) {
  console.error('❌ Kein API-Key!');
} else {
  console.log('✅ API-Key vorhanden:', apiKey.substring(0, 20) + '...');
  
  // Teste einfache Anfrage
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: 'Hallo!' }]
      }]
    })
  })
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('Response:', data);
  })
  .catch(e => console.error('Fehler:', e));
}
```

---

### Schritt 5: Häufige Fehler

| Fehler | Lösung |
|--------|--------|
| `Anthropic API-Key nicht konfiguriert` | → Schritt 2 ausführen |
| `401 Unauthorized` | → API-Key ist falsch/abgelaufen |
| `429 Too Many Requests` | → Zu viele Anfragen, warte ein paar Sekunden |
| `CORS Error` | → Browser blockiert Request (nur bei direktem Test) |
| `Invalid JSON` | → KI-Antwort war kein gültiges JSON |

---

### Schritt 6: Nachrichten in der App

Wo findest du Fehler-Messages?

1. **Oben im Ausgaben-Bereich** (Status-Meldung)
2. **Toast (unten rechts)** - "❌ Fehler: ..."
3. **Browser-Console (F12)** - `console.error` oder `console.log`

---

## LÖSUNG ZUM SELBST PROBIEREN

```javascript
// In F12 Console kopieren & ausführen:

// 1. API-Key speichern
localStorage.setItem('anthropic_api_key', 'sk-ant-DEIN_KEY_HIER');

// 2. Bestätigung
console.log('✅ Bereit!');

// 3. Jetzt in der App Beleg hochladen
```

Danach page reload (F5) und Beleg hochladen!

---

## NOCH IMMER NICHT FUNKTIONIERT?

Dann gib mir diese Infos:

1. **Fehlermeldung** (exakt kopieren)
2. **Browser-Console Log** (F12 → Console → alle Meldungen)
3. **API-Key Format** (hat es `sk-ant-` am Anfang?)
4. **Beleg-Dateityp** (JPG? PNG? PDF?)
5. **Dateigröße** (wie groß ist das Bild?)

---

**Status:** 🔧 Debugging  
**Letzter Check:** 18.05.2026
