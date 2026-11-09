(()=>{'use strict';const courseStyles=document.createElement('link');courseStyles.rel='stylesheet';courseStyles.href='assets/course-print.css';document.head.append(courseStyles);const chapter=document.querySelector('#memo-chapter'),skill=document.querySelector('#memo-skill'),courseChecks=[...document.querySelectorAll('[data-course-skill]')],courseCount=document.querySelector('#course-count'),courseError=document.querySelector('#course-error');
function filter(){document.querySelectorAll('.memo-page').forEach(p=>p.hidden=(chapter.value!=='all'&&p.dataset.chapter!==chapter.value)||(skill.value!=='all'&&p.id!==skill.value));document.querySelectorAll('#memo-skill option[data-chapter]').forEach(o=>o.hidden=chapter.value!=='all'&&o.dataset.chapter!==chapter.value);}
chapter.onchange=()=>{skill.value='all';filter();};skill.onchange=filter;
document.querySelector('#memo-print').onclick=()=>window.print();
function updateCourseCount(){const n=courseChecks.filter(c=>c.checked).length;courseCount.textContent=`${n} compétence${n>1?'s':''} sélectionnée${n>1?'s':''}`;courseError.textContent='';}
const requestedSkills=new Set((new URLSearchParams(location.search).get('skills')||'').split(',').filter(code=>/^([A-Z]{2}\d{2})$/.test(code)));
courseChecks.forEach(c=>{if(requestedSkills.has(c.value))c.checked=true;c.onchange=updateCourseCount;});
updateCourseCount();
document.querySelector('#course-all').onclick=()=>{courseChecks.forEach(c=>c.checked=true);updateCourseCount();};
document.querySelector('#course-none').onclick=()=>{courseChecks.forEach(c=>c.checked=false);updateCourseCount();};
function printCourse(kind){const selected=new Set(courseChecks.filter(c=>c.checked).map(c=>c.value));if(!selected.size){courseError.textContent='Choisis au moins une compétence pour créer le dossier.';return;}document.querySelectorAll('.memo-page').forEach(p=>p.hidden=!selected.has(p.id));document.querySelector('#course-cover-count').textContent=`${selected.size} compétence${selected.size>1?'s':''} sélectionnée${selected.size>1?'s':''}`;document.querySelector('#course-cover-title').textContent=kind==='course-answers'?'Corrigé du dossier':'Mon dossier de calcul mental';document.querySelector('#course-cover-subtitle').textContent=kind==='course-answers'?'Réponses et démarches expliquées, exercices et validations.':'Théorie verte, exercices bleus et validation rouge pour chaque compétence.';document.body.dataset.printKind=kind;window.print();}
document.querySelector('#course-print').onclick=()=>printCourse('course');
document.querySelector('#course-answers').onclick=()=>printCourse('course-answers');
window.addEventListener('afterprint',()=>{if(['course','course-answers'].includes(document.body.dataset.printKind)){document.body.removeAttribute('data-print-kind');filter();}});
document.querySelectorAll('[data-open-chapter]').forEach(a=>a.onclick=e=>{e.preventDefault();chapter.value=a.dataset.openChapter;skill.value='all';filter();document.querySelector(a.getAttribute('href')).scrollIntoView();});
function openHash(){if(location.hash==='#course-builder'){const builder=document.querySelector('.course-builder');if(builder){builder.open=true;builder.scrollIntoView();}return;}const id=location.hash.slice(1),page=document.getElementById(id);if(page?.classList.contains('memo-page')){chapter.value=page.dataset.chapter;skill.value=id;filter();page.scrollIntoView();}}
window.addEventListener('hashchange',openHash);openHash();
})();
