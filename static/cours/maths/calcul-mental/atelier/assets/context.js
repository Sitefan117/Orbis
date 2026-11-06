/* Preserve only the portal display context, without storing learning results. */
(()=>{const student=new URLSearchParams(location.search).get('eleve');if(!student)return;
function update(){document.querySelectorAll('a[href]').forEach(a=>{const u=new URL(a.getAttribute('href'),location.href);if(u.origin===location.origin&&/\/(index|aide-memoire)\.html$/.test(u.pathname)){u.searchParams.set('eleve',student);if(a.href!==u.href)a.href=u.href;}});}
update();new MutationObserver(update).observe(document.querySelector('main'),{childList:true,subtree:true});})();
