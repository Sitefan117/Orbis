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
 case 'times-power':for(const n of range([1,10,10][L],[9,39,99][L]))for(const d of (L===0?[10]:[10,100]))add(n,d,'*');break;
 case 'fixed-multiply':for(const n of range([1,1,4][L],[5,9,10][L]))add(n,s.factor,'*');break;
 case 'fixed-divide':for(const n of range([1,1,4][L],[5,9,10][L]))add(n*s.factor,s.factor,'/');break;
 case 'division-table':for(const d of range(2,[4,6,9][L]))for(const q of range(1,[5,9,9][L]))add(q*d,d,'/');break;
 case 'remainder':for(const d of range(2,[4,6,9][L]))for(const q of range(1,[4,8,12][L]))for(const r of range(1,d-1))add(q*d+r,d,'/','remainder');break;
 case 'divide4':case 'divide5': {const d=f==='divide4'?4:5;for(const q of range([2,5,10][L],[6,12,25][L]))add(q*d,d,'/');break;}
 case 'division-decompose':for(const d of range(2,[3,5,6][L]))for(const q of range([11,12,15][L],[19,29,49][L]))add(q*d,d,'/');break;
 case 'divide-power':for(const n of range([1,10,10][L],[9,39,99][L]))for(const d of (L===0?[10]:[10,100]))add(n*d,d,'/');break;
 case 'decimal-add':for(const a of range([1,11,15][L],[8,29,75][L]))for(const b of range([1,1,5][L],[8,9,35][L]))if(L!==0||a+b<=10)add(a/10,b/10,'+');break;
 case 'decimal-sub':for(const a of range([2,10,15][L],[9,39,79][L]))for(const b of range([1,1,5][L],[8,9,39][L]))if(a>b)add(a/10,b/10,'-');break;
 case 'decimal-times10':for(const n of range([1,11,11][L],[9,49,99][L]))add(n/10,10,'*');break;
 case 'decimal-divide10':for(const n of range([1,11,11][L],[9,49,99][L]))add(n,10,'/');break;
 default:throw Error('Famille non gérée : '+f);
 }
 if(!p.length)throw Error('Aucun calcul disponible.');cache.set(key,p);return p;
}
function makeProblem(code,spec){
 const s=byCode.get(code),{a,b,op,kind='number',unit=0}=spec;
 const result=clean(op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b);
 let answers=[result], labels=['Réponse'],prompt=`${fmt(a)} ${signs[op]} ${fmt(b)}`;
 if(kind==='complement')prompt=`${fmt(b)} + □ = ${fmt(a)}`;
 if(kind==='remainder'){answers=[Math.floor(a/b),a%b];labels=['Quotient','Reste'];prompt=`${fmt(a)} : ${fmt(b)}`;}
 if(kind==='estimate'){const ra=Math.round(a/unit)*unit,rb=Math.round(b/unit)*unit;answers=[op==='+'?ra+rb:ra-rb,result];labels=['Estimation','Résultat exact'];}
 return {code,family:s.family,a,b,op,kind,unit,answers,labels,prompt,key:`${code}:${a}:${op}:${b}:${kind}`};
}
function shuffled(xs,rng=Math.random){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function generate(codes,level,count,mode='drill',rng=Math.random){
 if(![10,20,30].includes(count))throw Error('Choisis 10, 20 ou 30 calculs.');
 if(![1,2,3].includes(level))throw Error('Choisis un niveau de 1 à 3.');
 if(!['print','drill'].includes(mode))throw Error('Choisis un mode de travail.');
 const selected=catalog.skills.filter(s=>codes.includes(s.code));
 if(!selected.length)throw Error('Coche au moins une compétence.');
 if(selected.length!==new Set(codes).size)throw Error('Une compétence sélectionnée est inconnue.');
 if(selected.length>count)throw Error(`Tu as coché ${selected.length} compétences pour ${count} calculs. Augmente le nombre de calculs ou réduis la sélection.`);
 const extras=new Set(shuffled(selected.map(s=>s.code),rng).slice(0,count%selected.length));let qs=[];
 for(const s of selected){const n=Math.floor(count/selected.length)+(extras.has(s.code)?1:0);let bag=[],last='';for(let i=0;i<n;i++){
  if(!bag.length){bag=shuffled(poolFor(s.code,level),rng);if(bag.length>1){let item=makeProblem(s.code,bag[bag.length-1]);if(item.key===last)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];}}
  const p=makeProblem(s.code,bag.pop());qs.push(p);last=p.key;
 }}
 if(mode==='drill'){qs=shuffled(qs,rng);for(let i=1;i<qs.length;i++)if(qs[i].key===qs[i-1].key){const j=qs.findIndex((q,j)=>j>i&&q.key!==qs[i-1].key&&(j===qs.length-1||qs[j+1].key!==qs[i].key));if(j>i)[qs[i],qs[j]]=[qs[j],qs[i]];}}
 return qs;
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
 }else if(f==='decimal-times10'){
  h2=`${A} correspond à ${Math.round(a*10)} dixièmes. Que devient un dixième multiplié par 10 ?`;
  h3=`Chaque dixième devient une unité. ${Math.round(a*10)} dixièmes deviennent □ unités.`;
  steps=[`${A} = ${Math.round(a*10)} dixièmes.`,`Multipliés par 10, ils deviennent ${R} unités. ${A} × 10 = ${R}.`];
 }else if(f==='decimal-divide10'){
  h2=`Partage ${A} en 10. Une unité partagée en 10 donne des dixièmes.`;h3=`${A} : 10 donne ${A} dixièmes. Écris ce nombre avec une virgule si nécessaire.`;
  steps=[`${A} unités partagées en 10 parts égales donnent ${A} dixièmes par part.`,`${A} dixièmes = ${R}.`];
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
 }else if(f==='times-power'){
  h2=`${A} × ${B} représente ${A} ${b===10?'dizaines':'centaines'}.`;
  h3=`Une ${b===10?'dizaine vaut 10':'centaine vaut 100'} unités. Convertis ${A} ${b===10?'dizaines':'centaines'} en unités.`;
  steps=[`${A} × ${B} = ${A} ${b===10?'dizaines':'centaines'}.`,`Cela fait ${R} unités.`];
 }else if(op==='*'){
  const first=a>=5?5:Math.max(1,a-1),rest=a-first;
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
 return {h2,h3,steps};
}
function diagram(p){
 const {a,b,op,kind,unit}=p;let content='',label='',height=136;
 const text=(x,y,t,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="18" fill="#20332e">${esc(t)}</text>`;
 if(kind==='estimate'){
  const lo=Math.floor(a/unit)*unit,hi=lo+unit,pos=55+450*(a-lo)/unit;
  content=`<line x1="55" x2="505" y1="74" y2="74" stroke="#326c58" stroke-width="3"/><circle cx="${pos}" cy="74" r="7" fill="#b1691d"/>${text(55,108,lo)}${text(505,108,hi)}${text(pos,45,fmt(a))}`;
  label=`${fmt(a)} se situe entre ${lo} et ${hi}. Quel repère est le plus proche ?`;
 }else if(kind==='remainder'){
  content=`<rect x="25" y="20" width="210" height="72" rx="12" fill="#e4eee7" stroke="#326c58"/>${text(130,62,fmt(a)+' objets')}<path d="M250 57 H300" stroke="#326c58" stroke-width="3"/><rect x="315" y="20" width="220" height="72" rx="12" fill="#fff0d6" stroke="#967037"/>${text(425,51,'groupes de '+fmt(b))}${text(425,76,'et des objets restants')}`;
  label=`Répartis ${a} objets en groupes de ${b}. Combien de groupes complets et d’objets restants ?`;
 }else if(op==='*'&&Number.isInteger(a)&&Number.isInteger(b)&&a>0&&b>0&&a<=10&&b<=10){
  height=54+a*25;for(let row=0;row<a;row++)for(let col=0;col<b;col++)content+=`<circle cx="${35+col*30}" cy="${25+row*25}" r="8" fill="#36765c"/>`;
  content+=text(385,Math.min(70,height-20),`${a} groupes de ${b}`);label=`${a} lignes de ${b} jetons. Compte ou utilise un produit connu.`;
 }else if(op==='/'&&kind!=='remainder'&&b<=10){
  const w=480/b;for(let i=0;i<b;i++)content+=`<rect x="${40+i*w}" y="40" width="${w}" height="44" fill="${i%2?'#f8ead1':'#e4eee7'}" stroke="#326c58"/>${text(40+(i+.5)*w,69,'?')}`;
  content+=text(280,25,fmt(a)+' à partager en '+fmt(b));label=`${fmt(a)} à partager en ${b} parts égales. Que contient une part ?`;
 }else if((op==='+'||op==='-')&&a+b>0){
  let total,known,missing,sub;
  if(kind==='complement'){total=a;known=b;missing=a-b;sub=false;}
  else if(op==='+'){total=a+b;known=a;missing=b;sub=false;}
  else{total=a;known=a-b;missing=b;sub=true;}
  const w1=total?480*known/total:0,w2=480-w1;
  content=`<rect x="40" y="42" width="${w1}" height="42" fill="#d9ebdf" stroke="#326c58"/><rect x="${40+w1}" y="42" width="${w2}" height="42" fill="${sub?'#f5ded7':'#fff0d6'}" stroke="#967037"/>`;
  content+=text(40+w1/2,31,sub?'?':fmt(known))+text(40+w1+w2/2,31,kind==='complement'?'?':fmt(missing));
  if(sub)content+=`<path d="M${40+w1+3} 48 L517 78" stroke="#9a4638" stroke-width="2"/>`;
  content+=text(280,116,kind==='complement'?'Total : '+fmt(total):sub?'Au départ : '+fmt(a)+' ; retirer '+fmt(b):'Total à trouver');
  label=kind==='complement'?`Il faut compléter ${fmt(b)} pour atteindre ${fmt(a)}.`:sub?`On retire ${fmt(b)} de ${fmt(a)}. La partie restante est à trouver.`:`On réunit ${fmt(a)} et ${fmt(b)}. Le total est à trouver.`;
 }else{
  content=`<rect x="40" y="26" width="480" height="64" rx="10" fill="#e4eee7" stroke="#326c58"/>${text(280,66,p.prompt+' = ?')}`;
  label=`Représente ${p.prompt} avec des groupes ou un tableau de numération.`;
 }
 return `<figure class="hint-figure"><svg viewBox="0 0 560 ${height}" role="img" aria-label="${esc(label)}">${content}</svg><figcaption>${esc(label)}</figcaption></figure>`;
}
function summary(questions,records){
 const list=catalog.skills.filter(s=>questions.some(q=>q.code===s.code)).map(s=>{const planned=questions.filter(q=>q.code===s.code).length;const done=records.filter(r=>r.code===s.code);return {code:s.code,title:s.title,planned,done:done.length,independent:done.filter(r=>r.correct&&r.hints===0).length,aided:done.filter(r=>r.correct&&r.hints>0).length,corrected:done.filter(r=>!r.correct).length};});
 return {planned:questions.length,done:records.length,independent:list.reduce((n,r)=>n+r.independent,0),aided:list.reduce((n,r)=>n+r.aided,0),corrected:list.reduce((n,r)=>n+r.corrected,0),skills:list};
}
const api={catalog,byCode,fmt,esc,poolFor,makeProblem,generate,grade,answerText,strategy,diagram,summary,numeric};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.MentalEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
