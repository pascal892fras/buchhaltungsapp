// ─── STATE ───────────────────────────────────────────────
let data = { kunden:[], rechnungen:[], ausgaben:[], angebote:[], wiederkehrend:[] };
let settings = {
  name:'', beruf:'', adresse:'', tel:'', mail:'', web:'', steuernr:'', bank:'', kontoinhaber:'', iban:'', bic:'', zahltage:14, prefix:'RE', angprefix:'ANG',
  fussnote:'Gemäß §19 UStG wird keine Umsatzsteuer ausgewiesen.',
  angfussnote:'Dieses Angebot ist freibleibend und unverbindlich. Preise in Euro, netto gemäß §19 UStG.',
  // Template-Einstellungen
  tpl_logo_pos_v: 'top', // top oder bottom
  tpl_logo_pos_h: 'right', // left, center, right
  tpl_logo_size: '140', // Logo Breite in px
  tpl_color_highlight: '#000000', // Farbe für Überschriften/hervorgehobene Elemente
  tpl_color_text: '#000000', // Textfarbe
  tpl_color_table_border: '#000000', // Tabellen-Rahmenfarbe
  tpl_color_table_bg: '#fef9e6', // Tabellen-Hintergrundfarbe (USt-Zeile)
  tpl_company_pos: 'top-left', // top-left, top-right
  tpl_customer_pos: 'left', // left, right
  tpl_intro_text: 'Sehr geehrte Damen und Herren,<br><br>vielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!<br>Hiermit stelle ich Ihnen die folgenden Leistungen in Rechnung:',
  tpl_greeting: 'Mit freundlichen Grüßen',
  tpl_bank_details_pos: 'footer', // footer, sidebar, none
  tpl_table_style: 'modern' // modern, classic, minimal
};
let logoData = ''; // Logo wird separat geladen
let rPosC=0, angPosC=0, recPosC=0;

// ─── INIT ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  try {
    data = await window.api.loadData();
    if(!data.angebote) data.angebote=[];
    if(!data.wiederkehrend) data.wiederkehrend=[];
    const s = await window.api.loadSettings();
    if(s && Object.keys(s).length) Object.assign(settings, s);

    // Migration: Logo aus settings in separate Datei verschieben
    if(settings.logo) {
      await window.api.saveLogo(settings.logo);
      delete settings.logo;
      await window.api.saveSettings(settings);
    }

    updateDashboard();
    setTopbarActions('dashboard');
    setupAutoSave();

    // Logo asynchron laden (nicht blockierend)
    setTimeout(async () => {
      try {
        logoData = await window.api.loadLogo();
        updateSidebarLogo();
      } catch(e) {
        console.error('Logo-Fehler:', e);
      }
    }, 100);

    // Einstellungen verzögert laden
    setTimeout(async () => {
      try {
        await ladeSettings();
      } catch(e) {
        console.error('Einstellungen-Fehler:', e);
      }
    }, 500);
  } catch(e) {
    console.error('Init-Fehler:', e);
    alert('Fehler beim Laden der App: ' + e.message);
  }
});

async function save() { await window.api.saveData(data); updateDashboard(); }

// ─── AUTO-SAVE FORMULARDATEN ─────────────────────────────
function saveFormDraft(formId) {
  const drafts = JSON.parse(localStorage.getItem('formDrafts') || '{}');
  const form = document.getElementById(formId);
  if (!form || form.style.display === 'none') return;

  const formData = {};
  form.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.id) formData[el.id] = el.value;
  });

  // Positionen separat speichern
  const posContainer = form.querySelector('[id$="-positionen"]');
  if (posContainer) {
    formData._positions = [];
    posContainer.querySelectorAll('.pos-row').forEach(row => {
      formData._positions.push({
        beschr: row.children[0].value,
        menge: row.children[1].value,
        ep: row.children[2].value
      });
    });
  }

  drafts[formId] = formData;
  localStorage.setItem('formDrafts', JSON.stringify(drafts));
}

function restoreFormDrafts() {
  const drafts = JSON.parse(localStorage.getItem('formDrafts') || '{}');
  window.formDrafts = drafts;
}

function clearFormDraft(formId) {
  const drafts = JSON.parse(localStorage.getItem('formDrafts') || '{}');
  delete drafts[formId];
  localStorage.setItem('formDrafts', JSON.stringify(drafts));
}

function loadFormDraft(formId) {
  const drafts = JSON.parse(localStorage.getItem('formDrafts') || '{}');
  const draft = drafts[formId];
  if (!draft) return false;

  // Normale Felder wiederherstellen
  Object.keys(draft).forEach(key => {
    if (key !== '_positions') {
      const el = document.getElementById(key);
      if (el) el.value = draft[key];
    }
  });

  // Positionen wiederherstellen
  if (draft._positions && draft._positions.length > 0) {
    const posContainer = document.querySelector('#' + formId + ' [id$="-positionen"]');
    if (posContainer) {
      posContainer.innerHTML = '';
      const formType = formId.includes('rechnung') ? 'r' : formId.includes('angebot') ? 'ang' : 'rec';
      const counterVar = formType === 'r' ? 'rPosC' : formType === 'ang' ? 'angPosC' : 'recPosC';
      const calcFn = formType === 'r' ? 'calcR' : formType === 'ang' ? 'calcAng' : 'calcRec';

      draft._positions.forEach(pos => {
        if (formType === 'r') { addRPos(); rPosC--; }
        else if (formType === 'ang') { addAngPos(); angPosC--; }
        else { addRecPos(); recPosC--; }

        const rows = posContainer.querySelectorAll('.pos-row');
        const row = rows[rows.length - 1];
        if (row) {
          row.children[0].value = pos.beschr;
          row.children[1].value = pos.menge;
          row.children[2].value = pos.ep;
        }
      });
      window[calcFn]();
    }
  }

  return true;
}

function setupAutoSave() {
  // DEAKTIVIERT - verursacht Performance-Probleme
  // Auto-Save bei Eingaben in Formularen
  /*
  document.addEventListener('input', (e) => {
    const form = e.target.closest('.form-panel');
    const isSettings = e.target.closest('#sec-einstellungen');
    if (form && form.id && form.style.display !== 'none' && !isSettings) {
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => saveFormDraft(form.id), 2000);
    }
  });
  */
}

