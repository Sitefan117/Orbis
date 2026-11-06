const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'../static/cours/maths/calcul-mental/atelier');
const ctx=vm.createContext({});for(const file of ['catalogue','engine'])vm.runInContext(fs.readFileSync(path.join(root,'assets',file+'.js'),'utf8'),ctx);const E=ctx.MentalEngine;
let cases=0;assert.equal(E.catalog.skills.length,52);assert.equal(new Set(E.catalog.skills.map(s=>s.code)).size,52);
for(const s of E.catalog.skills){assert(s.method1&&s.method2&&s.manipulation);for(const level of [1,2,3]){
 const pool=E.poolFor(s.code,level);assert(pool.length>0);
 for(const spec of pool){const p=E.makeProblem(s.code,spec);cases++;assert(p.answers.every(n=>Number.isFinite(n)&&n>=0),p.key);assert(!(p.op==='/'&&p.b===0));
 let expected=p.op==='+'?p.a+p.b:p.op==='-'?p.a-p.b:p.op==='*'?p.a*p.b:p.a/p.b;
 if(p.kind==='remainder'){assert.equal(p.answers[0]*p.b+p.answers[1],p.a);assert(p.answers[1]>=0&&p.answers[1]<p.b);}
 else if(p.kind==='estimate'){const a=Math.round(p.a/p.unit)*p.unit,b=Math.round(p.b/p.unit)*p.unit;assert.equal(p.answers[0],p.op==='+'?a+b:a-b);assert.equal(p.answers[1],expected);}
 else assert(Math.abs(expected-p.answers[0])<1e-7,p.key);
 assert(E.grade(p,p.answers.map(E.fmt)).correct,p.key);assert(!E.grade(p,p.answers.map(n=>String(n+1))).correct,p.key);assert(!E.grade(p,p.answers.map(()=>'' )).valid);
 const a=E.strategy(p),diagram=E.diagram(p);assert(a.h2&&a.h3&&a.steps.length>=2);for(const text of [p.prompt,a.h2,a.h3,...a.steps,diagram]){assert(!/undefined|NaN|Infinity/.test(text),p.key);assert(!text.includes('□'),p.key);}
 if(p.op==='/'){assert(diagram.includes('1 · Le tas de'),p.key);assert(diagram.includes('2 · Je partage en'),p.key);}
 if((p.op==='+'||p.op==='-')&&p.kind!=='estimate')assert(diagram.includes('Droite graduée'),p.key);
 }
 for(const n of [10,20,30])for(const mode of ['print','drill']){const qs=E.generate([s.code],level,n,mode);assert.equal(qs.length,n);assert(qs.every(q=>q.code===s.code));}
}}
for(const size of [1,3,7,10,20,30])for(const n of [10,20,30]){const codes=E.catalog.skills.slice(0,size).map(s=>s.code);if(size>n){assert.throws(()=>E.generate(codes,2,n));continue;}
 const qs=E.generate(codes,2,n,'print');assert.equal(qs.length,n);const counts=codes.map(c=>qs.filter(q=>q.code===c).length);assert(Math.max(...counts)-Math.min(...counts)<=1);assert(counts.every(n=>n>=1));assert.equal(new Set(qs.map(q=>q.code)).size,size);
 const indices=qs.map(q=>codes.indexOf(q.code));assert(indices.every((n,i)=>i===0||n>=indices[i-1]));}
for(const codes of [[],['UNKNOWN']])assert.throws(()=>E.generate(codes,1,10));
assert.equal(E.numeric(' 2,5 '),2.5);for(const raw of ['','2e3','1/2','NaN','2,3,4'])assert.equal(E.numeric(raw),null);
const qs=E.generate(['PC01','DM02'],1,10);const sum=E.summary(qs,[{code:'PC01',correct:true,hints:0},{code:'PC01',correct:true,hints:2},{code:'DM02',correct:false,hints:0}]);
assert.equal(sum.done,3);assert.equal(sum.independent,1);assert.equal(sum.aided,1);assert.equal(sum.corrected,1);assert.equal(sum.planned,10);
const memo=fs.readFileSync(path.join(root,'aide-memoire.html'),'utf8');for(const s of E.catalog.skills)assert(memo.includes('id="'+s.code+'"'));
assert(!memo.includes('□'));assert(memo.includes('Orientation portrait nécessaire'));
const app=fs.readFileSync(path.join(root,'assets','app.js'),'utf8');assert(app.includes('Clavier numérique intégré'));assert(app.includes("$('#select-all')"));assert(!app.includes('class="chapter" open'));
console.log(`Calcul mental : ${cases} calculs vérifiés, 52 compétences × 3 niveaux, séries équilibrées, corrections, aides et bilans.`);
