/**
 * Positionsverwaltung für Rechnungen, Angebote und wiederkehrende Rechnungen
 */

import { fmt } from './helpers.js';
import { state } from './state.js';

/**
 * Erstellt eine neue Position-Reihe
 */
export function makePosRow(container, counter, calcFn) {
  const id = 'pos-' + counter;
  const div = document.createElement('div');
  div.className = 'pos-row';
  div.id = id;

  div.innerHTML = `
    <input type="text" placeholder="Leistungsbeschreibung" onchange="${calcFn}()">
    <input type="number" value="1" step="0.5" placeholder="1" onchange="${calcFn}()" style="margin-bottom:0">
    <input type="number" step="0.01" placeholder="0,00" onchange="${calcFn}()" style="margin-bottom:0">
    <input type="text" readonly style="background:var(--bg);margin-bottom:0" id="${id}-total">
    <button class="btn btn-sm btn-danger" onclick="document.getElementById('${id}').remove();${calcFn}()" style="padding:6px 8px">✕</button>
  `;

  // Event-Listener für Auto-Berechnung
  const mengeInput = div.querySelector('input:nth-child(2)');
  const priceInput = div.querySelector('input:nth-child(3)');
  const totalOutput = div.querySelector(`#${id}-total`);

  const updateTotal = () => {
    const m = parseFloat(mengeInput.value) || 0;
    const e = parseFloat(priceInput.value) || 0;
    totalOutput.value = fmt(m * e);
    window[calcFn]();
  };

  mengeInput.addEventListener('input', updateTotal);
  priceInput.addEventListener('input', updateTotal);

  document.getElementById(container).appendChild(div);
}

/**
 * Extrahiert Positionen aus einem Container
 */
export function getPositionen(containerId) {
  const pos = [];
  document.querySelectorAll(`#${containerId} .pos-row`).forEach(p => {
    pos.push({
      beschr: p.children[0].value,
      menge: parseFloat(p.children[1].value) || 0,
      ep: parseFloat(p.children[2].value) || 0
    });
  });
  return pos;
}

/**
 * Berechnet Summen eines Position-Containers
 */
export function calcContainer(containerId, outputId) {
  let g = 0;

  document.querySelectorAll(`#${containerId} .pos-row`).forEach(p => {
    const m = parseFloat(p.children[1].value) || 0;
    const e = parseFloat(p.children[2].value) || 0;
    g += m * e;

    const tot = p.querySelector('[id$="-total"]');
    if (tot) tot.value = fmt(m * e);
  });

  if (outputId) {
    document.getElementById(outputId).textContent = fmt(g);
  }

  return g;
}