// ─── HELPERS ─────────────────────────────────────────────
function fmt(n){ return Number(n).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'; }
function today(){ return new Date().toISOString().split('T')[0]; }
function addDays(d,n){ const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().split('T')[0]; }
function nextDate(from, intervall){
  const d=new Date(from);
  if(intervall==='monatlich') d.setMonth(d.getMonth()+1);
  else if(intervall==='quartalsweise') d.setMonth(d.getMonth()+3);
  else if(intervall==='halbjaehrlich') d.setMonth(d.getMonth()+6);
  else if(intervall==='jaehrlich') d.setFullYear(d.getFullYear()+1);
  return d.toISOString().split('T')[0];
}
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }

// ─── NAVIGATION ──────────────────────────────────────────
function showSection(id, el) {
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('sec-'+id).classList.add('active');
  if(el) el.classList.add('active');
  const titles = {dashboard:'Dashboard',angebote:'Angebote',rechnungen:'Rechnungen',wiederkehrend:'Wiederkehrende Rechnungen',ausgaben:'Ausgaben',erfassen:'Beleg erfassen',kunden:'Kunden',einstellungen:'Einstellungen'};
  document.getElementById('topbar-title').textContent = titles[id]||id;
  setTopbarActions(id);
  if(id==='rechnungen') renderRechnungen();
  if(id==='angebote') renderAngebote();
  if(id==='kunden') renderKunden();
  if(id==='ausgaben') renderAusgaben();
  if(id==='wiederkehrend') renderWiederkehrend();
  if(id==='einstellungen') ladeSettings();
}
function setTopbarActions(id) {
  const el = document.getElementById('topbar-actions');
  const csvBtn = `<button class="btn btn-sm btn-success" onclick="exportCSV()"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> CSV Export</button>`;
  if(id==='dashboard') el.innerHTML=csvBtn;
  else if(id==='rechnungen') el.innerHTML=csvBtn+`<button class="btn btn-sm btn-primary" onclick="showRechnungForm()">+ Neue Rechnung</button>`;
  else if(id==='angebote') el.innerHTML=`<button class="btn btn-sm btn-primary" onclick="showAngebotForm()">+ Neues Angebot</button>`;
  else if(id==='wiederkehrend') el.innerHTML=`<button class="btn btn-sm btn-primary" onclick="showRecurForm()">+ Neue Vorlage</button>`;
  else if(id==='ausgaben') el.innerHTML=csvBtn+`<button class="btn btn-sm btn-primary" onclick="showAusgabeForm()">+ Neue Ausgabe</button>`;
  else if(id==='kunden') el.innerHTML=`<button class="btn btn-sm btn-primary" onclick="showKundeForm()">+ Neuer Kunde</button>`;
  else el.innerHTML='';
}

