'use strict';
const {calculate, ITEMS, signalFor, airwaySummary}=window.AnesClinical;
const cardioQuestions=[
['ihd','Cardiopatía isquémica','RCRI · antecedente documentado'],
['chf','Insuficiencia cardíaca','RCRI'],
['cva','Enfermedad cerebrovascular / AIT','RCRI'],
['insulin','Diabetes tratada con insulina','RCRI'],
['recentMi','Infarto de miocardio en últimos 6 meses','Goldman'],
['jvdS3','Ingurgitación yugular o tercer ruido (S3)','Goldman'],
['pvc','Más de 5 extrasístoles ventriculares por minuto','Goldman'],
['rhythm','Ritmo no sinusal o extrasístoles auriculares en ECG','Goldman'],
['aorticStenosis','Estenosis aórtica significativa','Goldman'],
['poorGeneral','Condición médica general deteriorada','Goldman · revisar criterios originales']
];
const stopQuestions=[
['snore','Ronquido intenso','STOP-BANG y Langeron'],
['tired','Cansancio o somnolencia diurna','STOP-BANG'],
['observed','Apneas observadas','STOP-BANG'],
['hypertension','Hipertensión arterial','STOP-BANG']
];
const icuQuestions=[
['osa','SAOS diagnosticado','MACOCHA: +2'],
['cervReduced','Movilidad cervical reducida','MACOCHA: +1'],
['coma','Coma','MACOCHA: +1'],
['hypox','Hipoxemia grave (SpO₂ <80%)','MACOCHA: +1'],
['nonAnest','Operador previsto no anestesiólogo','MACOCHA: +1']
];
const edQuestions=[
['leonExternal','Aspecto anatómico externo desfavorable','LEON · L'],
['leonMouth','Regla de 3 dedos: apertura insuficiente','LEON · E'],
['leonHyoid','Regla de 3 dedos: distancia mentón-hioides corta','LEON · E'],
['leonThyroid','Regla de 2 dedos: distancia hioides-tiroides corta','LEON · E'],
['leonObstruction','Obstrucción de vía aérea presente','LEON · O'],
['leonNeck','Limitación de movilidad cervical','LEON · N']
];
function questions(id,items){document.getElementById(id).innerHTML=items.map(([name,title,sub])=>
`<div class="q-row"><div class="q-label">${title}<small>${sub}</small></div><div class="choice"><label><input type="radio" name="${name}" value="yes"><span>Sí</span></label><label><input type="radio" name="${name}" value="no"><span>No</span></label></div></div>`).join('')}
questions('cardioQuestions',cardioQuestions);
questions('stopQuestions',stopQuestions);
questions('icuQuestions',icuQuestions);
questions('edQuestions',edQuestions);
const form=document.getElementById('form');
let groupFilter='all';
function data(){const fd=new FormData(form);return Object.fromEntries(fd.entries())}
function itemsFor(d){return ITEMS.filter(item=>!item.context||item.context===(d.context||'or'))}
function setText(id,value){document.getElementById(id).textContent=value}
function render(){
const d=data(),scores=calculate(d),items=itemsFor(d),completed=items.filter(item=>scores[item.id].value!==null).length;
setText('progressCount',`${completed} / ${items.length}`);
document.getElementById('progressBar').style.width=`${items.length?completed/items.length*100:0}%`;
setText('navReady',completed);
const mini=items.filter(item=>item.group!=='critical');
document.getElementById('miniScores').innerHTML=mini.map(item=>{
const s=scores[item.id],ok=s.value!==null,display=ok?String(s.value)+(s.unit||''):`Faltan ${s.missing.length}`,sig=signalFor(item.id,s);
return `<div class="mini-row"><div><div class="mini-title">${item.title}</div><div class="mini-sub">${item.category}</div></div><div class="mini-value ${ok?'':'pending'}"><span class="mini-signal signal-${sig.tone}" aria-label="${sig.text}"></span>${display}</div></div>`;
}).join('');
const visible=items.filter(item=>groupFilter==='all'||item.group===groupFilter);
document.getElementById('resultsGrid').innerHTML=visible.map(item=>{
const x=scores[item.id],ready=x.value!==null,cardClass=ready?'is-ready':'is-pending',sig=signalFor(item.id,x);
return `<article class="score-card ${cardClass} tone-${sig.tone}"><div class="score-inner"><div class="score-top"><span class="score-category">${item.category}</span><span class="status signal signal-${sig.tone}"><i class="signal-dot" aria-hidden="true"></i>${sig.text}</span></div><h2>${item.title}</h2><div class="score-description">${item.short}</div>
${ready?`<div class="score-value"><strong>${x.value}</strong><span>${x.unit||''}</span></div><div class="score-interpretation">${x.label}</div>`:
`<div class="score-wait">${x.missing.length} ${x.missing.length===1?'dato pendiente':'datos pendientes'}</div><div class="missing-list">${x.missing.map(t=>`<span>${t}</span>`).join('')}</div>`}
<div class="score-details">${x.details}</div></div></article>`}).join('') || '<p class="empty-state">No hay escalas de este grupo para el entorno seleccionado.</p>';
const overall=airwaySummary(scores,d);
const panel=document.getElementById('airwayOverall');
const safeText=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
panel.className=`airway-overall tone-${overall.tone}`;
panel.innerHTML=`<div class="airway-kicker"><span>CONCLUSIÓN ORIENTATIVA · VÍA AÉREA</span><span class="status signal signal-${overall.tone}"><i class="signal-dot" aria-hidden="true"></i>${{danger:'ALERTA',warning:'PRECAUCIÓN',safe:'SIN SEÑALES',pending:'INCOMPLETO'}[overall.tone]}</span></div>
<h2>${overall.title}</h2><div class="airway-answer">${overall.answer}</div><p>${overall.description}</p>
<div class="airway-domain"><div><span>Intubación</span><strong class="signal-text signal-${overall.intubation.tone}"><i class="signal-dot" aria-hidden="true"></i>${overall.intubation.label}</strong></div><div><span>Ventilación con mascarilla</span><strong class="signal-text signal-${overall.mask.tone}"><i class="signal-dot" aria-hidden="true"></i>${overall.mask.label}</strong></div></div>
${overall.reasons.length?`<div class="airway-findings"><b>Hallazgos relevantes</b><ul>${overall.reasons.slice(0,4).map(t=>`<li>${safeText(t)}</li>`).join('')}</ul>${overall.reasons.length>4?`<small>+${overall.reasons.length-4} hallazgos adicionales en las escalas.</small>`:''}</div>`:''}
<div class="airway-disclaimer">Síntesis clínica orientativa, no es una escala validada ni un diagnóstico. Un semáforo verde no garantiza intubación o ventilación fáciles.</div>`;
for(const button of document.querySelectorAll('.filter-btn'))button.classList.toggle('active',button.dataset.group===groupFilter);
return {scores,items,context:d.context||'or'};
}
function switchSection(section){document.querySelectorAll('.form-section').forEach(el=>el.classList.toggle('active',el.id==='section-'+section));document.querySelectorAll('.step').forEach(el=>el.classList.toggle('active',el.dataset.section===section));window.scrollTo({top:0,behavior:'smooth'});}
function switchPage(page){document.querySelectorAll('.page').forEach(el=>el.classList.toggle('visible',el.id==='page-'+page));document.querySelectorAll('[data-target]').forEach(el=>el.classList.toggle(el.classList.contains('mobile-nav')?'selected':'active',el.dataset.target===page));setText('crumb',{patient:'CAPTURA',scores:'RESULTADOS',about:'METODOLOGÍA'}[page]);render();window.scrollTo({top:0,behavior:'smooth'});}
function toggleContext(){const v=document.getElementById('contextSelect').value;document.getElementById('context-icu').hidden=v!=='icu';document.getElementById('context-ed').hidden=v!=='ed';render();}
document.querySelectorAll('[data-target]').forEach(btn=>btn.addEventListener('click',()=>switchPage(btn.dataset.target)));
document.querySelectorAll('[data-section]').forEach(btn=>btn.addEventListener('click',()=>switchSection(btn.dataset.section)));
document.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',()=>switchSection(btn.dataset.next)));
for(const id of ['showResults','summaryResults'])document.getElementById(id).addEventListener('click',()=>switchPage('scores'));
for(const b of document.querySelectorAll('.filter-btn'))b.addEventListener('click',()=>{groupFilter=b.dataset.group;render()});
form.addEventListener('input',render);
form.addEventListener('change',()=>{toggleContext();render()});
form.addEventListener('submit',e=>e.preventDefault());
let toastTimer;
function toast(t){const n=document.getElementById('toast');n.textContent=t;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),3000)}
document.getElementById('reset').addEventListener('click',()=>{if(confirm('¿Borrar los datos de esta evaluación?')){form.reset();groupFilter='all';switchPage('patient');switchSection('general');toggleContext();toast('Evaluación reiniciada')}});
document.getElementById('copyResults').addEventListener('click',async()=>{
const {scores,items,context}=render();
const overall=airwaySummary(scores,data());
const lines=['ANESCORE · RESUMEN DE ÍNDICES',`Entorno: ${{or:'Quirófano',icu:'UCI',ed:'Urgencias'}[context]}`,'',`VÍA AÉREA (ORIENTATIVO, NO VALIDADO): ${overall.answer}`,`Intubación: ${overall.intubation.label}`,`Ventilación con mascarilla: ${overall.mask.label}`,...overall.reasons.map(r=>`• ${r}`),'',...items.map(({id,title})=>{const x=scores[id];const sig=signalFor(id,x);return `${title}: ${x.value===null?'PENDIENTE ('+x.missing.join('; ')+')':x.value+(x.unit||'')+' — '+x.label} [${sig.text}]`}), '', 'Síntesis por semáforos no validada; verificar población, fórmulas y resultados antes de uso asistencial.'];
const text=lines.join('\n');
try{await navigator.clipboard.writeText(text);toast('Resumen copiado')}catch{const node=document.createElement('textarea');node.value=text;document.body.append(node);node.select();const ok=document.execCommand('copy');node.remove();toast(ok?'Resumen copiado':'No fue posible copiar')}
});
document.getElementById('printResults').addEventListener('click',()=>window.print());
toggleContext();
if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
