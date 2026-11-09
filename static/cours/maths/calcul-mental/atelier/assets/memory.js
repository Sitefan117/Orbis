(()=>{'use strict';const chapter=document.querySelector('#memo-chapter'),skill=document.querySelector('#memo-skill'),courseChecks=[...document.querySelectorAll('[data-course-skill]')],courseCount=document.querySelector('#course-count'),courseError=document.querySelector('#course-error');
function filter(){document.querySelectorAll('.memo-page').forEach(p=>p.hidden=(chapter.value!=='all'&&p.dataset.chapter!==chapter.value)||(skill.value!=='all'&&p.id!==skill.value));document.querySelectorAll('#memo-skill option[data-chapter]').forEach(o=>o.hidden=chapter.value!=='all'&&o.dataset.chapter!==chapter.value);}
chapter.onchange=()=>{skill.value='all';filter();};skill.onchange=filter;
document.querySelector('#memo-print').onclick=()=>window.print();
function updateCourseCount(){const n=courseChecks.filter(c=>c.checked).length;courseCount.textContent=`${n} compétence${n>1?'s':''} sélectionnée${n>1?'s':''}`;courseError.textContent='';}
courseChecks.forEach(c=>c.onchange=updateCourseCount);
document.querySelector('#course-all').onclick=()=>{courseChecks.forEach(c=>c.checked=true);updateCourseCount();};
document.querySelector('#course-none').onclick=()=>{courseChecks.forEach(c=>c.checked=false);updateCourseCount();};
document.querySelector('#course-print').onclick=()=>{const selected=new Set(courseChecks.filter(c=>c.checked).map(c=>c.value));if(!selected.size){courseError.textContent='Choisis au moins une compétence pour créer le cours.';return;}document.querySelectorAll('.memo-page').forEach(p=>p.hidden=!selected.has(p.id));document.querySelector('#course-cover-count').textContent=`${selected.size} compétence${selected.size>1?'s':''} sélectionnée${selected.size>1?'s':''}`;document.body.dataset.printKind='course';window.print();};
window.addEventListener('afterprint',()=>{if(document.body.dataset.printKind==='course'){document.body.removeAttribute('data-print-kind');filter();}});
document.querySelectorAll('[data-open-chapter]').forEach(a=>a.onclick=e=>{e.preventDefault();chapter.value=a.dataset.openChapter;skill.value='all';filter();document.querySelector(a.getAttribute('href')).scrollIntoView();});
function openHash(){const id=location.hash.slice(1),page=document.getElementById(id);if(page?.classList.contains('memo-page')){chapter.value=page.dataset.chapter;skill.value=id;filter();page.scrollIntoView();}}
window.addEventListener('hashchange',openHash);openHash();
})();