// ─── DASHBOARD ───────────────────────────────────────────
function updateDashboard() {
  const jahr = new Date().getFullYear().toString();
  const ein = data.rechnungen.filter(r=>r.status==='bezahlt'&&r.datum.startsWith(jahr)).reduce((s,r)=>s+r.gesamt,0);
  const aus = data.ausgaben.filter(a=>a.datum.startsWith(jahr)).reduce((s,a)=>s+a.betrag,0);
  const offen = data.rechnungen.filter(r=>r.status==='offen');
  document.getElementById('m-ein').textContent = fmt(ein);
  document.getElementById('m-aus').textContent = fmt(aus);
  document.getElementById('m-gew').textContent = fmt(ein-aus);
  document.getElementById('m-off').textContent = offen.length;
  document.getElementById('dash-offen').innerHTML = offen.length
    ? offen.map(r=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${r.kunde}</span><span>${fmt(r.gesamt)}</span></div>`).join('')
    : '<div class="empty">Keine offenen Rechnungen</div>';
  const all=[...data.rechnungen.map(r=>({d:r.datum,t:'Rechnung '+r.nr,b:r.gesamt})),...data.ausgaben.map(a=>({d:a.datum,t:a.beschreibung,b:-a.betrag}))].sort((a,b)=>b.d.localeCompare(a.d)).slice(0,6);
  document.getElementById('dash-akt').innerHTML = all.length
    ? all.map(a=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${a.d} · ${a.t}</span><span style="color:${a.b>=0?'var(--success)':'var(--danger)'}">${a.b>=0?'+':''}${fmt(Math.abs(a.b))}</span></div>`).join('')
    : '<div class="empty">Noch keine Einträge</div>';
  const faellig = data.wiederkehrend.filter(r=>r.naechste<=today());
  document.getElementById('dash-recur').innerHTML = faellig.length
    ? faellig.map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><div><div style="font-size:13px;font-weight:500">${r.name}</div><div style="font-size:12px;color:var(--muted)">${r.kunde} · ${fmt(r.gesamt)} · fällig ${r.naechste}</div></div><button class="btn btn-sm btn-primary" onclick="ausfuehrenRecur('${r.id}')">Rechnung erstellen</button></div>`).join('')
    : '<div class="empty">Keine fälligen Rechnungen</div>';
}

// ─── POSITIONS HELPERS ───────────────────────────────────
function makePosRow(container, counter, calcFn) {
  const id='pos-'+counter;
  const div=document.createElement('div');
  div.className='pos-row';div.id=id;
  div.innerHTML=`<input type="text" placeholder="Leistungsbeschreibung" onchange="${calcFn}()"><input type="number" value="1" step="0.5" placeholder="1" onchange="${calcFn}()" style="margin-bottom:0"><input type="number" step="0.01" placeholder="0,00" onchange="${calcFn}()" style="margin-bottom:0"><input type="text" readonly style="background:var(--bg);margin-bottom:0" id="${id}-total"><button class="btn btn-sm btn-danger" onclick="document.getElementById('${id}').remove();${calcFn}()" style="padding:6px 8px">✕</button>`;
  div.querySelector('input:nth-child(2)').addEventListener('input',()=>{ const m=parseFloat(div.children[1].value)||0; const e=parseFloat(div.children[2].value)||0; div.querySelector('#'+id+'-total').value=fmt(m*e); window[calcFn](); });
  div.querySelector('input:nth-child(3)').addEventListener('input',()=>{ const m=parseFloat(div.children[1].value)||0; const e=parseFloat(div.children[2].value)||0; div.querySelector('#'+id+'-total').value=fmt(m*e); window[calcFn](); });
  document.getElementById(container).appendChild(div);
}
function getPositionen(containerId) {
  const pos=[];
  document.querySelectorAll('#'+containerId+' .pos-row').forEach(p=>{
    pos.push({beschr:p.children[0].value, menge:parseFloat(p.children[1].value)||0, ep:parseFloat(p.children[2].value)||0});
  });
  return pos;
}
function calcContainer(containerId, outputId) {
  let g=0;
  document.querySelectorAll('#'+containerId+' .pos-row').forEach(p=>{
    const m=parseFloat(p.children[1].value)||0, e=parseFloat(p.children[2].value)||0;
    g+=m*e;
    const tot=p.querySelector('[id$="-total"]');
    if(tot)tot.value=fmt(m*e);
  });
  if(outputId) document.getElementById(outputId).textContent=fmt(g);
  return g;
}

// ─── RECHNUNGEN ──────────────────────────────────────────
function addRPos(){ makePosRow('r-positionen',rPosC++,'calcR'); }
function calcR(){ calcContainer('r-positionen','r-gesamt'); }
function showRechnungForm(prefill) {
  document.getElementById('rechnung-liste').style.display='none';
  const form=document.getElementById('rechnung-form'); form.style.display='block';

  // Versuche Draft zu laden, falls vorhanden und kein Prefill
  if(!prefill && loadFormDraft('rechnung-form')) {
    updateKundeSelect('r-kunde');
    calcR();
    toast('Entwurf wiederhergestellt');
    return;
  }

  document.getElementById('r-datum').value=today();
  document.getElementById('r-faellig').value=addDays(today(),settings.zahltage||14);
  document.getElementById('r-nr').value=(settings.prefix||'RE')+'-'+new Date().getFullYear()+'-'+String(data.rechnungen.length+1).padStart(3,'0');
  document.getElementById('r-notiz').value=settings.fussnote||'';
  updateKundeSelect('r-kunde');
  document.getElementById('r-positionen').innerHTML=''; rPosC=0;
  if(prefill){
    prefill.positionen.forEach(p=>{ makePosRow('r-positionen',rPosC++,'calcR'); const rows=document.querySelectorAll('#r-positionen .pos-row'); const row=rows[rows.length-1]; row.children[0].value=p.beschr; row.children[1].value=p.menge; row.children[2].value=p.ep; });
    document.getElementById('r-kunde').value=prefill.kundeId||'';
    document.getElementById('r-notiz').value=prefill.notiz||settings.fussnote||'';
  } else { addRPos(); }
  calcR();
}
function hideRechnungForm(){ document.getElementById('rechnung-liste').style.display='block'; document.getElementById('rechnung-form').style.display='none'; }
function speichernRechnung(pdf) {
  const kid=document.getElementById('r-kunde').value;
  const kobj=data.kunden.find(k=>k.id==kid);
  const pos=getPositionen('r-positionen');
  const r={id:Date.now().toString(),nr:document.getElementById('r-nr').value,datum:document.getElementById('r-datum').value,faellig:document.getElementById('r-faellig').value,kundeId:kid,kunde:kobj?kobj.name:'(kein Kunde)',positionen:pos,notiz:document.getElementById('r-notiz').value,gesamt:calcContainer('r-positionen',null),status:'offen'};
  data.rechnungen.push(r); save();
  clearFormDraft('rechnung-form');
  if(pdf) druckeDokument(r,kobj,'Rechnung');
  hideRechnungForm(); renderRechnungen(); toast('Rechnung gespeichert');
}
function renderRechnungen() {
  const tb=document.getElementById('rechnung-tbody');
  if(!data.rechnungen.length){tb.innerHTML='<tr><td colspan="7" class="empty">Noch keine Rechnungen</td></tr>';return}
  tb.innerHTML=data.rechnungen.slice().reverse().map(r=>`<tr>
    <td>${r.nr}</td><td>${r.kunde}</td><td>${r.datum}</td><td>${r.faellig||'—'}</td><td>${fmt(r.gesamt)}</td>
    <td><span class="badge badge-${r.status==='bezahlt'?'success':'warning'}">${r.status==='bezahlt'?'Bezahlt':'Offen'}</span></td>
    <td style="display:flex;gap:4px">
      ${r.status==='offen'?`<button class="btn btn-sm" onclick="markBezahlt('${r.id}')">✓</button>`:''}
      <button class="btn btn-sm" onclick="druckeDokumentById('${r.id}','rechnung')">PDF</button>
      <button class="btn btn-sm btn-danger" onclick="loescheRechnung('${r.id}')">✕</button>
    </td></tr>`).join('');
}
function markBezahlt(id){ const r=data.rechnungen.find(r=>r.id==id); if(r){r.status='bezahlt';save();renderRechnungen();toast('Als bezahlt markiert');} }
function loescheRechnung(id){ if(confirm('Rechnung löschen?')){data.rechnungen=data.rechnungen.filter(r=>r.id!=id);save();renderRechnungen();} }
function druckeDokumentById(id,typ){
  if(typ==='rechnung'){ const r=data.rechnungen.find(x=>x.id==id); const k=data.kunden.find(x=>x.id==r.kundeId); druckeDokument(r,k,'Rechnung'); }
  else { const r=data.angebote.find(x=>x.id==id); const k=data.kunden.find(x=>x.id==r.kundeId); druckeDokument(r,k,'Angebot'); }
}

// ─── ANGEBOTE ────────────────────────────────────────────
function addAngPos(){ makePosRow('ang-positionen',angPosC++,'calcAng'); }
function calcAng(){ calcContainer('ang-positionen','ang-gesamt'); }
function showAngebotForm() {
  document.getElementById('angebot-liste').style.display='none';
  const form=document.getElementById('angebot-form'); form.style.display='block';

  // Versuche Draft zu laden
  if(loadFormDraft('angebot-form')) {
    updateKundeSelect('ang-kunde');
    calcAng();
    toast('Entwurf wiederhergestellt');
    return;
  }

  document.getElementById('ang-datum').value=today();
  const g=new Date(); g.setDate(g.getDate()+30);
  document.getElementById('ang-gueltig').value=g.toISOString().split('T')[0];
  document.getElementById('ang-nr').value=(settings.angprefix||'ANG')+'-'+new Date().getFullYear()+'-'+String(data.angebote.length+1).padStart(3,'0');
  document.getElementById('ang-fussnote').value=settings.angfussnote||'';
  updateKundeSelect('ang-kunde');
  document.getElementById('ang-positionen').innerHTML=''; angPosC=0; addAngPos(); calcAng();
}
function hideAngebotForm(){ document.getElementById('angebot-liste').style.display='block'; document.getElementById('angebot-form').style.display='none'; }
function speichernAngebot(pdf) {
  const kid=document.getElementById('ang-kunde').value;
  const kobj=data.kunden.find(k=>k.id==kid);
  const pos=getPositionen('ang-positionen');
  const a={id:Date.now().toString(),nr:document.getElementById('ang-nr').value,datum:document.getElementById('ang-datum').value,gueltig:document.getElementById('ang-gueltig').value,kundeId:kid,kunde:kobj?kobj.name:'(kein Kunde)',positionen:pos,notiz:document.getElementById('ang-notiz').value,fussnote:document.getElementById('ang-fussnote').value,gesamt:calcContainer('ang-positionen',null),status:'offen'};
  data.angebote.push(a); save();
  clearFormDraft('angebot-form');
  if(pdf) druckeDokument(a,kobj,'Angebot');
  hideAngebotForm(); renderAngebote(); toast('Angebot gespeichert');
}
function renderAngebote() {
  const tb=document.getElementById('angebot-tbody');
  if(!data.angebote.length){tb.innerHTML='<tr><td colspan="7" class="empty">Noch keine Angebote</td></tr>';return}
  tb.innerHTML=data.angebote.slice().reverse().map(a=>`<tr>
    <td>${a.nr}</td><td>${a.kunde}</td><td>${a.datum}</td><td>${a.gueltig||'—'}</td><td>${fmt(a.gesamt)}</td>
    <td><span class="badge badge-${a.status==='angenommen'?'success':a.status==='abgelehnt'?'danger':'neutral'}">${a.status==='angenommen'?'Angenommen':a.status==='abgelehnt'?'Abgelehnt':'Offen'}</span></td>
    <td style="display:flex;gap:4px">
      ${a.status==='offen'?`<button class="btn btn-sm" onclick="angebotZuRechnung('${a.id}')" title="In Rechnung umwandeln">→ RE</button>`:''}
      <button class="btn btn-sm" onclick="druckeDokumentById('${a.id}','angebot')">PDF</button>
      <button class="btn btn-sm btn-danger" onclick="loescheAngebot('${a.id}')">✕</button>
    </td></tr>`).join('');
}
function angebotZuRechnung(id) {
  const a=data.angebote.find(x=>x.id==id);
  if(!a)return;
  a.status='angenommen';
  showSection('rechnungen', document.querySelectorAll('.nav-item')[2]);
  showRechnungForm({positionen:a.positionen, kundeId:a.kundeId, notiz:settings.fussnote});
  toast('Angebot in Rechnung übernommen');
}
function loescheAngebot(id){ if(confirm('Angebot löschen?')){data.angebote=data.angebote.filter(a=>a.id!=id);save();renderAngebote();} }

// ─── WIEDERKEHREND ───────────────────────────────────────
function addRecPos(){ makePosRow('rec-positionen',recPosC++,'calcRec'); }
function calcRec(){ calcContainer('rec-positionen','rec-gesamt'); }
function showRecurForm() {
  document.getElementById('recur-form').style.display='block';
  document.getElementById('rec-naechste').value=today();
  updateKundeSelect('rec-kunde');
  document.getElementById('rec-positionen').innerHTML=''; recPosC=0; addRecPos(); calcRec();
}
function hideRecurForm(){ document.getElementById('recur-form').style.display='none'; }
function speichernRecur() {
  const kid=document.getElementById('rec-kunde').value;
  const kobj=data.kunden.find(k=>k.id==kid);
  const pos=getPositionen('rec-positionen');
  const r={id:Date.now().toString(),name:document.getElementById('rec-name').value||'Unbenannt',kundeId:kid,kunde:kobj?kobj.name:'(kein Kunde)',intervall:document.getElementById('rec-intervall').value,naechste:document.getElementById('rec-naechste').value,zahltage:parseInt(document.getElementById('rec-zahltage').value)||14,positionen:pos,notiz:document.getElementById('rec-notiz').value,gesamt:calcContainer('rec-positionen',null)};
  data.wiederkehrend.push(r); save(); hideRecurForm(); renderWiederkehrend(); toast('Vorlage gespeichert');
}
function renderWiederkehrend() {
  const el=document.getElementById('recur-liste');
  if(!data.wiederkehrend.length){el.innerHTML='<div class="empty">Noch keine wiederkehrenden Rechnungen. Klicke "+ Neue Vorlage".</div>';return}
  el.innerHTML=data.wiederkehrend.map(r=>{
    const faellig=r.naechste<=today();
    return `<div class="recur-card">
      <div class="recur-info">
        <div class="recur-title">${r.name} <span class="badge badge-${faellig?'warning':'neutral'}" style="font-size:11px">${faellig?'Fällig!':r.intervall}</span></div>
        <div class="recur-sub">${r.kunde} · ${fmt(r.gesamt)} · nächste: ${r.naechste} · ${r.intervall}</div>
      </div>
      <div class="recur-actions">
        ${faellig?`<button class="btn btn-sm btn-primary" onclick="ausfuehrenRecur('${r.id}')">Rechnung erstellen</button>`:''}
        <button class="btn btn-sm btn-danger" onclick="loescheRecur('${r.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}
function ausfuehrenRecur(id) {
  const rec=data.wiederkehrend.find(r=>r.id==id); if(!rec)return;
  const kobj=data.kunden.find(k=>k.id==rec.kundeId);
  const nr=(settings.prefix||'RE')+'-'+new Date().getFullYear()+'-'+String(data.rechnungen.length+1).padStart(3,'0');
  const faellig=addDays(today(),rec.zahltage);
  const r={id:Date.now().toString(),nr,datum:today(),faellig,kundeId:rec.kundeId,kunde:rec.kunde,positionen:rec.positionen,notiz:rec.notiz||settings.fussnote||'',gesamt:rec.gesamt,status:'offen'};
  data.rechnungen.push(r);
  rec.naechste=nextDate(rec.naechste,rec.intervall);
  save(); renderWiederkehrend(); updateDashboard();
  if(confirm('Rechnung '+nr+' erstellt. PDF speichern?')) druckeDokument(r,kobj,'Rechnung');
  toast('Rechnung '+nr+' erstellt');
}
function loescheRecur(id){ if(confirm('Vorlage löschen?')){data.wiederkehrend=data.wiederkehrend.filter(r=>r.id!=id);save();renderWiederkehrend();} }

// ─── KUNDEN ──────────────────────────────────────────────
function showKundeForm(kundeId) {
  document.getElementById('kunde-form').style.display='block';
  document.getElementById('k-id').value = '';
  document.getElementById('k-kundennummer').value = '';
  document.getElementById('k-name').value = '';
  document.getElementById('k-kontakt').value = '';
  document.getElementById('k-mail').value = '';
  document.getElementById('k-tel').value = '';
  document.getElementById('k-adresse').value = '';
  document.getElementById('kunde-form-title').textContent = 'Neuer Kunde';

  if(kundeId) {
    const kunde = data.kunden.find(k => k.id === kundeId);
    if(kunde) {
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

function hideKundeForm() {
  document.getElementById('kunde-form').style.display='none';
  document.getElementById('k-id').value = '';
}

function speichernKunde() {
  const kundeId = document.getElementById('k-id').value;
  const name = document.getElementById('k-name').value;
  if(!name) { toast('Bitte Namen eingeben'); return; }

  let kundennummer = document.getElementById('k-kundennummer').value.trim();
  if(!kundennummer) {
    kundennummer = 'K-' + String(data.kunden.length + 1).padStart(3, '0');
  }

  const kundeData = {
    kundennummer: kundennummer,
    name: name,
    kontakt: document.getElementById('k-kontakt').value,
    mail: document.getElementById('k-mail').value,
    tel: document.getElementById('k-tel').value,
    adresse: document.getElementById('k-adresse').value
  };

  if(kundeId) {
    const idx = data.kunden.findIndex(k => k.id === kundeId);
    if(idx !== -1) {
      data.kunden[idx] = { ...data.kunden[idx], ...kundeData };
      toast('Kunde aktualisiert');
    }
  } else {
    data.kunden.push({ id: Date.now().toString(), ...kundeData });
    toast('Kunde gespeichert');
  }
  save(); hideKundeForm(); renderKunden();
}

function renderKunden() {
  const tb=document.getElementById('kunden-tbody');
  if(!data.kunden.length){tb.innerHTML='<tr><td colspan="6" class="empty">Noch keine Kunden</td></tr>';return}
  tb.innerHTML=data.kunden.map(k=>`<tr>
    <td><strong>${k.kundennummer||'—'}</strong></td>
    <td><strong>${k.name}</strong>${k.kontakt?`<br><span style="font-size:11px;color:var(--muted)">${k.kontakt}</span>`:''}</td>
    <td>${k.mail||'—'}</td>
    <td>${k.tel||'—'}</td>
    <td>${data.rechnungen.filter(r=>r.kundeId==k.id).length}</td>
    <td style="display:flex;gap:4px">
      <button class="btn btn-sm" onclick="showKundeForm('${k.id}')" title="Bearbeiten">✎</button>
      <button class="btn btn-sm btn-danger" onclick="loescheKunde('${k.id}')">✕</button>
    </td>
  </tr>`).join('');
}

// ─── AUSGABEN ────────────────────────────────────────────
function showAusgabeForm(){ document.getElementById('ausgabe-form').style.display='block'; document.getElementById('a-datum').value=today(); document.getElementById('a-betrag').value=''; document.getElementById('a-beschr').value=''; }
function speichernAusgabe() {
  const a={id:Date.now().toString(),datum:document.getElementById('a-datum').value,betrag:parseFloat(document.getElementById('a-betrag').value)||0,kategorie:document.getElementById('a-kat').value,beschreibung:document.getElementById('a-beschr').value};
  data.ausgaben.push(a); save(); document.getElementById('ausgabe-form').style.display='none'; renderAusgaben(); toast('Ausgabe gespeichert');
}
function renderAusgaben() {
  const tb=document.getElementById('ausgaben-tbody');
  if(!data.ausgaben.length){tb.innerHTML='<tr><td colspan="5" class="empty">Noch keine Ausgaben</td></tr>';return}
  tb.innerHTML=data.ausgaben.slice().reverse().map(a=>`<tr>
    <td>${a.datum}</td><td>${a.beschreibung}</td>
    <td><span class="badge badge-neutral">${a.kategorie}</span></td>
    <td>${fmt(a.betrag)}</td>
    <td><button class="btn btn-sm btn-danger" onclick="loescheAusgabe('${a.id}')">✕</button></td>
  </tr>`).join('');
}
function loescheAusgabe(id){ if(confirm('Ausgabe löschen?')){data.ausgaben=data.ausgaben.filter(a=>a.id!=id);save();renderAusgaben();} }

// ─── KI BELEG ERFASSEN ───────────────────────────────────
async function handleUpload(input) {
  if(!input.files.length) return;
  const file=input.files[0];
  const statusEl=document.getElementById('ai-status');
  statusEl.style.display='block';
  statusEl.innerHTML='<div class="spinner" style="margin-right:8px;display:inline-block"></div> KI liest den Beleg aus…';
  document.getElementById('ocr-result').style.display='none';
  try {
    const base64=await toBase64(file);
    const isImg=file.type.startsWith('image/');
    const isPDF=file.type==='application/pdf';
    let msgContent=[];
    const prompt='Extrahiere aus diesem Beleg: 1) Datum (Format YYYY-MM-DD), 2) Gesamtbetrag in Euro (nur Zahl), 3) Kurze Beschreibung (max 50 Zeichen), 4) Kategorie aus: Büromaterial, Software/IT, Fahrtkosten, Telefon/Internet, Weiterbildung, Werbung, Sonstiges. Antworte NUR mit JSON: {"datum":"...","betrag":0.00,"beschreibung":"...","kategorie":"..."}';
    if(isImg) msgContent=[{type:'image',source:{type:'base64',media_type:file.type,data:base64}},{type:'text',text:prompt}];
    else if(isPDF) msgContent=[{type:'document',source:{type:'base64',media_type:'application/pdf',data:base64}},{type:'text',text:prompt}];
    else throw new Error('Format nicht unterstützt');
    const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:200,messages:[{role:'user',content:msgContent}]})});
    const result=await resp.json();
    const text=result.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim();
    const parsed=JSON.parse(text);
    document.getElementById('ocr-datum').value=parsed.datum||today();
    document.getElementById('ocr-betrag').value=parsed.betrag||'';
    document.getElementById('ocr-beschr').value=parsed.beschreibung||'';
    const katSel=document.getElementById('ocr-kat');
    for(let i=0;i<katSel.options.length;i++){if(katSel.options[i].value===parsed.kategorie){katSel.selectedIndex=i;break;}}
    statusEl.style.display='none';
    document.getElementById('ocr-result').style.display='block';
  } catch(e) {
    statusEl.innerHTML='KI-Erkennung fehlgeschlagen – bitte manuell ausfüllen.';
    document.getElementById('ocr-result').style.display='block';
    document.getElementById('ocr-datum').value=today();
  }
}
function toBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file);})}
function ausgabeAusOCR() {
  const a={id:Date.now().toString(),datum:document.getElementById('ocr-datum').value,betrag:parseFloat(document.getElementById('ocr-betrag').value)||0,kategorie:document.getElementById('ocr-kat').value,beschreibung:document.getElementById('ocr-beschr').value||'Beleg'};
  data.ausgaben.push(a); save(); resetUpload();
  showSection('ausgaben',document.querySelectorAll('.nav-item')[5]); toast('Ausgabe übernommen');
}
function resetUpload(){
  document.getElementById('file-input').value='';
  document.getElementById('ocr-result').style.display='none';
  document.getElementById('ai-status').style.display='none';
}

