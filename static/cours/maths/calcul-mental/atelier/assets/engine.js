/* Génération et aides de calcul mental. Aucune donnée de séance n'est conservée. */
(function(g){
'use strict';
const catalog=typeof module!=='undefined'&&module.exports?require('./catalogue.js'):g.MentalCatalogue;
const byCode=new Map(catalog.skills.map(s=>[s.code,s]));
const cache=new Map();
const range=(lo,hi,step=1)=>Array.from({length:Math.max(0,Math.floor((hi-lo)/step)+1)},(_,i)=>lo+i*step);
const clean=n=>Math.round(n*1e8)/1e8;
const fmt=n=>String(clean(n)).replace('.',',');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signs={'+':'+','-':'−','*':'×','/':':'};
function poolFor(code,level){
 if(!byCode.has(code)||![1,2,3].includes(level))throw Error('Compétence ou niveau inconnu.');
 const key=code+':'+level;if(cache.has(key))return cache.get(key);
 const s=byCode.get(code),f=s.family,L=level-1,p=[];
 const add=(a,b,op,kind='number',unit=0)=>p.push({a:clean(a),b:clean(b),op,kind,unit});
 const pairs=(as,bs,op,filter=()=>true,kind='number')=>{for(const a of as)for(const b of bs)if(filter(a,b))add(a,b,op,kind);};
 switch(f){
 case 'small-add': pairs(range(1,[3,5,9][L]),range(1,[3,5,9][L]),'+',(a,b)=>a+b<=[5,8,10][L]);break;
 case 'small-sub': pairs(range(2,[5,8,10][L]),range(1,[4,7,9][L]),'-',(a,b)=>a>=b);break;
 case 'double-small': for(const n of range(1,[4,7,10][L]))add(n,n,'+');break;
 case 'half-small': for(const n of range(1,[4,7,10][L]))add(n*2,2,'/');break;
 case 'complement-small': {const target=[10,10,20][L];for(const n of range(1,[5,9,19][L]))add(target,n,'-','complement');break;}
 case 'bridge-add': pairs(range([8,6,3][L],9),range(2,[4,6,9][L]),'+',(a,b)=>a+b>10);break;
 case 'bridge-sub': pairs(range(11,[12,15,18][L]),range([3,4,2][L],[5,8,9][L]),'-',(a,b)=>a-b<10);break;
 case 'zero-add': for(const n of range(1,[10,30,100][L])){add(n,0,'+');add(n,0,'-');}break;
 case 'zero-multiply': for(const n of range(1,[5,10,20][L])){add(n,0,'*');add(n,1,'*');}break;
 case 'tens-add':pairs(range(10,[30,50,90][L],10),range(10,[30,50,90][L],10),'+');break;
 case 'tens-sub':pairs(range(20,[50,80,100][L],10),range(10,[40,70,90][L],10),'-',(a,b)=>a>=b);break;
 case 'complement-100':for(const n of range([10,5,1][L],[90,95,99][L],[10,5,1][L]))add(100,n,'-','complement');break;
 case 'mental-add':pairs(range(11,[39,69,89][L]),range(11,[30,40,49][L]),'+',(a,b)=>a+b<=100&&(L===0?(a%10+b%10)<10:L===2?(a%10+b%10)>=10:true));break;
 case 'mental-sub':pairs(range(20,[49,79,99][L]),range(11,[30,50,89][L]),'-',(a,b)=>a>b&&(L===0?a%10>=b%10:L===2?a%10<b%10:true));break;
 case 'double-large':for(const n of range([10,15,25][L],[20,40,99][L]))add(n,n,'+');break;
 case 'half-large':for(const n of range([10,15,25][L],[20,40,99][L]))add(n*2,2,'/');break;
 case 'hundreds-add':pairs(range(100,[400,600,800][L],[100,50,10][L]),range(100,[400,400,600][L],[100,50,10][L]),'+',(a,b)=>a+b<=1000);break;
 case 'hundreds-sub':pairs(range(200,[600,800,990][L],[100,50,10][L]),range(100,[500,600,800][L],[100,50,10][L]),'-',(a,b)=>a>b);break;
 case 'estimate': {const unit=L===2?100:10;const nums=L===0?range(11,39,2):L===1?range(21,89,3):range(115,895,30);for(const a of nums)for(const b of nums){add(a,b,'+','estimate',unit);if(a>b)add(a,b,'-','estimate',unit);}break;}
 case 'groups':pairs(range(1,[3,5,9][L]),range(2,[4,6,9][L]),'*');break;
 case 'derive-table':pairs(range(6,[6,8,9][L]),range(2,[5,8,9][L]),'*');break;
 case 'times5':case 'times9':case 'times25':{const factor={times5:5,times9:9,times25:25}[f];for(const n of range(2,[5,10,16][L]))add(n,factor,'*');break;}
 case 'mental-multiply':pairs(range([11,12,25][L],[24,49,99][L]),range(2,[3,5,6][L]),'*');break;
 case 'times-power':for(const n of range([1,10,10][L],[9,39,99][L]))for(const d of (L===0?[10]:L===1?[10,100]:[10,100,1000]))add(n,d,'*');break;
 case 'fixed-multiply':for(const n of range([1,1,4][L],[5,9,10][L]))add(n,s.factor,'*');break;
 case 'fixed-divide':for(const n of range([1,1,4][L],[5,9,10][L]))add(n*s.factor,s.factor,'/');break;
 case 'division-table':for(const d of range(2,[4,6,9][L]))for(const q of range(1,[5,9,9][L]))add(q*d,d,'/');break;
 case 'remainder':for(const d of range(2,[4,6,9][L]))for(const q of range(1,[4,8,12][L]))for(const r of range(1,d-1))add(q*d+r,d,'/','remainder');break;
 case 'divide4':case 'divide5': {const d=f==='divide4'?4:5;for(const q of range([2,5,10][L],[6,12,25][L]))add(q*d,d,'/');break;}
 case 'division-decompose':for(const d of range(2,[3,5,6][L]))for(const q of range([11,12,15][L],[19,29,49][L]))add(q*d,d,'/');break;
 case 'divide-power':for(const n of range([1,10,10][L],[9,39,99][L]))for(const d of (L===0?[10]:L===1?[10,100]:[10,100,1000]))add(n*d,d,'/');break;
 case 'decimal-add':for(const a of range([1,11,15][L],[8,29,75][L]))for(const b of range([1,1,5][L],[8,9,35][L]))if(L!==0||a+b<=10)add(a/10,b/10,'+');break;
 case 'decimal-sub':for(const a of range([2,10,15][L],[9,39,79][L]))for(const b of range([1,1,5][L],[8,9,39][L]))if(a>b)add(a/10,b/10,'-');break;
 case 'decimal-times10':for(const n of range([1,11,11][L],[9,49,99][L]))for(const d of (L===0?[10]:L===1?[10,100]:[10,100,1000]))add(n/10,d,'*');break;
 case 'decimal-divide10':for(const n of range([1,11,11][L],[9,49,99][L]))for(const d of (L===0?[10]:L===1?[10,100]:[10,100,1000]))add(n,d,'/');break;
 default:throw Error('Famille non gérée : '+f);
 }
 if(!p.length)throw Error('Aucun calcul disponible.');cache.set(key,p);return p;
}
function makeProblem(code,spec,level=2){
 const s=byCode.get(code),{a,b,op,kind='number',unit=0}=spec;
 const result=clean(op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b);
 let answers=[result], labels=['Réponse'],prompt=`${fmt(a)} ${signs[op]} ${fmt(b)}`;
 if(kind==='complement')prompt=`${fmt(b)} + ____ = ${fmt(a)}`;
 if(kind==='remainder'){answers=[Math.floor(a/b),a%b];labels=['Quotient','Reste'];prompt=`${fmt(a)} : ${fmt(b)}`;}
 if(kind==='estimate'){const ra=Math.round(a/unit)*unit,rb=Math.round(b/unit)*unit;answers=[op==='+'?ra+rb:ra-rb,result];labels=['Estimation','Résultat exact'];}
 return {code,family:s.family,factor:s.factor||0,level,a,b,op,kind,unit,answers,labels,prompt,key:`${code}:${a}:${op}:${b}:${kind}`};
}
function shuffled(xs,rng=Math.random){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function generate(codes,level,count,mode='drill',rng=Math.random){
 if(![10,20,30,52].includes(count))throw Error('Choisis 10, 20, 30 ou 52 calculs.');
 if(![1,2,3].includes(level))throw Error('Choisis un niveau de 1 à 3.');
 if(!['print','drill'].includes(mode))throw Error('Choisis un mode de travail.');
 const selected=catalog.skills.filter(s=>codes.includes(s.code));
 if(!selected.length)throw Error('Coche au moins une compétence.');
 if(selected.length!==new Set(codes).size)throw Error('Une compétence sélectionnée est inconnue.');
 if(selected.length>count)throw Error(`Tu as coché ${selected.length} compétences pour ${count} calculs. Augmente le nombre de calculs ou réduis la sélection.`);
 const extras=new Set(shuffled(selected.map(s=>s.code),rng).slice(0,count%selected.length));let qs=[];
 for(const s of selected){const n=Math.floor(count/selected.length)+(extras.has(s.code)?1:0);let bag=[],last='';for(let i=0;i<n;i++){
  if(!bag.length){bag=shuffled(poolFor(s.code,level),rng);if(bag.length>1){let item=makeProblem(s.code,bag[bag.length-1],level);if(item.key===last)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];}}
  const p=makeProblem(s.code,bag.pop(),level);qs.push(p);last=p.key;
 }}
 if(mode==='drill'){qs=shuffled(qs,rng);for(let i=1;i<qs.length;i++)if(qs[i].key===qs[i-1].key){const j=qs.findIndex((q,j)=>j>i&&q.key!==qs[i-1].key&&(j===qs.length-1||qs[j+1].key!==qs[i].key));if(j>i)[qs[i],qs[j]]=[qs[j],qs[i]];}}
 return qs;
}
function completeSession(code,rng=Math.random){
 if(!byCode.has(code))throw Error('Choisis une compétence connue.');
 const seen=new Set(),questions=[];
 const take=(level,count,phase)=>{
  let bag=shuffled(poolFor(code,level),rng),chosen=[];
  for(const spec of bag){const p=makeProblem(code,spec,level);if(!seen.has(p.key)){seen.add(p.key);chosen.push({...p,phase});if(chosen.length===count)break;}}
  if(chosen.length<count){for(const spec of bag){const p=makeProblem(code,spec,level);chosen.push({...p,phase});if(chosen.length===count)break;}}
  questions.push(...chosen);
 };
 take(1,2,'practice');take(2,2,'practice');take(3,2,'practice');take(3,3,'validation');
 return questions;
}
function numeric(raw){const s=String(raw).trim().replace(',','.');if(!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;}
function grade(p,raw){
 const values=raw.map(numeric);const invalid=values.length!==p.answers.length||values.some(v=>v===null)||(p.kind==='remainder'&&values.some(v=>!Number.isInteger(v)||v<0));
 if(invalid)return {valid:false,message:p.kind==='remainder'?'Écris un entier positif ou zéro dans chaque case.':'Complète chaque case avec un nombre. La virgule et le point sont acceptés.'};
 const fields=values.map((v,i)=>Math.abs(v-p.answers[i])<1e-7);
 return {valid:true,correct:fields.every(Boolean),fields};
}
function answerText(p){if(p.kind==='remainder')return `quotient ${p.answers[0]}, reste ${p.answers[1]}`;if(p.kind==='estimate')return `estimation ${fmt(p.answers[0])} ; résultat exact ${fmt(p.answers[1])}`;return fmt(p.answers[0]);}
function strategy(p){
 const {a,b,op,family:f,kind,unit}=p, A=fmt(a),B=fmt(b),R=fmt(p.answers[p.answers.length-1]);
 let h2,h3,steps=[];
 if(kind==='remainder'){
  const [q,r]=p.answers,t=b*Math.max(0,q-1);
  h2=`Combien de groupes de ${B} peux-tu faire sans dépasser ${A} ?`;
  h3=`${Math.max(0,q-1)} × ${B} = ${t}. Essaie encore un groupe, puis compte ce qui reste.`;
  steps=[`${q} × ${B} = ${q*b}.`,`${A} − ${q*b} = ${r}.`,`Le quotient est ${q} et le reste ${r}. ${r} est plus petit que ${B}.`];
 }else if(kind==='estimate'){
  const ra=Math.round(a/unit)*unit,rb=Math.round(b/unit)*unit;
  h2=`Arrondis ${A} à la ${unit===10?'dizaine':'centaine'} la plus proche : ${Math.floor(a/unit)*unit} ou ${Math.ceil(a/unit)*unit} ?`;
  h3=`Pour l’estimation : ${ra} ${signs[op]} ${rb} = □. Pour le résultat exact : ${A} ${signs[op]} ${B} = □.`;
  steps=[`${A} s’arrondit à ${ra} et ${B} à ${rb}.`,`Estimation : ${ra} ${signs[op]} ${rb} = ${fmt(p.answers[0])}.`,`Calcul exact : ${A} ${signs[op]} ${B} = ${R}.`];
 }else if(kind==='complement'){
  const target=a,start=b,next=Math.min(target,Math.ceil(start/10)*10),hop=next-start,rest=target-next;
  h2=`Pars de ${B}. Combien manque-t-il pour arriver à ${next===start?target:next} ?`;
  h3=hop===0||rest===0?`${A} − ${B} = □. Vérifie ensuite ${B} + □ = ${A}.`:`De ${B} à ${next}, il manque ${fmt(hop)}. De ${next} à ${A}, il manque ${fmt(rest)}. Ajoute ces deux sauts.`;
  steps=hop&&rest?[`De ${B} à ${next} : + ${fmt(hop)}.`,`De ${next} à ${A} : + ${fmt(rest)}.`,`${fmt(hop)} + ${fmt(rest)} = ${R}, donc ${B} + ${R} = ${A}.`]:[`${A} − ${B} = ${R}.`,`Vérification : ${B} + ${R} = ${A}.`];
 }else if(f==='bridge-add'){
  const gap=10-a,rest=b-gap;h2=`${A} + □ = 10. Quelle partie de ${B} utilises-tu ?`;
  h3=`Sépare ${B} en ${gap} et ${rest} : ${A} + ${gap} = 10, puis 10 + ${rest} = □.`;
  steps=[`${B} = ${gap} + ${rest}.`,`${A} + ${gap} = 10.`,`10 + ${rest} = ${R}. On a utilisé les ${B} unités une seule fois.`];
 }else if(f==='bridge-sub'){
  const first=a-10,rest=b-first;h2=`${A} − □ = 10. Combien retires-tu d’abord ?`;
  h3=`Retire ${first}, puis les ${rest} qui restent : ${A} − ${first} = 10 ; 10 − ${rest} = □.`;
  steps=[`On décompose ${B} en ${first} + ${rest}.`,`${A} − ${first} = 10.`,`10 − ${rest} = ${R}.`];
 }else if(f==='zero-add'){
  h2=`Ajouter ou enlever zéro change-t-il les ${A} objets ?`;h3=`${A} ${signs[op]} 0 : tu gardes la même quantité.`;
  steps=[`On ne ${op==='+'?'rajoute':'retire'} aucun objet.`,`${A} ${signs[op]} 0 = ${R}.`];
 }else if(f==='zero-multiply'||(op==='*'&&(a===0||b===0||a===1||b===1))){
  h2=`Représente ${A} groupe(s) de ${B} objet(s).`;h3=b===0||a===0?'Zéro groupe ou un groupe vide ne contient aucun objet.':'Multiplier par 1 conserve le nombre d’objets.';
  steps=[b===0||a===0?'Il n’y a aucun objet dans les groupes.':'Il y a une seule fois la quantité indiquée.',`${A} × ${B} = ${R}.`];
 }else if(f==='times9'){
  h2=`Calcule d’abord ${A} × 10 = □.`;h3=`${A} × 10 = ${a*10}. Retire maintenant ${A} : ${a*10} − ${A} = □.`;
  steps=[`${A} × 10 = ${a*10}.`,`Un groupe de moins : ${a*10} − ${A} = ${R}.`];
 }else if(f==='times5'){
  h2=`Calcule d’abord ${A} × 10 = □.`;h3=`${A} × 10 = ${a*10}. Prends la moitié de ${a*10}.`;
  steps=[`${A} × 10 = ${a*10}.`,`La moitié de ${a*10} est ${R}, donc ${A} × 5 = ${R}.`];
 }else if(f==='times25'){
  h2=`Calcule d’abord ${A} × 100 = □.`;h3=`${A} × 100 = ${a*100}. Partage ${a*100} en 4 parts égales.`;
  steps=[`25 est le quart de 100.`,`${A} × 100 = ${a*100}.`,`${a*100} : 4 = ${R}.`];
 }else if(f==='fixed-multiply'){
  const factor=b;
  if(factor===2){h2=`Double ${A}.`;h3=`${A} × 2, c’est ${A} + ${A} = ____.`;steps=[`${A} + ${A} = ${R}.`,`${A} × 2 = ${R}.`];}
  else if(factor===3){h2=`Calcule d’abord ${A} × 2.`;h3=`${A} × 2 = ${a*2}. Ajoute encore ${A} : ${a*2} + ${A} = ____.`;steps=[`${A} × 2 = ${a*2}.`,`${a*2} + ${A} = ${R}.`];}
  else if(factor===4){h2=`Double ${A} une première fois.`;h3=`${A} × 2 = ${a*2}. Double encore ${a*2}.`;steps=[`${A} × 2 = ${a*2}.`,`${a*2} × 2 = ${R}. Deux doubles reviennent à multiplier par 4.`];}
  else if(factor===5){h2=`Calcule ${A} × 10.`;h3=`${A} × 10 = ${a*10}. Prends la moitié.`;steps=[`${A} × 10 = ${a*10}.`,`${a*10} : 2 = ${R}.`];}
  else if(factor===6){h2=`Calcule ${A} × 5.`;h3=`${A} × 5 = ${a*5}. Ajoute encore un groupe de ${A}.`;steps=[`${A} × 5 = ${a*5}.`,`${a*5} + ${A} = ${R}.`];}
  else if(factor===7){h2=`Sépare 7 en 5 + 2.`;h3=`${A} × 5 = ${a*5} et ${A} × 2 = ${a*2}. Additionne les deux résultats.`;steps=[`${A} × 5 = ${a*5}.`,`${A} × 2 = ${a*2}.`,`${a*5} + ${a*2} = ${R}.`];}
  else if(factor===8){h2=`Double ${A}.`;h3=`Continue les doubles : ${A} → ${a*2} → ${a*4} → ____.`;steps=[`${A} × 2 = ${a*2}.`,`${a*2} × 2 = ${a*4}.`,`${a*4} × 2 = ${R}.`];}
  else {h2=`Calcule ${A} × 10.`;h3=`${A} × 10 = ${a*10}. Retire un groupe de ${A}.`;steps=[`${A} × 10 = ${a*10}.`,`${a*10} − ${A} = ${R}.`];}
 }else if(f==='fixed-divide'){
  const factor=b,q=p.answers[0];
  if(factor===2){h2=`Partage ${A} en deux groupes égaux.`;h3=`Cherche la moitié de ${A}.`;steps=[`La moitié de ${A} est ${R}.`,`${A} : 2 = ${R}.`];}
  else if(factor===4){h2=`Prends la moitié de ${A}.`;h3=`La moitié de ${A} est ${a/2}. Prends encore la moitié.`;steps=[`${A} : 2 = ${a/2}.`,`${a/2} : 2 = ${R}.`];}
  else if(factor===5){h2=`Double ${A}.`;h3=`${A} × 2 = ${a*2}. Divise ce résultat par 10.`;steps=[`${A} × 2 = ${a*2}.`,`${a*2} : 10 = ${R}.`];}
  else if(factor===6){h2=`Divise d’abord ${A} par 3.`;h3=`${A} : 3 = ${a/3}. Prends ensuite la moitié.`;steps=[`${A} : 3 = ${a/3}.`,`${a/3} : 2 = ${R}.`];}
  else if(factor===8){h2=`Prends la moitié de ${A}.`;h3=`Continue les moitiés : ${A} → ${a/2} → ${a/4} → ____.`;steps=[`${A} : 2 = ${a/2}.`,`${a/2} : 2 = ${a/4}.`,`${a/4} : 2 = ${R}.`];}
  else if(factor===9){h2=`Cherche un nombre qui, multiplié par 10 puis diminué de lui-même, donne ${A}.`;h3=`____ × 10 − ____ = ${A}.`;steps=[`${q} × 10 = ${q*10}.`,`${q*10} − ${q} = ${A}.`,`Donc ${A} : 9 = ${R}.`];}
  else {h2=`Cherche ${factor} × ____ = ${A}.`;h3=`Utilise le livret de ${factor} pour retrouver le facteur manquant.`;steps=[`${factor} × ${R} = ${A}.`,`Donc ${A} : ${factor} = ${R}.`];}
 }else if(f==='divide4'){
  h2=`Prends d’abord la moitié de ${A}.`;h3=`La moitié de ${A} est ${fmt(a/2)}. Prends encore la moitié de ${fmt(a/2)}.`;
  steps=[`${A} : 2 = ${fmt(a/2)}.`,`${fmt(a/2)} : 2 = ${R}. Prendre deux moitiés revient à diviser par 4.`];
 }else if(f==='divide5'){
  h2=`Double d’abord ${A} : ${A} × 2 = □.`;h3=`Le double de ${A} est ${a*2}. Divise maintenant ${a*2} par 10.`;
  steps=[`${A} × 2 = ${a*2}.`,`${a*2} : 10 = ${R}. Doubler puis diviser par 10 revient à diviser par 5.`];
 }else if(f==='division-decompose'){
  const q=a/b,part=Math.floor(q/10)*10*b,rest=a-part;
  h2=`Décompose ${A} : ${part} + ${rest}. Commence par ${part} : ${B}.`;
  h3=`${part} : ${B} = ${part/b}. Ajoute le résultat de ${rest} : ${B}.`;
  steps=[`${A} = ${part} + ${rest}.`,`${part} : ${B} = ${part/b} et ${rest} : ${B} = ${rest/b}.`,`${part/b} + ${rest/b} = ${R}.`];
 }else if(f==='decimal-add'||f==='decimal-sub'){
  const at=Math.round(a*10),bt=Math.round(b*10);h2=`${A}, c’est ${at} dixièmes. ${B}, c’est ${bt} dixièmes.`;
  h3=`Calcule ${at} ${signs[op]} ${bt} = □ dixièmes. Puis écris le nombre décimal.`;
  const total=op==='+'?at+bt:at-bt;steps=[`Je calcule en dixièmes : ${at} ${signs[op]} ${bt} = ${total}.`,`${total} dixièmes = ${R}.`];
 }else if(f==='decimal-times10'||f==='decimal-divide10'||f==='times-power'||f==='divide-power'){
  const places=Math.round(Math.log10(b)),plural=places>1?'s':'',multiply=op==='*',direction=multiply?'droite':'gauche',zeros='0'.repeat(places);
  if((f==='times-power'||f==='divide-power')&&p.level===1){
   h2=multiply?`Multiplier par 10 rend chaque chiffre 10 fois plus grand.`:`Diviser par 10 rend chaque chiffre 10 fois plus petit.`;
   h3=multiply?`Comme ${A} est entier, ajoute ${places} zéro${plural} à sa droite : ${A}${zeros}.`:`Le partage est exact : retire ${places} zéro${plural} à droite de ${A}.`;
  }else{
   h2=`Repère la virgule de ${A}${Number.isInteger(a)?', placée après les unités':''}.`;
   h3=`Pour ${multiply?'multiplier':'diviser'} par ${B}, déplace la virgule de ${places} place${plural} vers la ${direction}. Complète les places vides avec des zéros.`;
  }
  const action=multiply?'vers une valeur plus grande':'vers une valeur plus petite';
  steps=[`Chaque chiffre se déplace de ${places} rang${plural} ${action}.`,`La virgule se retrouve ${places} place${plural} plus à ${direction}.`,`${A} ${signs[op]} ${B} = ${R}.`];
 }else if(f==='tens-add'||f==='tens-sub'){
  h2=`Compte les dizaines : ${a/10} ${signs[op]} ${b/10} = □ dizaines.`;
  h3=`Effectue le petit calcul, puis transforme les dizaines en unités.`;
  steps=[`${a/10} ${signs[op]} ${b/10} = ${p.answers[0]/10} dizaines.`,`${p.answers[0]/10} dizaines = ${R}.`];
 }else if(op==='+'&&(f==='mental-add'||f==='hundreds-add'||f==='double-large')){
  const base=a>=100||b>=100?100:10,part=Math.floor(b/base)*base,rest=b-part;
  h2=`Sépare ${B} en ${part} et ${rest}. Ajoute d’abord ${part} à ${A}.`;
  h3=`${A} + ${part} = ${a+part}. Ajoute encore ${rest} : ${a+part} + ${rest} = □.`;
  steps=[`${B} = ${part} + ${rest}.`,`${A} + ${part} = ${a+part}.`,`${a+part} + ${rest} = ${R}.`];
 }else if(op==='-'&&(f==='mental-sub'||f==='hundreds-sub')){
  const base=a>=100?100:10,part=Math.floor(b/base)*base,rest=b-part;
  h2=`Sépare ${B} en ${part} et ${rest}. Retire d’abord ${part}.`;
  h3=`${A} − ${part} = ${a-part}. Retire encore ${rest} : ${a-part} − ${rest} = □.`;
  steps=[`${B} = ${part} + ${rest}.`,`${A} − ${part} = ${a-part}.`,`${a-part} − ${rest} = ${R}.`];
 }else if(f==='mental-multiply'){
  const tens=Math.floor(a/10)*10,ones=a-tens;h2=`Sépare ${A} en ${tens} et ${ones}. Calcule ${tens} × ${B}.`;
  h3=`${tens} × ${B} = ${tens*b}. Ajoute le résultat de ${ones} × ${B}.`;
  steps=[`${A} = ${tens} + ${ones}.`,`${tens} × ${B} = ${tens*b} et ${ones} × ${B} = ${ones*b}.`,`${tens*b} + ${ones*b} = ${R}.`];
 }else if(op==='*'){
  const first=a>5?5:Math.max(1,a-1),rest=a-first;
  h2=`Calcule d’abord ${first} × ${B}. Combien de groupes restent à compter ?`;
  h3=`${first} × ${B} = ${first*b}. Ajoute ${rest} groupe(s) de ${B} : ${first*b} + ${rest} × ${B} = □.`;
  steps=[`${A} groupes = ${first} groupes + ${rest} groupe(s).`,`${first} × ${B} = ${first*b} ; ${rest} × ${B} = ${rest*b}.`,`${first*b} + ${rest*b} = ${R}.`];
 }else if(op==='/'){
  h2=`Cherche ${B} × □ = ${A}.`;
  const q=a/b,first=q>=10?10:q>=5?5:Math.max(1,q-1),rest=a-first*b;
  h3=`${B} × ${first} = ${first*b}. Il reste ${rest} à répartir en groupes de ${B}.`;
  steps=[`${B} × ${R} = ${A}.`,`Donc ${A} : ${B} = ${R}.`];
 }else if(op==='+'){
  const start=Math.max(a,b),jump=Math.min(a,b);
  h2=`Pars de ${fmt(start)}. Avance de ${fmt(jump)} unité(s).`;
  h3=jump>1?`Ajoute d’abord 1 : ${start} + 1 = ${start+1}. Avance encore de ${jump-1} unité(s).`:`Ajoute une unité à ${start}. Quel nombre vient juste après ?`;
  steps=[`Je pars de ${start} et j’avance de ${jump}.`,`${A} + ${B} = ${R}.`];
 }else{
  h2=`Pars de ${A} et recule de ${B} unité(s).`;
  h3=b>1?`Retire d’abord 1 : ${A} − 1 = ${a-1}. Retire encore ${b-1}.`:`Retire une unité de ${A}. Quel nombre vient juste avant ?`;
  steps=[`Je retire ${B} de ${A}.`,`${A} − ${B} = ${R}.`,`Vérification : ${R} + ${B} = ${A}.`];
 }
 return {h2:h2.replaceAll('□','____'),h3:h3.replaceAll('□','____'),steps:steps.map(step=>step.replaceAll('□','____'))};
}
function diagram(p){
 const {a,b,op,kind,unit}=p;let content='',label='',height=136;
 const text=(x,y,t,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="18" fill="#20332e">${esc(t)}</text>`;
 const dots=(count,x,y,width,heightLimit,max=24,color='#36765c')=>{
  const shown=Math.min(Math.max(0,Math.floor(count)),max),cols=Math.max(1,Math.min(12,Math.ceil(Math.sqrt(Math.max(1,shown)*width/Math.max(1,heightLimit))))),rows=Math.max(1,Math.ceil(shown/cols));
  const dx=width/(cols+1),dy=heightLimit/(rows+1);let out='';
  for(let i=0;i<shown;i++)out+=`<circle cx="${x+dx*(i%cols+1)}" cy="${y+dy*(Math.floor(i/cols)+1)}" r="6" fill="${color}"/>`;
  if(count>max)out+=text(x+width-7,y+heightLimit-5,`… ${fmt(count)} objets`,'end');
  return out;
 };
 const divisionPicture=()=>{
  const groups=Math.max(1,Math.floor(b)),quotient=Math.floor(a/b),remainder=Math.round((a-quotient*b)*1e8)/1e8,shownGroups=Math.min(groups,8),gap=7,areaWidth=500,boxWidth=(areaWidth-gap*(shownGroups-1))/shownGroups;
  height=remainder>0?350:270;
  let out=text(30,22,`1 · Le tas de ${fmt(a)} objets`,'start');
  out+=`<rect x="30" y="32" width="500" height="72" rx="12" fill="#f8f4e8" stroke="#326c58" stroke-width="2"/>${dots(a,35,37,490,62,30)}`;
  out+=`<path d="M280 108 V126" stroke="#326c58" stroke-width="3"/><path d="M272 119 L280 128 L288 119" fill="none" stroke="#326c58" stroke-width="3"/>`;
  out+=text(30,151,`2 · Je partage en ${fmt(b)} groupes égaux`,'start');
  for(let i=0;i<shownGroups;i++){
   const x=30+i*(boxWidth+gap);out+=`<rect x="${x}" y="162" width="${boxWidth}" height="72" rx="9" fill="${i%2?'#f8ead1':'#e4eee7'}" stroke="#326c58"/>`;
   out+=dots(quotient,x+4,168,boxWidth-8,54,6,i%2?'#a86420':'#326c58');
   if(quotient>6)out+=text(x+boxWidth/2,229,'…');
  }
  if(groups>shownGroups)out+=text(530,254,`Quelques groupes sont dessinés sur ${fmt(groups)}.`,'end');
  if(remainder>0){
   out+=text(30,269,'Objets qui restent à part :','start');out+=dots(remainder,245,248,170,45,12,'#9a4638');
   out+=`<rect x="80" y="302" width="400" height="38" rx="9" fill="#fff0da" stroke="#9a4638"/>${text(280,328,`${fmt(a)} = ${fmt(b)} × ${fmt(quotient)} + ${fmt(remainder)}`)}`;
  }
  return out;
 };
 const powerShiftPicture=()=>{
  const places=Math.round(Math.log10(b)),multiply=op==='*',direction=multiply?'droite':'gauche',result=fmt(p.answers[0]);height=190;
  let out=text(280,25,`${multiply?'Je multiplie':'Je divise'} par ${fmt(b)} : ${places} déplacement${places>1?'s':''}`);
  out+=`<rect x="40" y="48" width="170" height="58" rx="12" fill="#e4eee7" stroke="#326c58" stroke-width="2"/>${text(125,84,fmt(a))}`;
  out+=`<path d="M225 77 H335" stroke="#9a4638" stroke-width="4" marker-end="url(#power-arrow-${esc(p.code)})"/><defs><marker id="power-arrow-${esc(p.code)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#9a4638"/></marker></defs>`;
  out+=text(280,59,`${places} place${places>1?'s':''} vers la ${direction}`);
  out+=`<rect x="350" y="48" width="170" height="58" rx="12" fill="#f8ead1" stroke="#9a4638" stroke-width="2"/>${text(435,84,result)}`;
  const zeroRule=Number.isInteger(a)&&Number.isInteger(p.answers[0])?(multiply?`Entier : j’ajoute ${places} zéro${places>1?'s':''}.`:`Partage exact : je retire ${places} zéro${places>1?'s':''}.`):`Je complète avec des zéros si une place est vide.`;
  out+=text(280,140,`La virgule se déplace vers la ${direction}.`)+text(280,171,zeroRule);
  label=`Valeur de position : pour ${multiply?'multiplier':'diviser'} par ${fmt(b)}, la virgule se déplace de ${places} place${places>1?'s':''} vers la ${direction}. ${zeroRule}`;
  return out;
 };
 const decompositionPicture=()=>{
  const tens=Math.floor(a/10)*10,ones=a-tens;height=185;
  let out=text(280,24,`Je décompose ${fmt(a)} en ${fmt(tens)} + ${fmt(ones)}`);
  out+=`<rect x="35" y="48" width="220" height="52" rx="10" fill="#e4eee7" stroke="#326c58"/>${text(145,80,`${fmt(tens)} × ${fmt(b)} = ${fmt(tens*b)}`)}`;
  out+=`<rect x="305" y="48" width="220" height="52" rx="10" fill="#f8ead1" stroke="#9a4638"/>${text(415,80,`${fmt(ones)} × ${fmt(b)} = ${fmt(ones*b)}`)}`;
  out+=text(280,132,'J’additionne les deux produits')+text(280,166,`${fmt(tens*b)} + ${fmt(ones*b)} = ${fmt(p.answers[0])}`);
  label=`Décomposition : ${fmt(a)} devient ${fmt(tens)} plus ${fmt(ones)}. Je multiplie chaque partie par ${fmt(b)}, puis j’additionne.`;return out;
 };
 const hundredsPicture=()=>{
  const result=p.answers[0],parts=n=>[Math.floor(n/100),Math.floor((n%100)/10),clean(n%10)],rows=[[fmt(a),...parts(a)],[`${signs[op]} ${fmt(b)}`,...parts(b)],[`= ${fmt(result)}`,...parts(result)]];height=235;
  let out=text(280,24,'Je regarde la valeur de chaque chiffre');
  const cols=[70,235,350,465],heads=['Nombre','C','D','U'];
  for(let i=0;i<4;i++){out+=`<rect x="${cols[i]-(i?48:62)}" y="42" width="${i?96:124}" height="36" fill="#dfece4" stroke="#326c58"/>${text(cols[i],67,heads[i])}`;}
  rows.forEach((row,r)=>{const y=78+r*44,fill=r===2?'#f8ead1':'#fffdf7';for(let i=0;i<4;i++){out+=`<rect x="${cols[i]-(i?48:62)}" y="${y}" width="${i?96:124}" height="44" fill="${fill}" stroke="#9baea3"/>${text(cols[i],y+29,String(row[i]))}`;}});
  out+=text(280,226,'C = centaines · D = dizaines · U = unités');
  label=`Tableau de numération : ${fmt(a)} ${signs[op]} ${fmt(b)} = ${fmt(result)}. Les centaines, dizaines et unités gardent leur valeur.`;return out;
 };
 const tenthsPicture=()=>{
  const result=p.answers[0],parts=n=>[Math.floor(n),Math.round((n-Math.floor(n))*10)%10],rows=[[fmt(a),...parts(a)],[`${signs[op]} ${fmt(b)}`,...parts(b)],[`= ${fmt(result)}`,...parts(result)]],tenths=parts(result)[1];height=270;
  let out=text(280,24,'Je calcule avec les unités et les dixièmes');
  const cols=[105,300,450],heads=['Nombre','unités','dixièmes'];
  for(let i=0;i<3;i++){out+=`<rect x="${cols[i]-70}" y="42" width="140" height="36" fill="#dfece4" stroke="#326c58"/>${text(cols[i],67,heads[i])}`;}
  rows.forEach((row,r)=>{const y=78+r*40,fill=r===2?'#f8ead1':'#fffdf7';for(let i=0;i<3;i++){out+=`<rect x="${cols[i]-70}" y="${y}" width="140" height="40" fill="${fill}" stroke="#9baea3"/>${text(cols[i],y+27,String(row[i]))}`;}});
  for(let i=0;i<10;i++)out+=`<rect x="80" y="212" width="40" height="32" transform="translate(${i*40} 0)" fill="${i<tenths?'#9fc7ad':'#fff'}" stroke="#326c58"/>`;
  out+=text(280,264,`${tenths} dixième${tenths>1?'s':''} colorié${tenths>1?'s':''} dans l’unité suivante`);
  label=`Tableau unités-dixièmes : ${fmt(a)} ${signs[op]} ${fmt(b)} = ${fmt(result)}. La bande partage une unité en dix parts égales.`;return out;
 };
 const graduatedLine=()=>{
  const finish=kind==='complement'?a:op==='+'?a+b:a-b,start=kind==='complement'?b:a,largest=Math.max(start,finish,a,b,1);
  const decimal=p.code.startsWith('CD'),integerJump=Number.isInteger(start)&&Number.isInteger(finish)&&Number.isInteger(b),unitZoom=!decimal&&p.code.startsWith('DC')&&integerJump&&Math.abs(finish-start)<=40&&(Math.abs(finish-start)%10!==0||start%10!==0||finish%10!==0);let step=decimal?0.1:unitZoom?1:p.code.startsWith('DC')?(largest>120?100:10):1;
  let axisMin=decimal?Math.floor(Math.min(start,finish)*10)/10:unitZoom?Math.max(0,Math.floor((Math.min(start,finish)-2)/10)*10):0,axisMax=decimal?Math.ceil(Math.max(start,finish)*10)/10:unitZoom?Math.ceil((Math.max(start,finish)+2)/10)*10:Math.ceil(largest/step)*step;
  if(decimal){axisMin=clean(Math.max(0,axisMin-0.1));axisMax=clean(axisMax+0.1);}else if(axisMax===largest)axisMax+=step;
  const tickLimit=unitZoom?50:p.code.startsWith('PC')?22:12;if(!decimal&&!unitZoom)while((axisMax-axisMin)/step>tickLimit)step*=2;
  axisMax=Math.max(axisMin+step,Math.ceil(axisMax/step)*step);const x=v=>45+470*(v-axisMin)/(axisMax-axisMin);
  const sx=x(start),fx=x(finish),same=Math.abs(start-finish)<1e-8,closeLabels=!same&&Math.abs(sx-fx)<115;height=closeLabels?194:174;let out=`<defs><marker id="arrow-${esc(p.code)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#9a4638"/></marker></defs>`;
  out+=`<line x1="45" x2="515" y1="92" y2="92" stroke="#20332e" stroke-width="3"/>`;
  const tickCount=Math.round((axisMax-axisMin)/step),labelEvery=decimal?Math.max(1,Math.ceil(tickCount/10)):unitZoom?5:1;for(let i=0;i<=tickCount;i++){const value=clean(axisMin+i*step),px=x(value),showLabel=i%labelEvery===0||Math.abs(value-start)<1e-8||Math.abs(value-finish)<1e-8,major=showLabel||unitZoom&&value%10===0;out+=`<line x1="${px}" x2="${px}" y1="${major?81:86}" y2="${major?103:98}" stroke="#20332e" stroke-width="${major?2:1}"/>${showLabel?text(px,124,fmt(value)):''}`;}
  const operation=kind==='complement'?`+ ${fmt(a-b)}`:`${op==='+'?'+':'−'} ${fmt(b)}`;
  if(same)out+=`<circle cx="${sx}" cy="61" r="13" fill="none" stroke="#9a4638" stroke-width="3"/>${text(sx,38,'Je reste ici')}`;
  else out+=`<path d="M${sx} 76 Q${(sx+fx)/2} 25 ${fx} 76" fill="none" stroke="#9a4638" stroke-width="4" marker-end="url(#arrow-${esc(p.code)})"/>${text((sx+fx)/2,34,operation)}`;
  out+=same?`<circle cx="${sx}" cy="92" r="6" fill="#9a4638"/>${text(sx,151,fmt(start))}`:`<circle cx="${sx}" cy="92" r="6" fill="#205f89"/><circle cx="${fx}" cy="92" r="6" fill="#9a4638"/>${text(sx,151,`départ ${fmt(start)}`)}${text(fx,closeLabels?178:151,`arrivée ${fmt(finish)}`)}`;
  const unitLabel=step===0.1?'un dixième':step===1?'une unité':step===10?'une dizaine':step===100?'une centaine':fmt(step)+' unités';
  label=`Droite graduée : chaque graduation vaut ${unitLabel}. Je pars de ${fmt(start)} et j’arrive à ${fmt(finish)}.`;
  return out;
 };
 if(kind==='estimate'){
  const lo=Math.floor(a/unit)*unit,hi=lo+unit,pos=55+450*(a-lo)/unit;
  content=`<line x1="55" x2="505" y1="74" y2="74" stroke="#326c58" stroke-width="3"/><circle cx="${pos}" cy="74" r="7" fill="#b1691d"/>${text(55,108,lo)}${text(505,108,hi)}${text(pos,45,fmt(a))}`;
  label=`${fmt(a)} se situe entre ${lo} et ${hi}. Quel repère est le plus proche ?`;
 }else if(['times-power','divide-power','decimal-times10','decimal-divide10'].includes(p.family)){
  content=powerShiftPicture();
 }else if(op==='/'){
  content=divisionPicture();label=`Deux étapes : je vois d’abord ${fmt(a)} objets, puis je les partage en ${fmt(b)} groupes égaux${kind==='remainder'?' en laissant les objets restants à part':''}.`;
  if(kind==='remainder')label+=` Je vérifie avec ${fmt(a)} = ${fmt(b)} × ${fmt(p.answers[0])} + ${fmt(p.answers[1])}.`;
 }else if(p.family==='mental-multiply'){
  content=decompositionPicture();
 }else if(p.family==='times25'){
  height=225;content=text(280,25,'Quatre groupes de 25 forment 100');for(let i=0;i<4;i++)content+=`<rect x="${55+i*115}" y="48" width="95" height="54" rx="10" fill="${i%2?'#f8ead1':'#e4eee7'}" stroke="#326c58"/>${text(102+i*115,82,'25')}`;content+=text(280,128,'25 + 25 + 25 + 25 = 100')+`<rect x="80" y="150" width="400" height="46" rx="10" fill="#fff0da" stroke="#9a4638"/>${text(280,181,`${fmt(a)} × 25 = (${fmt(a)} × 100) : 4 = ${fmt(p.answers[0])}`)}`;label=`Quatre groupes de 25 forment 100. Pour multiplier ${fmt(a)} par 25, je multiplie par 100 puis je divise par 4.`;
 }else if(p.family==='zero-multiply'){
  height=145;content=text(280,28,b===0?'Chaque groupe est vide':'Un seul exemplaire de chaque objet')+`<rect x="80" y="48" width="400" height="58" rx="12" fill="#e4eee7" stroke="#326c58"/>`+(b===0?text(280,83,'0 objet'):dots(a,90,53,380,48,20))+text(280,135,`${fmt(a)} × ${fmt(b)} = ${fmt(p.answers[0])}`);label=b===0?'Multiplier par zéro donne une collection vide.':'Multiplier par un conserve la quantité.';
 }else if(op==='*'&&Number.isInteger(a)&&Number.isInteger(b)&&a>0&&b>0&&a<=10&&b<=10){
  height=54+a*25;for(let row=0;row<a;row++)for(let col=0;col<b;col++)content+=`<circle cx="${35+col*30}" cy="${25+row*25}" r="8" fill="#36765c"/>`;
  content+=text(385,Math.min(70,height-20),`${a} groupes de ${b}`);label=`${a} lignes de ${b} jetons. Compte ou utilise un produit connu.`;
 }else if(['hundreds-add','hundreds-sub'].includes(p.family)){
  content=hundredsPicture();
 }else if(['decimal-add','decimal-sub'].includes(p.family)){
  content=tenthsPicture();
 }else if((op==='+'||op==='-')&&a+b>0){
  content=graduatedLine();
 }else{
  content=`<rect x="40" y="26" width="480" height="64" rx="10" fill="#e4eee7" stroke="#326c58"/>${text(280,66,p.prompt+' = ?')}`;
  label=`Représente ${p.prompt} avec des groupes ou un tableau de numération.`;
 }
 return `<figure class="hint-figure"><svg viewBox="0 0 560 ${height}" role="img" aria-label="${esc(label)}">${content}</svg><figcaption>${esc(label)}</figcaption></figure>`;
}
function summary(questions,records){
 const list=catalog.skills.filter(s=>questions.some(q=>q.code===s.code)).map(s=>{const planned=questions.filter(q=>q.code===s.code).length,done=records.filter(r=>r.code===s.code),practice=done.filter(r=>r.phase!=='validation'),validation=done.filter(r=>r.phase==='validation');return {code:s.code,title:s.title,planned,done:done.length,independent:practice.filter(r=>r.correct&&r.hints===0).length,aided:practice.filter(r=>r.correct&&r.hints>0).length,corrected:practice.filter(r=>!r.correct).length,validationDone:validation.length,validationCorrect:validation.filter(r=>r.correct).length};});
 const validation=records.filter(r=>r.phase==='validation');
 return {planned:questions.length,done:records.length,independent:list.reduce((n,r)=>n+r.independent,0),aided:list.reduce((n,r)=>n+r.aided,0),corrected:list.reduce((n,r)=>n+r.corrected,0),validationDone:validation.length,validationCorrect:validation.filter(r=>r.correct).length,skills:list};
}
const api={catalog,byCode,fmt,esc,poolFor,makeProblem,generate,completeSession,grade,answerText,strategy,diagram,summary,numeric};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.MentalEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
