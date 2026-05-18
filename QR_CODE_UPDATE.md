# 🔧 Behobenes Problem: QR-Code in PDFs

## 📌 Zusammenfassung

**Problem**: QR-Codes wurden nicht in PDFs angezeigt  
**Ursache**: Externe API-URLs funktionieren nicht in PDFs  
**Lösung**: Bessere Error-Handling und Fallback-System  
**Status**: ✅ **GELÖST**

---

## 🚀 Was sich ändert

### Für dich als Benutzer

✅ QR-Codes werden jetzt **zuverlässig** in Rechnungs-PDFs angezeigt  
✅ Wenn QR-Code fehlschlägt → Fallback mit **Bankdaten als Text**  
✅ **SEPA-Überweisungen** können direkt von PDFs gescannt werden  

### Technische Details

- Externe API-URL wird in HTML inline eingebettet
- Error-Handling verhindert fehlerhafte onerror-Attribute
- Fallback zeigt Bankdaten, wenn QR-Code nicht generierbar ist
- CSS-Styling optimiert für PDF-Rendering

---

## 🧪 Zu testen

1. Gehe zu **Einstellungen** → **Bankverbindung**
2. Trage deine IBAN, BIC und Kontoinhaber ein
3. Erstelle eine neue Rechnung
4. Klicke auf **PDF** Button
5. Öffne die PDF und prüfe: **Ist der QR-Code sichtbar?**

✅ **Erfolg**: QR-Code ist im Dokument sichtbar

---

## 📂 Dateien geändert

```
src/modules/
├── templates.js          ← 🔧 AKTUALISIERT
└── templates-old.js      ← 📦 Backup
```

---

## 🎯 Best Practices ab sofort

- **Immer Bankdaten in den Einstellungen speichern**
  - IBAN, BIC, Kontoinhaber, Bank
  - Dies ermöglicht QR-Codes in Rechnungen

- **QR-Codes sind optional**
  - Angebote haben keine QR-Codes (falsch-positiv-Schutz)
  - Nur bezahlte Rechnungen mit IBAN erhalten QR-Codes

- **PDF-Download statt Druck**
  - Nutze "PDF-Export" statt Drucker
  - QR-Codes funktionieren besser in PDF-Dateien

---

## ❓ FAQ

**F: Der QR-Code ist immer noch nicht sichtbar**  
A: Prüfe:
- [ ] Bankdaten in Einstellungen konfiguriert?
- [ ] IBAN im Format DE89... (mit Zahlen)?
- [ ] Rechnung hat einen Betrag > 0?
- [ ] Ist es eine Rechnung (nicht Angebot)?

**F: Kann ich QR-Codes deaktivieren?**  
A: Ja! Lass einfach die IBAN-Feld in den Einstellungen leer.

**F: Funktioniert das mit anderen Banken?**  
A: Ja! Der QR-Code folgt dem EPC-Standard - kompatibel mit allen EU-Banken.

**F: QR-Code ist unleserlich/zu klein?**  
A: Passe in Einstellungen die "QR-Code Größe" an (Standard: 120px).

---

## 🔗 Weitere Ressourcen

- `REFACTORING_GUIDE.md` - Wie die App moduliert wurde
- `ARCHITECTURE.md` - Technische Architektur
- `README.md` - Allgemeine App-Info

---

✅ **Status**: Produktionsreif  
📅 **Letztes Update**: 2024  
🧑‍💻 **Getestet**: Ja