// ─── EINSTELLUNGEN ───────────────────────────────────────
async function speichernSettings() {
  ['name','beruf','adresse','tel','mail','web','steuernr','bank','kontoinhaber','iban','bic','fussnote','angfussnote','prefix','angprefix'].forEach(k=>{const el=document.getElementById('s-'+k);if(el)settings[k]=el.value;});
  settings.zahltage=parseInt(document.getElementById('s-zahltage').value)||14;

  // Template-Einstellungen speichern
  settings.tpl_logo_pos_v = document.getElementById('s-tpl-logo-pos-v').value;
  settings.tpl_logo_pos_h = document.getElementById('s-tpl-logo-pos-h').value;
  settings.tpl_logo_size = document.getElementById('s-tpl-logo-size').value;
  settings.tpl_color_highlight = document.getElementById('s-tpl-color-highlight').value;
  settings.tpl_color_text = document.getElementById('s-tpl-color-text').value;
  settings.tpl_color_table_border = document.getElementById('s-tpl-color-table-border').value;
  settings.tpl_color_table_bg = document.getElementById('s-tpl-color-table-bg').value;
  settings.tpl_table_style = document.getElementById('s-tpl-table-style').value;
  settings.tpl_company_pos = document.getElementById('s-tpl-company-pos').value;
  settings.tpl_customer_pos = document.getElementById('s-tpl-customer-pos').value;
  settings.tpl_bank_details_pos = document.getElementById('s-tpl-bank-details-pos').value;
  settings.tpl_intro_text = document.getElementById('s-tpl-intro-text').value;
  settings.tpl_greeting = document.getElementById('s-tpl-greeting').value;

  await window.api.saveSettings(settings);
  const c=document.getElementById('s-confirm');c.style.display='block';setTimeout(()=>c.style.display='none',2500);
  toast('Einstellungen gespeichert');
}
async function ladeSettings() {
  ['name','beruf','adresse','tel','mail','web','steuernr','bank','kontoinhaber','iban','bic','fussnote','angfussnote','prefix','angprefix'].forEach(k=>{const el=document.getElementById('s-'+k);if(el&&settings[k]!==undefined)el.value=settings[k];});
  if(settings.zahltage) document.getElementById('s-zahltage').value=settings.zahltage;

  // Template-Einstellungen laden
  if(settings.tpl_logo_pos_v) document.getElementById('s-tpl-logo-pos-v').value = settings.tpl_logo_pos_v;
  if(settings.tpl_logo_pos_h) document.getElementById('s-tpl-logo-pos-h').value = settings.tpl_logo_pos_h;
  if(settings.tpl_logo_size) document.getElementById('s-tpl-logo-size').value = settings.tpl_logo_size;
  if(settings.tpl_color_highlight) document.getElementById('s-tpl-color-highlight').value = settings.tpl_color_highlight;
  if(settings.tpl_color_text) document.getElementById('s-tpl-color-text').value = settings.tpl_color_text;
  if(settings.tpl_color_table_border) document.getElementById('s-tpl-color-table-border').value = settings.tpl_color_table_border;
  if(settings.tpl_color_table_bg) document.getElementById('s-tpl-color-table-bg').value = settings.tpl_color_table_bg;
  if(settings.tpl_table_style) document.getElementById('s-tpl-table-style').value = settings.tpl_table_style;
  if(settings.tpl_company_pos) document.getElementById('s-tpl-company-pos').value = settings.tpl_company_pos;
  if(settings.tpl_customer_pos) document.getElementById('s-tpl-customer-pos').value = settings.tpl_customer_pos;
  if(settings.tpl_bank_details_pos) document.getElementById('s-tpl-bank-details-pos').value = settings.tpl_bank_details_pos;
  if(settings.tpl_intro_text) document.getElementById('s-tpl-intro-text').value = settings.tpl_intro_text;
  if(settings.tpl_greeting) document.getElementById('s-tpl-greeting').value = settings.tpl_greeting;

  // Logo aus separater Datei laden
  if (!logoData) {
    logoData = await window.api.loadLogo();
  }
  if(logoData) {
    document.getElementById('logo-preview-img').src = logoData;
    document.getElementById('logo-preview').style.display = 'block';
    document.getElementById('btn-logo-delete').style.display = 'inline-flex';
  }
}

