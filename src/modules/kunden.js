/**
 * Kundenverwaltung
 */

import { state, saveData } from './state.js';
import { toast } from './helpers.js';

export function showKundeForm(kundeId) {
  document.getElementById('kunde-form').style.display = 'block';
  document.getElementById('k-id').value = '';
  document.getElementById('k-kundennummer').value = '';
  document.getElementById('k-name').value = '';
  document.getElementById('k-kontakt').value = '';
  document.getElementById('k-mail').value = '';
  document.getElementById('k-tel').value = '';
  document.getElementById('k-adresse').value = '';
  document.getElementById('kunde-form-title').textContent = 'Neuer Kunde';

  if (kundeId) {
    const kunde = state.data.kunden.find(k => k.id === kundeId);
    if (kunde) {
      document.getElementById('k-id').value = kunde.id;
      document.getElementById('k-kundennummer').value = kunde.kundennummer || '';
      document.getElementById('k-name').value = kunde.name || '';
      document.getElementById('k-kontakt').value = kunde.kontakt || '';
      document.getElementById('k-mail').value = kunde.mail || '';
      document.getElementById('k-tel').value = kunde.tel || '';
      document.getElementById('k-adresse').value = kunde.adresse || '';
      document.getElementById('kunde-form-title').textContent = 'Kunde bearbeiten';
    }
  }
}

export function hideKundeForm() {
  document.getElementById('kunde-form').style.display = 'none';
  document.getElementById('k-id').value = '';
}

export function speichernKunde() {
  const kundeId = document.getElementById('k-id').value;
  const name = document.getElementById('k-name').value;

  if (!name) {
    toast('Bitte Namen eingeben');
    return;
  }

  let kundennummer = document.getElementById('k-kundennummer').value.trim();
  if (!kundennummer) {
    kundennummer = 'K-' + String(state.data.kunden.length + 1).padStart(3, '0');
  }

  const kundeData = {
    kundennummer: kundennummer,
    name: name,
    kontakt: document.getElementById('k-kontakt').value,
    mail: document.getElementById('k-mail').value,
    tel: document.getElementById('k-tel').value,
    adresse: document.getElementById('k-adresse').value
  };

  if (kundeId) {
    const idx = state.data.kunden.findIndex(k => k.id === kundeId);
    if (idx !== -1) {
      state.data.kunden[idx] = { ...state.data.kunden[idx], ...kundeData };
      toast('Kunde aktualisiert');
    }
  } else {
    state.data.kunden.push({ id: Date.now().toString(), ...kundeData });
    toast('Kunde gespeichert');
  }

  saveData();
  hideKundeForm();
  renderKunden();
}

export function renderKunden() {
  const tb = document.getElementById('kunden-tbody');

  if (!state.data.kunden.length) {
    tb.innerHTML = '<tr><td colspan="6" class="empty">Noch keine Kunden</td></tr>';
    return;
  }

  tb.innerHTML = state.data.kunden.map(k => `<tr>
    <td><strong>${k.kundennummer || '—'}</strong></td>
    <td><strong>${k.name}</strong>${k.kontakt ? `<br><span style="font-size:11px;color:var(--muted)">${k.kontakt}</span>` : ''}</td>
    <td>${k.mail || '—'}</td>
    <td>${k.tel || '—'}</td>
    <td>${state.data.rechnungen.filter(r => r.kundeId == k.id).length}</td>
    <td style="display:flex;gap:4px">
      <button class="btn btn-sm" onclick="showKundeForm('${k.id}')" title="Bearbeiten">✎</button>
      <button class="btn btn-sm btn-danger" onclick="loescheKunde('${k.id}')">✕</button>
    </td>
  </tr>`).join('');
}

export function loescheKunde(id) {
  if (confirm('Kunde löschen?')) {
    state.data.kunden = state.data.kunden.filter(k => k.id != id);
    saveData();
    renderKunden();
  }
}

// Exportiere für globale Verfügbarkeit
window.showKundeForm = showKundeForm;
window.hideKundeForm = hideKundeForm;
window.speichernKunde = speichernKunde;
window.loescheKunde = loescheKunde;
