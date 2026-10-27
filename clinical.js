/* AnesScore calculation engine. Inputs are untrusted strings; unanswered values remain unknown.
   NOT VALIDATED FOR CLINICAL USE. The originating study population matters for every score. */
(function(root){'use strict';
const has=v=>v!==undefined&&v!==null&&v!=='';
const yes=v=>v==='yes';
const num=(d,k,min,max)=>{if(!has(d[k]))return null;const v=Number(d[k]);return Number.isFinite(v)&&v>=min&&v<=max?v:null};
const missing=(items)=>items.filter(x=>!x[0]).map(x=>x[1]);
const result=(value,requirements,label,details='',unit='',meta={})=>({value:requirements.length?null:value,missing:requirements,label:requirements.length?'':label,details,unit,...meta});
function calculate(d){
const age=num(d,'age',18,120),weight=num(d,'weight',1,400),height=num(d,'height',50,250),cr=num(d,'creatinine',0,30),nc=num(d,'neckCirc',10,100);
// Categorical (ordinal) inputs: score using the selected interval directly, never a fabricated mid-point.
const mouth=has(d.mouth)&&['lt3','3to35','35to4','4to5','ge5'].includes(d.mouth)?d.mouth:null;
const tmd=has(d.thyro)&&['lt6','6to65','eq65','gt65'].includes(d.thyro)?d.thyro:null;
const neck=has(d.neckMove)&&['lt80','80to90','eq90','90to100','gt100'].includes(d.neckMove)?d.neckMove:null;
const smd=has(d.sternomental)&&['lt125','ge125'].includes(d.sternomental)?d.sternomental:null;
const tmht=has(d.tmht)&&['le5','gt5'].includes(d.tmht)?d.tmht:null;
const MO={lt3:{label:'<3 cm',eg:1,mac:1,inter:1,lo:0,hi:3},'3to35':{label:'3 a <3.5 cm',eg:1,mac:0,inter:1,lo:3,hi:3.5},'35to4':{label:'3.5 a <4 cm',eg:1,mac:0,inter:0,lo:3.5,hi:4},'4to5':{label:'4 a <5 cm',eg:0,mac:0,inter:0,lo:4,hi:5},ge5:{label:'≥5 cm',eg:0,mac:0,inter:0,lo:5,hi:12}};
const TM={lt6:{label:'<6 cm',eg:2,arne:4,short:1,lo:0,hi:6},'6to65':{label:'6 a <6.5 cm',eg:1,arne:4,short:1,lo:6,hi:6.5},eq65:{label:'6.5 cm',eg:1,arne:0,short:0,lo:6.5,hi:6.5},gt65:{label:'>6.5 cm',eg:0,arne:0,short:0,lo:6.5,hi:25}};
const NM={lt80:{label:'<80°',eg:2,wil:2,arne:5,lim:1},'80to90':{label:'80 a <90°',eg:1,wil:2,arne:2,lim:0},eq90:{label:'90°',eg:1,wil:1,arne:2,lim:0},'90to100':{label:'>90 a 100°',eg:0,wil:0,arne:2,lim:0},gt100:{label:'>100°',eg:0,wil:0,arne:0,lim:0}};
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
const sharedE=MO[mouth]?.eg+TM[tmd]?.eg+(mm===1?0:mm===2?1:2)+NM[neck]?.eg+(d.prognath==='no'?1:0)+(weight<90?0:weight<=110?1:2)+({none:0,question:1,definite:2}[d.intubHx]||0);
block.eg=result(sharedE,eMissing,sharedE>=4?'Umbral predictivo ≥4':'Por debajo de 4','El-Ganzouri: predicción de intubación difícil en contexto perioperatorio; la prueba no descarta dificultad.','/12');
// SARI by Nørskov operationalisation: Mallampati I-II=0, III=1, IV=2.
const sari=MO[mouth]?.eg+TM[tmd]?.eg+(mm<=2?0:mm===3?1:2)+NM[neck]?.eg+(d.prognath==='no'?1:0)+(weight<90?0:weight<=110?1:2)+({none:0,question:1,definite:2}[d.intubHx]||0);
block.sari=result(sari,eMissing,sari>=4?'Resultado elevado (≥4)':'Por debajo de 4','SARI (operacionalización publicada por Nørskov): ponderación de Mallampati diferente a EGRI.','/12');
const wMissing=missing([[weight!==null,'Peso'],[mouth!==null,'Apertura interincisiva'],[has(d.sublux),'Subluxación mandibular'],[neck!==null,'Movilidad cuello'],[has(d.retrognath),'Retrognatia'],[has(d.buck),'Incisivos superiores']]);
const jaw=mouth==='ge5'||d.sublux==='positive'?0:d.sublux==='zero'?1:2;
const wil=(weight<90?0:weight<=110?1:2)+NM[neck]?.wil+jaw+Number(d.retrognath||0)+Number(d.buck||0);
block.wil=result(wil,wMissing,wil>2?'Mayor probabilidad de dificultad (>2)':'≤2 puntos','Wilson: peso, flexoextensión, movilidad mandibular, retrognatia y protrusión dentaria. Los estudios usan umbrales variables.','/10');
// Arné has an explicitly grouped combined jaw criterion; no automatic imputation of ambiguous combinations.
const arneKnown=has(d.arneKnown)?yes(d.arneKnown):d.intubHx==='definite'?true:d.intubHx==='none'?false:null;
// Arné combines jaw subluxation and mouth opening. Keep its own categorical input to avoid boundary imputation.
const arneJaw=has(d.arneJaw)?Number(d.arneJaw):null;
const aMissing=missing([[arneKnown!==null,'Intubación difícil previa (Arné)'],[has(d.arnePath),'Patología asociada a vía aérea difícil'],[has(d.arneSymptoms),'Síntomas de patología de vía aérea'],[arneJaw!==null,'Categoría combinada de apertura/protrusión'],[tmd!==null,'Distancia tiromentoniana'],[neck!==null,'Movilidad cuello'],[mm!==null,'Mallampati']]);
const aScore=Number(arneKnown===true)*10+Number(yes(d.arnePath))*5+Number(yes(d.arneSymptoms))*3+Number(arneJaw||0)+(TM[tmd]?.arne??0)+(NM[neck]?.arne??0)+({1:0,2:2,3:6,4:8}[mm]||0);
block.arne=result(aScore,aMissing,aScore>11?'Por encima de 11 (alerta)':'≤11 puntos','Arné (0–48): aplicable a cirugía general y ORL según la población original; confirmar criterio combinado mandibular.','/48');
const nMissing=missing([[tmd!==null,'Distancia tiromentoniana'],[mouth!==null,'Apertura oral'],[height!==null,'Estatura'],[mm!==null,'Mallampati']]);
// Naguib requires continuous distances (cm). Interval arithmetic can determine only a definite sign,
// never an exact numeric score from the ordinal group. A crossed threshold remains indeterminate.
const nt=tmd!==null?TM[tmd]:null,nm=mouth!==null?MO[mouth]:null;
const nBase=height!==null&&mm!==null?0.2262+2.5516*Number(mm>=3)+0.0433*height:null;
const nMin=nBase!==null&&nt&&nm?nBase-0.4621*nt.hi-1.1461*nm.hi:null;
const nMax=nBase!==null&&nt&&nm?nBase-0.4621*nt.lo-1.1461*nm.lo:null;
const nSign=nMin!==null&&nMin>0?'positive':nMax!==null&&nMax<0?'negative':null;
const nAllMissing=nSign===null&&!nMissing.length?['Rangos cruzan el umbral: requieren medidas exactas para Naguib']:nMissing;
block.naguib=result(nSign==='positive'?'Positivo':nSign==='negative'?'Negativo':null,nAllMissing,nSign==='positive'?'Positivo en todo el rango seleccionado':nSign==='negative'?'Negativo en todo el rango seleccionado':'','Naguib usa cm continuos; esta versión solo muestra el signo si es concluyente para todos los valores dentro de los rangos. No estima puntuación exacta ni porcentaje.','');
const lMissing=missing([[age!==null,'Edad'],[bmi!==null,'Peso y estatura'],[has(d.beard),'Barba'],[has(d.edentulous),'Ausencia de dientes'],[has(d.snore),'Ronquido']]);
const lang=Number(age>55)+Number(bmi>26)+Number(yes(d.beard))+Number(yes(d.edentulous))+Number(yes(d.snore));
block.langeron=result(lang,lMissing,lang>=2?'Dos o más factores de dificultad':'Menos de dos factores','Langeron: predicción de ventilación difícil con mascarilla en adultos; ≥2 factores aumenta probabilidad.','/5');
const sMissing=missing([[has(d.snore),'Ronquido'],[has(d.tired),'Somnolencia'],[has(d.observed),'Apneas observadas'],[has(d.hypertension),'Hipertensión'],[bmi!==null,'IMC'],[age!==null,'Edad'],[nc!==null,'Perímetro de cuello'],[has(d.sex),'Sexo']]);
const stop=[d.snore,d.tired,d.observed,d.hypertension].filter(yes).length+Number(bmi>35)+Number(age>50)+Number(nc>40)+Number(d.sex==='male');
block.stop=result(stop,sMissing,stop<=2?'Probabilidad baja':stop<=4?'Probabilidad intermedia':'Probabilidad alta','STOP-BANG evalúa riesgo de SAOS, no la dificultad de intubación ni es diagnóstico de SAOS.','/8');
block.mallampati=result(mm,missing([[mm!==null,'Mallampati']]),mm>=3?'Clase III–IV: predictor positivo':'Clase I–II','Clasificación clínica aislada. Ninguna clase excluye por sí sola una intubación difícil.','/IV');
const ul=has(d.ulbt)?Number(d.ulbt):null;
block.ulbt=result(ul,missing([[ul!==null,'Prueba de mordida del labio superior']]),ul===3?'Clase III: prueba positiva':'Clase I–II','ULBT: Clase III, los incisivos inferiores no pueden morder el labio superior.','/III');
// Single physical tests displayed as the actual selected interval (no invented cm).
block.tmd=result(tmd===null?null:TM[tmd].label,missing([[tmd!==null,'Distancia tiromentoniana']]),TM[tmd]?.short?'Distancia tiromentoniana reducida (<6.5 cm)':'Distancia ≥6.5 cm','Patil-Aldrete; rangos por categorías, no cm exactos.');
block.smd=result(smd===null?null:(smd==='lt125'?'<12.5 cm':'≥12.5 cm'),missing([[smd!==null,'Distancia esternomentoniana']]),smd==='lt125'?'Distancia reducida (<12.5 cm)':'≥12.5 cm','Umbral orientativo, no prueba diagnóstica aislada.');
block.tmht=result(tmht===null?null:(tmht==='le5'?'≤5 cm':'>5 cm'),missing([[tmht!==null,'Altura tiromentoniana']]),tmht==='le5'?'Altura ≤5 cm: prueba positiva':'Altura >5 cm','Punto de corte aproximado de 50 mm, sin inferir medición exacta.');
block.inter=result(mouth===null?null:MO[mouth].label,missing([[mouth!==null,'Apertura interincisiva']]),mouth!==null&&MO[mouth].inter?'Apertura limitada (<3.5 cm)':'≥3.5 cm','Los umbrales usados por los índices compuestos varían.');
if(d.context==='icu'){
const mMissing=missing([[mm!==null,'Mallampati'],[has(d.osa),'SAOS diagnosticado'],[has(d.cervReduced),'Movilidad cervical reducida'],[mouth!==null,'Apertura oral'],[has(d.coma),'Coma'],[has(d.hypox),'Hipoxemia grave (SpO₂ <80%)'],[has(d.nonAnest),'Operador no anestesiólogo']]);
const m=Number(mm>=3)*5+Number(yes(d.osa))*2+Number(yes(d.cervReduced))+Number(mouth!==null&&MO[mouth].mac===1)+Number(yes(d.coma))+Number(yes(d.hypox))+Number(yes(d.nonAnest));
block.macocha=result(m,mMissing,m>=3?'Puntuación de alerta ≥3':'<3 puntos','MACOCHA fue validado para intubación en cuidados intensivos; no extrapolar directamente al quirófano.','/12');
}
if(d.context==='ed'){
const keys=[['leonExternal','Aspecto anatómico externo'],['leonMouth','Regla 3 dedos: boca'],['leonHyoid','Regla 3 dedos: mentón-hioides'],['leonThyroid','Regla 2 dedos: hioides-tiroides'],['leonObstruction','Obstrucción'],['leonNeck','Restricción cervical']];
const miss=missing(keys.map(([k,l])=>[has(d[k]),l]));const flags=keys.filter(([k])=>yes(d[k])).length;
block.leon=result(`${flags} / 6`,miss,flags?'Hay hallazgos positivos para revisión':'Sin hallazgos marcados','LEON / LEMON modificado: recuento orientativo de seis observaciones, NO puntaje pronóstico validado ni punto de corte universal.','');
}
return {...block,bmi};
}
// The signal colors are navigation aids for established thresholds, NOT new probabilities.
// 'safe' means below a displayed screening threshold, never a guarantee of easy airway.
function signalFor(id, x){
 if(!x||x.value===null)return {tone:'pending',text:'SIN DATOS'};
 const v=x.value;
 const mark=(tone,text)=>({tone,text});
 switch(id){
  case 'asa':{
   const klass=String(v).match(/ASA (VI|IV|III|II|V|I)(?:\s|$)/)?.[1];
   if(klass==='I'||klass==='II')return mark('safe','ASA I–II');
   if(klass==='III')return mark('warning','ASA III');
   if(klass==='IV'||klass==='V')return mark('danger',`ASA ${klass}`);
   return mark('neutral','ASA VI');
  }
  case 'rcri':return v>=2?mark('danger','≥2 FACTORES'):v===1?mark('warning','1 FACTOR'):mark('safe','0 FACTORES');
  case 'gold':return v>=13?mark('danger','CLASE III–IV'):v>=6?mark('warning','CLASE II'):mark('safe','CLASE I');
  case 'eg':case 'sari':return v>=4?mark('danger','UMBRAL POSITIVO'):mark('safe','BAJO UMBRAL');
  case 'wil':return v>2?mark('danger','UMBRAL POSITIVO'):mark('safe','BAJO UMBRAL');
  case 'arne':return v>11?mark('danger','UMBRAL POSITIVO'):mark('safe','BAJO UMBRAL');
  case 'naguib':return v==='Positivo'?mark('danger','MODELO POSITIVO'):mark('safe','MODELO NEGATIVO');
  case 'langeron':return v>=2?mark('danger','≥2 FACTORES'):mark('safe','<2 FACTORES');
  case 'macocha':return v>=3?mark('danger','UMBRAL POSITIVO'):mark('safe','BAJO UMBRAL');
  case 'stop':return v>=5?mark('danger','SAOS · ALTO'):v>=3?mark('warning','SAOS · INTERMEDIO'):mark('safe','SAOS · BAJO');
  case 'mallampati':return v>=3?mark('warning','HALLAZGO POSITIVO'):mark('safe','SIN HALLAZGO');
  case 'ulbt':return v===3?mark('danger','PRUEBA POSITIVA'):mark('safe','SIN HALLAZGO');
  case 'tmd':return v==='<6 cm'||v==='6 a <6.5 cm'?mark('warning','DISTANCIA CORTA'):mark('safe','SIN HALLAZGO');
  case 'smd':return v==='<12.5 cm'?mark('warning','DISTANCIA CORTA'):mark('safe','SIN HALLAZGO');
  case 'tmht':return v==='≤5 cm'?mark('warning','ALTURA REDUCIDA'):mark('safe','SIN HALLAZGO');
  case 'inter':return v==='<3 cm'||v==='3 a <3.5 cm'?mark('warning','APERTURA CORTA'):mark('safe','SIN HALLAZGO');
  case 'leon':return parseInt(v,10)>0?mark('warning','REVISAR HALLAZGOS'):mark('safe','SIN HALLAZGO');
  default:return mark('neutral','CALCULADO');
 }
}
// Qualitative synthesis of distinct endpoints: difficult intubation and difficult facemask ventilation.
// It is deliberately NOT a validated combined score and cannot rule out difficulty.
function airwaySummary(scores,d={}){
 const redI=[],amberI=[],redM=[],amberM=[];
 const valid=(id)=>scores[id]&&scores[id].value!==null;
 const hit=(id,fn)=>valid(id)&&fn(scores[id].value);
 if(d.intubHx==='definite')redI.push('Intubación difícil previa documentada');
 if(hit('eg',v=>v>=4))redI.push('El-Ganzouri ≥4');
 if(hit('sari',v=>v>=4))redI.push('SARI ≥4');
 if(hit('wil',v=>v>2))redI.push('Wilson >2');
 if(hit('arne',v=>v>11))redI.push('Arné >11');
 if(hit('naguib',v=>v==='Positivo'))redI.push('Naguib: resultado positivo por rangos');
 if(hit('ulbt',v=>v===3))redI.push('ULBT clase III');
 if(d.context==='icu'&&hit('macocha',v=>v>=3))redI.push('MACOCHA ≥3 (UCI)');
 if(d.context==='ed'&&d.leonObstruction==='yes')redI.push('Obstrucción de vía aérea (urgencias)');
 if(hit('mallampati',v=>v>=3))amberI.push('Mallampati III–IV');
 if(hit('inter',v=>v==='<3 cm'||v==='3 a <3.5 cm'))amberI.push('Apertura interincisiva <3.5 cm');
 if(hit('tmd',v=>v==='<6 cm'||v==='6 a <6.5 cm'))amberI.push('Distancia tiromentoniana <6.5 cm');
 if(hit('smd',v=>v==='<12.5 cm'))amberI.push('Distancia esternomentoniana <12.5 cm');
 if(hit('tmht',v=>v==='≤5 cm'))amberI.push('Altura tiromentoniana ≤5 cm');
 if(d.prognath==='no')amberI.push('Protrusión mandibular limitada');
 if(d.sublux==='negative')amberI.push('Subluxación mandibular limitada');
 if(d.retrognath==='2')amberI.push('Retrognatia marcada');
 if(d.neckMove==='lt80')amberI.push('Movilidad cervical <80°');
 if(d.intubHx==='question')amberI.push('Antecedente de intubación difícil dudoso');
 if(d.arnePath==='yes'||d.arneSymptoms==='yes')amberI.push('Patología/síntomas asociados con vía aérea');
 if(d.context==='ed'&&hit('leon',v=>parseInt(v,10)>0))amberI.push('LEMON/LEON: hallazgos positivos');
 if(hit('langeron',v=>v>=2))redM.push('Langeron ≥2: predictores de ventilación difícil con mascarilla');
 else{
  if(d.beard==='yes')amberM.push('Barba: factor de dificultad con mascarilla');
  if(d.edentulous==='yes')amberM.push('Edentulismo: factor de dificultad con mascarilla');
 }
 const intCore=valid('eg')&&valid('wil')&&valid('ulbt')&&(d.context!=='icu'||valid('macocha'))&&(d.context!=='ed'||valid('leon'));
 const maskCore=valid('langeron');
 const tier=(reds,ambers,complete)=>reds.length?'danger':ambers.length?'warning':complete?'safe':'pending';
 const intTone=tier(redI,amberI,intCore),maskTone=tier(redM,amberM,maskCore);
 const tone=intTone==='danger'||maskTone==='danger'?'danger':intTone==='warning'||maskTone==='warning'?'warning':intTone==='safe'&&maskTone==='safe'?'safe':'pending';
 const messages={
  danger:{title:'Se anticipa posible dificultad',answer:'Sí · hay predictores positivos',description:'Hay puntuaciones sobre el umbral o antecedentes asociados con dificultad para intubar o ventilar con mascarilla. Revisar la estrategia de vía aérea.'},
  warning:{title:'Hallazgos que requieren revisión',answer:'Indeterminado · precaución',description:'Se identificaron predictores aislados. No equivalen por sí solos a un diagnóstico de vía aérea difícil; valorar en conjunto.'},
  safe:{title:'Sin predictores principales',answer:'No se anticipa con los datos disponibles',description:'La evaluación básica está completa y los indicadores considerados están bajo sus umbrales. No se descarta una vía aérea difícil.'},
  pending:{title:'Evaluación incompleta',answer:'No es posible concluir',description:'Completa las variables principales de intubación y ventilación para obtener una orientación conjunta.'}
 };
 const reasons=[...redI,...redM,...amberI,...amberM];
 const labels={danger:'Alerta',warning:'Precaución',safe:'Sin señales principales',pending:'Pendiente'};
 return {...messages[tone],tone,reasons, intubation:{tone:intTone,label:labels[intTone]},mask:{tone:maskTone,label:labels[maskTone]},complete:intCore&&maskCore};
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
root.AnesClinical={calculate,ITEMS,signalFor,airwaySummary};
})(typeof window!=='undefined'?window:globalThis);