// ─── LOGO VERWALTUNG ─────────────────────────────────────
async function handleLogoUpload(input) {
  if(!input.files.length) return;
  const file = input.files[0];

  // Größen-Check (max 5MB)
  if(file.size > 5000000) {
    toast('Logo zu groß! Maximal 5MB erlaubt.');
    input.value = '';
    return;
  }

  const base64 = await toBase64(file);
  const dataUrl = `data:${file.type};base64,${base64}`;

  // Logo separat speichern, NICHT in settings
  logoData = dataUrl;
  await window.api.saveLogo(dataUrl);

  document.getElementById('logo-preview-img').src = dataUrl;
  document.getElementById('logo-preview').style.display = 'block';
  document.getElementById('btn-logo-delete').style.display = 'inline-flex';

  updateSidebarLogo();
  toast('Logo hochgeladen');
}

function updateSidebarLogo() {
  const logoImg = document.getElementById('sidebar-logo-img');
  const logoText = document.getElementById('sidebar-logo-text');

  if(logoData) {
    logoImg.src = logoData;
    logoImg.style.display = 'block';
    logoText.style.display = 'none';
  } else {
    logoImg.style.display = 'none';
    logoText.style.display = 'block';
  }
}

async function loescheLogo() {
  if(!confirm('Logo wirklich entfernen?')) return;

  logoData = '';
  await window.api.saveLogo('');

  document.getElementById('logo-preview').style.display = 'none';
  document.getElementById('btn-logo-delete').style.display = 'none';
  document.getElementById('logo-upload').value = '';

  updateSidebarLogo();
  toast('Logo entfernt');
}

