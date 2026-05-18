# 🔧 QUICK FIX - KI-BELEGERFASSUNG

## Das Problem
KI-Belegerfassung funktioniert nicht → Beleg-Upload macht nichts

## Die Lösung (3 Schritte)

### 1️⃣ API-Key besorgen (5 min)
```
→ https://console.anthropic.com
→ Settings → API Keys
→ Create New API Key
→ Key kopieren (sk-ant-...)
```

### 2️⃣ API-Key eintragen (1 min)

**Im Browser-Fenster der App:**
```javascript
// F12 → Console öffnen und ausführen:
localStorage.setItem('anthropic_api_key', 'sk-ant-DEIN_KEY_HIER');
location.reload();
```

**ODER in den Einstellungen:**
- Einstellungen → API-Keys
- "Anthropic API-Key" einfügen
- Speichern

### 3️⃣ Testen (1 min)
- Gehe zu Ausgaben → KI-Belegerfassung
- Lade ein Beleg-Foto hoch
- ✅ Sollte jetzt funktionieren!

---

## Was wurde behoben?

| Problem | Lösung |
|---------|--------|
| Kein API-Key Check | ✅ Prüfung hinzugefügt |
| Alte Claude Version | ✅ Auf claude-opus-4-1 aktualisiert |
| Keine Fehlermeldungen | ✅ Detaillierte Error-Messages |
| JSON Parse Fehler | ✅ Robusteres Parsing |
| Keine Input-Validierung | ✅ Dateigröße, Typ, Format geprüft |

---

## Kosten?
- Pro Beleg: ~0.001 USD (sehr günstig!)
- Du kontrollierst, wann API verwendet wird

---

**Fertig!** 🎉 Deine KI-Belegerfassung sollte jetzt funktionieren.

Bei Problemen: Siehe `KI_BELEGERFASSUNG_SETUP.md` für ausführliche Anleitung.
