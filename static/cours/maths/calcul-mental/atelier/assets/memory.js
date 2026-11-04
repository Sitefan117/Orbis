(()=>{'use strict';const chapter=document.querySelector('#memo-chapter'),skill=document.querySelector('#memo-skill');
function filter(){document.querySelectorAll('.memo-page').forEach(p=>p.hidden=(chapter.value!=='all'&&p.dataset.chapter!==chapter.value)||(skill.value!=='all'&&p.id!==skill.value));document.querySelectorAll('#memo-skill option[data-chapter]').forEach(o=>o.hidden=chapter.value!=='all'&&o.dataset.chapter!==chapter.value);}
chapter.onchange=()=>{skill.value='all';filter();};skill.onchange=filter;
document.querySelector('#memo-print').onclick=()=>window.print();
document.querySelectorAll('[data-open-chapter]').forEach(a=>a.onclick=e=>{e.preventDefault();chapter.value=a.dataset.openChapter;skill.value='all';filter();document.querySelector(a.getAttribute('href')).scrollIntoView();});
function openHash(){const id=location.hash.slice(1),page=document.getElementById(id);if(page?.classList.contains('memo-page')){chapter.value=page.dataset.chapter;skill.value=id;filter();page.scrollIntoView();}}
window.addEventListener('hashchange',openHash);openHash();
})();