// ─── VORSCHAU ────────────────────────────────────────────
function vorschauTemplate() {
  // Beispiel-Daten für Vorschau
  const beispielDoc = {
    nr: 'RE-2024-001',
    datum: new Date().toISOString().split('T')[0],
    faellig: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
    kundeId: '1',
    kunde: 'Musterfirma GmbH',
    positionen: [
      {beschr: 'Beratungsleistung', menge: 5, ep: 120},
      {beschr: 'Softwareentwicklung', menge: 10, ep: 85},
      {beschr: 'Hosting & Support', menge: 1, ep: 50}
    ],
    gesamt: 1450,
    status: 'offen'
  };

  const beispielKunde = {
    id: '1',
    name: 'Musterfirma GmbH',
    kontakt: 'Max Mustermann',
    adresse: 'Musterstraße 123\n12345 Musterstadt',
    mail: 'info@musterfirma.de',
    tel: '0123 456789'
  };

  druckeDokument(beispielDoc, beispielKunde, 'Rechnung');
  toast('Vorschau wird generiert...');
}

// ─── PDF ─────────────────────────────────────────────────
function druckeDokument(doc, kunde, typ) {
  const s=settings;
  const istAngebot=typ==='Angebot';

  // Datumsformatierung (YYYY-MM-DD zu DD.MM.YYYY)
  function formatDatum(d) {
    if(!d) return '—';
    const parts = d.split('-');
    if(parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return d;
  }

  const datumFormatiert = formatDatum(doc.datum);
  const faelligFormatiert = formatDatum(doc.faellig);
  const lieferdatum = formatDatum(doc.datum);

  // Kundennummer aus Kundenstamm
  const kundennummer = kunde ? (kunde.kundennummer || '—') : '—';

  // Positionstabelle
  const pos=doc.positionen.map((p,i)=>`<tr>
    <td style="padding:10px 8px;border-bottom:1px solid #e0e0e0">${i+1}.</td>
    <td style="padding:10px 8px;border-bottom:1px solid #e0e0e0">${p.beschr}</td>
    <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #e0e0e0">${Number(p.menge).toFixed(2).replace('.',',')} Stk</td>
    <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #e0e0e0">${Number(p.ep).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} EUR</td>
    <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #e0e0e0">${Number(p.menge*p.ep).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} EUR</td>
  </tr>`).join('');

  const tplLogoSize = s.tpl_logo_size || '140';
  const tplGreeting = s.tpl_greeting || 'Mit freundlichen Grüßen';
  const tplColorTableBg = s.tpl_color_table_bg || '#f5f5f5';
  const tplIntroText = s.tpl_intro_text || 'Sehr geehrte Damen und Herren,<br><br>vielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!<br>Hiermit stelle ich Ihnen die folgenden Leistungen in Rechnung:';

  const logoImg = logoData ? '<img src="' + logoData + '" style="max-width:' + tplLogoSize + 'px;max-height:80px;object-fit:contain">' : '';

  // Adressen formatieren
  const kundeAdresse = kunde ? (kunde.adresse || '').split('\n') : [];
  const firmaAdresse = (s.adresse || '').split('\n');

  const html=`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>${typ} ${doc.nr}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#333;padding:40px 50px;background:#fff;line-height:1.5}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
    .absender-zeile{font-size:8px;color:#666;border-bottom:1px solid #ccc;padding-bottom:3px}
    .logo-container{text-align:right}
    .info-container{display:flex;justify-content:space-between;margin:20px 0}
    .kunde-adresse{width:50%}
    .rechnungs-info{width:45%;font-size:9px}
    .rechnungs-info table{width:100%}
    .rechnungs-info td{padding:4px 0;vertical-align:top}
    .rechnungs-info td:first-child{color:#666;width:55%;text-transform:uppercase;font-size:8px}
    .rechnungs-info td:last-child{text-align:right;color:#0066cc;font-weight:500}
    .datum-zeile{text-align:right;margin:30px 0 40px 0}
    .intro{font-size:10px;line-height:1.6;margin-bottom:25px}
    table.positionen{width:100%;border-collapse:collapse}
    table.positionen th{background:${tplColorTableBg};padding:10px 8px;font-size:9px;font-weight:600;text-align:left;border-bottom:1px solid #ccc}
    table.positionen th.right{text-align:right}
    .summen-block table{width:100%;border-collapse:collapse}
    .summen-block td{padding:8px;font-size:10px}
    .summen-block .netto-row td,.summen-block .brutto-row td{background:${tplColorTableBg}}
    .summen-block .brutto-row td{font-weight:600}
    .summen-block .ust-row td{font-size:9px;color:#666}
    .zahlungsinfo{margin-top:30px;font-size:10px;line-height:1.7}
    .gruss{margin-top:25px;font-size:10px}
    .page-number{position:fixed;bottom:20px;right:50px;font-size:8px;color:#999}
  </style></head><body>

  <div class="header">
    <div class="absender-zeile">${s.name||'Firmenname'} / ${firmaAdresse[0]||''} / ${firmaAdresse[1]||''}</div>
    <div class="logo-container">${logoImg}</div>
  </div>

  <div class="info-container">
    <div class="kunde-adresse">
      <div>${kunde?kunde.name:doc.kunde}</div>
      <div>${kundeAdresse[0]||''}</div>
      <div>${kundeAdresse[1]||''}</div>
      <div>Deutschland</div>
    </div>
    <div class="rechnungs-info">
      <table>
        <tr><td>${istAngebot?'Angebots-Nr.':'Rechnungs-Nr.'}</td><td>${doc.nr}</td></tr>
        <tr><td>${istAngebot?'Angebotsdatum':'Rechnungsdatum'}</td><td>${datumFormatiert}</td></tr>
        <tr><td>${istAngebot?'Gültig bis':'Lieferdatum'}</td><td>${istAngebot?formatDatum(doc.gueltig):lieferdatum}</td></tr>
        <tr><td>Ihre Kundennummer</td><td>${kundennummer}</td></tr>
        <tr><td>Ihr Ansprechpartner</td><td>${s.name||''}${s.mail?'<br>'+s.mail:''}</td></tr>
      </table>
    </div>
  </div>

  <div class="datum-zeile">${datumFormatiert}</div>

  <div class="intro">${tplIntroText}</div>

  <table class="positionen">
    <thead><tr>
      <th style="width:30px"></th>
      <th>Beschreibung</th>
      <th class="right" style="width:80px">Menge</th>
      <th class="right" style="width:100px">Einzelpreis</th>
      <th class="right" style="width:100px">Gesamtpreis</th>
    </tr></thead>
    <tbody>${pos}</tbody>
  </table>

  <div class="summen-block"><table>
    <tr class="netto-row"><td>Gesamtbetrag netto</td><td style="text-align:right">${Number(doc.gesamt).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} EUR</td></tr>
    <tr class="ust-row"><td colspan="2">Umsatzsteuer nicht erhoben gemäß §19UStG.</td></tr>
    <tr class="brutto-row"><td>Gesamtbetrag brutto</td><td style="text-align:right">${Number(doc.gesamt).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} EUR</td></tr>
  </table></div>

  <div class="zahlungsinfo">
    ${!istAngebot && s.iban ? `<p><strong>Zahlungsbedingungen:</strong> Zahlung innerhalb von ${s.zahltage||14} Tagen ab Rechnungseingang ohne Abzüge.</p>
    <p>Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer auf das unten angegebene Konto.<br>Der Rechnungsbetrag ist bis zum ${faelligFormatiert} fällig.</p>` : ''}
  </div>

  <div class="gruss">${tplGreeting}<br>${s.name||''} ${s.mail||''}</div>

  ${!istAngebot && s.iban ? `<div style="margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:9px;color:#666">
    <strong>Bankverbindung:</strong> ${s.bank||''} | IBAN: ${s.iban} ${s.bic?'| BIC: '+s.bic:''} | Kontoinhaber: ${s.kontoinhaber||s.name}
  </div>` : ''}

  <div class="page-number">1/1</div>
  </body></html>`;

  window.api.printPDF(html, `${typ}_${doc.nr.replace(/[^a-zA-Z0-9-]/g,'_')}.pdf`);
}

// ─── CSV EXPORT ──────────────────────────────────────────
async function exportCSV() {
  let csv='Typ;Datum;Beschreibung;Kategorie;Betrag (€);Status;Kunde\n';
  data.rechnungen.forEach(r=>{csv+=`Einnahme;${r.datum};Rechnung ${r.nr};;${r.gesamt.toFixed(2).replace('.',',')};${r.status==='bezahlt'?'Bezahlt':'Offen'};${r.kunde}\n`});
  data.angebote.forEach(a=>{csv+=`Angebot;${a.datum};Angebot ${a.nr};;${a.gesamt.toFixed(2).replace('.',',')};${a.status};${a.kunde}\n`});
  data.ausgaben.forEach(a=>{csv+=`Ausgabe;${a.datum};${a.beschreibung};${a.kategorie};-${a.betrag.toFixed(2).replace('.',',')};;;\n`});
  const ein=data.rechnungen.filter(r=>r.status==='bezahlt').reduce((s,r)=>s+r.gesamt,0);
  const aus=data.ausgaben.reduce((s,a)=>s+a.betrag,0);
  csv+=`\n;;Einnahmen gesamt (bezahlt);;${ein.toFixed(2).replace('.',',')};;`;
  csv+=`\n;;Ausgaben gesamt;;-${aus.toFixed(2).replace('.',',')};;`;
  csv+=`\n;;Gewinn/Verlust;;${(ein-aus).toFixed(2).replace('.',',')};;`;
  const ok=await window.api.exportCSV(csv, `buchhaltung_${settings.name||'export'}_${new Date().getFullYear()}.csv`);
  if(ok) toast('CSV gespeichert');
}
