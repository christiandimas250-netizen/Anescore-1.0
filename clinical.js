/* AnesScore calculation engine. Inputs are untrusted strings; unanswered values remain unknown.
   NOT VALIDATED FOR CLINICAL USE. The originating study population matters for every score. */
(function(root){'use strict';
const has=v=>v!==undefined&&v!==null&&v!=='';
const yes=v=>v==='yes';
const num=(d,k,min,max)=>{if(!has(d[k]))return null;const v=Number(d[k]);return Number.isFinite(v)&&v>=min&&v<=max?v:null};
const missing=(items)=>items.filter(x=>!x[0]).map(x=>x[1]);
const result=(value,requirements,label,details='',unit='',meta={})=>({value:requirements.length?null:value,missing:requirements,label:requirements.length?'':label,details,unit,...meta});
function calculate(d){
const age=num(d,'age',18,120),weight=num(d,'weight',1,400),height=num(d,'height',50,250),cr=num(d,'creatinine',0,30),mouth=num(d,'mouth',0,12),tmd=num(d,'thyro',0,25),neck=num(d,'neckMove',0,180),nc=num(d,'neckCirc',10,100),smd=num(d,'sternomental',0,35),tmht=num(d,'tmht',0,15);
const bmi=weight!==null&&height!==null?weight/(height/100)**2:null;
const mm=has(d.mallampati)?Number(d.mallampati):null;
const block={};
const asaMissing=missing([[has(d.asa),'Clasificación ASA'],[has(d.asaE),'Modificador E']]);
block.asa=result(asaMissing.length?null:'ASA '+['','I','II','III','IV','V','VI'][Number(d.asa)]+(d.asaE==='yes'?' E':''),asaMissing,'Clasificación clínica registrada','ASA-PS describe estado físico; no equivale a riesgo quirúrgico individual. No se asigna automáticamente.');
const rMissing=missing([[has(d.ihd),'Cardiopatía isquémica'],[has(d.chf),'Insuficiencia cardíaca'],[has(d.cva),'EVC/AIT'],[has(d.insulin),'Diabetes con insulina'],[cr!==null,'Creatinina'],[has(d.highSurgery),'Tipo de cirugía para RCRI']]);
const rcri=[d.ihd,d.chf,d.cva,d.insulin,d.highSurgery].filter(yes).length+Number(cr!==null&&cr>2.0);
block.rcri=result(rcri,rMissing,rcri===0?'Sin factores RCRI':`${rcri} factor${rcri===1?'':'es'} de riesgo`,'No convertir el puntaje en una probabilidad porcentual individual sin especificar cohorte y desenlace.','/6');
const gMissing=missing([[age!==null,'Edad'],[has(d.recentMi),'Infarto reciente'],[has(d.jvdS3),'Ingurgitación yugular / S3'],[has(d.pvc),'Extrasístoles ventriculares'],[has(d.rhythm),'Ritmo / ECG'],[has(d.aorticStenosis),'Estenosis aórtica'],[has(d.poorGeneral),'Condición médica general'],[has(d.goldmanSurgery),'Tipo de cirugía Goldman'],[has(d.emergency),'Cirugía urgente']]);
const gold=Number(age!==null&&age>70)*5+Number(yes(d.recentMi))*10+Number(yes(d.jvdS3))*11+Number(yes(d.pvc))*7+Number(yes(d.rhythm))*7+Number(yes(d.aorticStenosis))*3+Number(yes(d.poorGeneral))*3+Number(yes(d.goldmanSurgery))*3+Number(yes(d.emergency))*4;
block.gold=result(gold,gMissing,`Clase ${gold<=5?'I':gold<=12?'II':gold<=25?'III':'IV'}`,'Índice Goldman original (1977). La condición médica general incluye alteraciones relevantes o encamamiento; valorar criterios de la fuente.','/53');
const eMissing=missing([[mouth!==null,'Apertura interincisiva'],[tmd!==null,'Distancia tiromentoniana'],[mm!==null,'Mallampati'],[neck!==null,'Movilidad cervicofacial'],[has(d.prognath),'Prognatismo'],[weight!==null,'Peso'],[has(d.intubHx),'Intubación difícil previa']]);
const sharedE=(mouth<4?1:0)+(tmd>6.5?0:tmd>=6?1:2)+(mm===1?0:mm===2?1:2)+(neck>90?0:neck>=80?1:2)+(d.prognath==='no'?1:0)+(weight<90?0:weight<=110?1:2)+({none:0,question:1,definite:2}[d.intubHx]||0);
block.eg=result(sharedE,eMissing,sharedE>=4?'Umbral predictivo ≥4':'Por debajo de 4','El-Ganzouri: predicción de intubación difícil en contexto perioperatorio; la prueba no descarta dificultad.','/12');
// SARI by Nørskov operationalisation: Mallampati I-II=0, III=1, IV=2.
const sari=(mouth<4?1:0)+(tmd>6.5?0:tmd>=6?1:2)+(mm<=2?0:mm===3?1:2)+(neck>90?0:neck>=80?1:2)+(d.prognath==='no'?1:0)+(weight<90?0:weight<=110?1:2)+({none:0,question:1,definite:2}[d.intubHx]||0);
block.sari=result(sari,eMissing,sari>=4?'Resultado elevado (≥4)':'Por debajo de 4','SARI (operacionalización publicada por Nørskov): ponderación de Mallampati diferente a EGRI.','/12');
const wMissing=missing([[weight!==null,'Peso'],[mouth!==null,'Apertura interincisiva'],[has(d.sublux),'Subluxación mandibular'],[neck!==null,'Movilidad cuello'],[has(d.retrognath),'Retrognatia'],[has(d.buck),'Incisivos superiores']]);
const jaw=mouth>=5||d.sublux==='positive'?0:d.sublux==='zero'?1:2;
const wil=(weight<90?0:weight<=110?1:2)+(neck>90?0:neck>=80?1:2)+jaw+Number(d.retrognath||0)+Number(d.buck||0);
block.wil=result(wil,wMissing,wil>2?'Mayor probabilidad de dificultad (>2)':'≤2 puntos','Wilson: peso, flexoextensión, movilidad mandibular, retrognatia y protrusión dentaria. Los estudios usan umbrales variables.','/10');
// Arné has an explicitly grouped combined jaw criterion; no automatic imputation of ambiguous combinations.
const arneKnown=has(d.arneKnown)?yes(d.arneKnown):d.intubHx==='definite'?true:d.intubHx==='none'?false:null;
const arneJaw=has(d.arneJaw)?Number(d.arneJaw):(mouth!==null&&has(d.sublux)?(mouth>=5||d.sublux==='positive'?0:mouth>3.5&&mouth<5&&d.sublux==='zero'?3:mouth<3.5&&d.sublux==='negative'?13:null):null);
const aMissing=missing([[arneKnown!==null,'Intubación difícil previa (Arné)'],[has(d.arnePath),'Patología asociada a vía aérea difícil'],[has(d.arneSymptoms),'Síntomas de patología de vía aérea'],[arneJaw!==null,'Categoría combinada de apertura/protrusión'],[tmd!==null,'Distancia tiromentoniana'],[neck!==null,'Movilidad cuello'],[mm!==null,'Mallampati']]);
const aScore=Number(arneKnown===true)*10+Number(yes(d.arnePath))*5+Number(yes(d.arneSymptoms))*3+Number(arneJaw||0)+(tmd<6.5?4:0)+(neck>100?0:neck>=80?2:5)+({1:0,2:2,3:6,4:8}[mm]||0);
block.arne=result(aScore,aMissing,aScore>11?'Por encima de 11 (alerta)':'≤11 puntos','Arné (0–48): aplicable a cirugía general y ORL según la población original; confirmar criterio combinado mandibular.','/48');
const nMissing=missing([[tmd!==null,'Distancia tiromentoniana'],[mouth!==null,'Apertura oral'],[height!==null,'Estatura'],[mm!==null,'Mallampati']]);
const nScore=0.2262-0.4621*tmd+2.5516*Number(mm>=3)-1.1461*mouth+0.0433*height;
block.naguib=result(Math.round(nScore*100)/100,nMissing,nScore>0?'Modelo positivo (>0)':nScore<0?'Modelo negativo (<0)':'Valor de corte (0)','Modelo de Naguib: índice lineal predictivo; NO expresa porcentaje ni probabilidad calibrada.','', {precision:2});
const lMissing=missing([[age!==null,'Edad'],[bmi!==null,'Peso y estatura'],[has(d.beard),'Barba'],[has(d.edentulous),'Ausencia de dientes'],[has(d.snore),'Ronquido']]);
const lang=Number(age>55)+Number(bmi>26)+Number(yes(d.beard))+Number(yes(d.edentulous))+Number(yes(d.snore));
block.langeron=result(lang,lMissing,lang>=2?'Dos o más factores de dificultad':'Menos de dos factores','Langeron: predicción de ventilación difícil con mascarilla en adultos; ≥2 factores aumenta probabilidad.','/5');
const sMissing=missing([[has(d.snore),'Ronquido'],[has(d.tired),'Somnolencia'],[has(d.observed),'Apneas observadas'],[has(d.hypertension),'Hipertensión'],[bmi!==null,'IMC'],[age!==null,'Edad'],[nc!==null,'Perímetro de cuello'],[has(d.sex),'Sexo']]);
const stop=[d.snore,d.tired,d.observed,d.hypertension].filter(yes).length+Number(bmi>35)+Number(age>50)+Number(nc>40)+Number(d.sex==='male');
block.stop=result(stop,sMissing,stop<=2?'Probabilidad baja':stop<=4?'Probabilidad intermedia':'Probabilidad alta','STOP-BANG evalúa riesgo de SAOS, no la dificultad de intubación ni es diagnóstico de SAOS.','/8');
block.mallampati=result(mm,missing([[mm!==null,'Mallampati']]),mm>=3?'Clase III–IV: predictor positivo':'Clase I–II','Clasificación clínica aislada. Ninguna clase excluye por sí sola una intubación difícil.','/IV');
const ul=has(d.ulbt)?Number(d.ulbt):null;
block.ulbt=result(ul,missing([[ul!==null,'Prueba de mordida del labio superior']]),ul===3?'Clase III: prueba positiva':'Clase I–II','ULBT: Clase III, los incisivos inferiores no pueden morder el labio superior.','/III');
block.tmd=result(tmd,missing([[tmd!==null,'Distancia tiromentoniana']]),tmd<6.5?'Distancia reducida (<6.5 cm)':'≥6.5 cm','Distancia tiromentoniana (Patil-Aldrete); el punto de corte y exactitud varían entre cohortes.',' cm');
block.smd=result(smd,missing([[smd!==null,'Distancia esternomentoniana']]),smd<12.5?'Distancia reducida (<12.5 cm)':'≥12.5 cm','Distancia esternomentoniana; umbral orientativo, no marcador diagnóstico aislado.',' cm');
block.tmht=result(tmht,missing([[tmht!==null,'Altura tiromentoniana']]),tmht<=5?'Altura ≤5 cm: prueba positiva':'Altura >5 cm','Altura tiromentoniana: punto de corte aproximado de 50 mm en estudio original.',' cm');
block.inter=result(mouth,missing([[mouth!==null,'Apertura interincisiva']]),mouth<3.5?'Apertura limitada (<3.5 cm)':'≥3.5 cm','Exploración anatómica aislada; los umbrales para cada índice compuesto son diferentes.',' cm');
if(d.context==='icu'){
const mMissing=missing([[mm!==null,'Mallampati'],[has(d.osa),'SAOS diagnosticado'],[has(d.cervReduced),'Movilidad cervical reducida'],[mouth!==null,'Apertura oral'],[has(d.coma),'Coma'],[has(d.hypox),'Hipoxemia grave (SpO₂ <80%)'],[has(d.nonAnest),'Operador no anestesiólogo']]);
const m=Number(mm>=3)*5+Number(yes(d.osa))*2+Number(yes(d.cervReduced))+Number(mouth<3)+Number(yes(d.coma))+Number(yes(d.hypox))+Number(yes(d.nonAnest));
block.macocha=result(m,mMissing,m>=3?'Puntuación de alerta ≥3':'<3 puntos','MACOCHA fue validado para intubación en cuidados intensivos; no extrapolar directamente al quirófano.','/12');
}
if(d.context==='ed'){
const keys=[['leonExternal','Aspecto anatómico externo'],['leonMouth','Regla 3 dedos: boca'],['leonHyoid','Regla 3 dedos: mentón-hioides'],['leonThyroid','Regla 2 dedos: hioides-tiroides'],['leonObstruction','Obstrucción'],['leonNeck','Restricción cervical']];
const miss=missing(keys.map(([k,l])=>[has(d[k]),l]));const flags=keys.filter(([k])=>yes(d[k])).length;
block.leon=result(`${flags} / 6`,miss,flags?'Hay hallazgos positivos para revisión':'Sin hallazgos marcados','LEON / LEMON modificado: recuento orientativo de seis observaciones, NO puntaje pronóstico validado ni punto de corte universal.','');
}
return {...block,bmi};
}
const ITEMS=[
{id:'asa',title:'ASA-PS',category:'Estado físico',short:'Clasificación clínica',group:'general'},
{id:'rcri',title:'RCRI (Lee)',category:'Cardiovascular',short:'Seis predictores',group:'cardio'},
{id:'gold',title:'Goldman',category:'Cardiovascular',short:'Índice cardíaco original',group:'cardio'},
{id:'eg',title:'El-Ganzouri (EGRI)',category:'Vía aérea · intubación',short:'Siete predictores',group:'airway'},
{id:'sari',title:'SARI',category:'Vía aérea · intubación',short:'Índice simplificado de vía aérea',group:'airway'},
{id:'wil',title:'Wilson',category:'Vía aérea · intubación',short:'Cinco predictores',group:'airway'},
{id:'arne',title:'Arné',category:'Vía aérea · intubación',short:'Índice multivariable',group:'airway'},
{id:'naguib',title:'Naguib',category:'Vía aérea · intubación',short:'Modelo predictivo lineal',group:'airway'},
{id:'langeron',title:'Langeron',category:'Ventilación con mascarilla',short:'Cinco factores clínicos',group:'airway'},
{id:'mallampati',title:'Mallampati modificado',category:'Exploración aislada',short:'Clasificación orofaríngea',group:'airway'},
{id:'ulbt',title:'Mordida de labio (ULBT)',category:'Exploración aislada',short:'Clase I–III',group:'airway'},
{id:'tmd',title:'Distancia tiromentoniana',category:'Exploración aislada',short:'Patil-Aldrete',group:'airway'},
{id:'smd',title:'Distancia esternomentoniana',category:'Exploración aislada',short:'Medición clínica',group:'airway'},
{id:'tmht',title:'Altura tiromentoniana',category:'Exploración aislada',short:'TMHT',group:'airway'},
{id:'inter',title:'Apertura interincisiva',category:'Exploración aislada',short:'Medición clínica',group:'airway'},
{id:'stop',title:'STOP-BANG',category:'SAOS',short:'Cribado respiratorio',group:'airway'},
{id:'macocha',title:'MACOCHA',category:'UCI',short:'Intubación en cuidados intensivos',group:'critical',context:'icu'},
{id:'leon',title:'LEON / LEMON modificado',category:'Urgencias',short:'Lista estructurada; sin puntuación validada',group:'critical',context:'ed'}
];
root.AnesClinical={calculate,ITEMS};
})(typeof window!=='undefined'?window:globalThis);
