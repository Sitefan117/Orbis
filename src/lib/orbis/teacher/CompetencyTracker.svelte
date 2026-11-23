<script lang="ts">
  import { onMount } from 'svelte';

  type Mark = '' | 'yellow' | 'green' | 'red';
  type Skill = { code: string; label: string; branch: string };
  type Student = { id: string; name: string };
  type Cell = { mark: Mark; note: string };

  const skills: Skill[] = [
    ['PC01','Ajouter dans les petits nombres','Maths'],['PC02','Enlever dans les petits nombres','Maths'],['PC03','Doubles jusqu’à 20','Maths'],['PC04','Moitiés jusqu’à 20','Maths'],['PC05','Compléments à 10 et à 20','Maths'],['PC06','Additionner en passant par 10','Maths'],['PC07','Soustraire en passant par 10','Maths'],['PC08','Ajouter ou retirer zéro','Maths'],['PC09','Multiplier par 0 ou par 1','Maths'],
    ['DC01','Ajouter des dizaines','Maths'],['DC02','Soustraire des dizaines','Maths'],['DC03','Compléments à 100','Maths'],['DC04','Additionner mentalement jusqu’à 100','Maths'],['DC05','Soustraire mentalement jusqu’à 100','Maths'],['DC06','Doubler des nombres plus grands','Maths'],['DC07','Moitiés de nombres plus grands','Maths'],['DC08','Additionner des centaines et dizaines','Maths'],['DC09','Soustraire des centaines et dizaines','Maths'],['DC10','Estimer et contrôler','Maths'],
    ['LM01','Construire les livrets','Maths'],['LM02','Utiliser les livrets connus','Maths'],['LM03','Multiplier par 5','Maths'],['LM04','Multiplier par 9','Maths'],['LM05','Multiplier par 25','Maths'],['LM06','Multiplier mentalement par un petit nombre','Maths'],['LM07','Multiplier un entier par 10, 100 ou 1 000','Maths'],
    ...['Livret de 2 — multiplier','Livret de 3 — multiplier','Livret de 4 — multiplier','Livret de 5 — multiplier','Livret de 6 — multiplier','Livret de 7 — multiplier','Livret de 8 — multiplier','Livret de 9 — multiplier'].map((label, i) => [`TM0${i+1}`, label, 'Maths'] as [string,string,string]),
    ['DM01','Partager et retrouver une division','Maths'],['DM02','Diviser avec un reste','Maths'],['DM03','Diviser par 4','Maths'],['DM04','Diviser par 5','Maths'],['DM05','Diviser mentalement en décomposant','Maths'],['DM06','Diviser un entier par 10, 100 ou 1 000','Maths'],
    ...['Diviser par 2 — lien avec le livret','Diviser par 3 — lien avec le livret','Diviser par 4 — lien avec le livret','Diviser par 5 — lien avec le livret','Diviser par 6 — lien avec le livret','Diviser par 7 — lien avec le livret','Diviser par 8 — lien avec le livret','Diviser par 9 — lien avec le livret'].map((label, i) => [`DR0${i+1}`, label, 'Maths'] as [string,string,string]),
    ['CD01','Additionner des dixièmes','Maths'],['CD02','Soustraire des dixièmes','Maths'],['CD03','Multiplier un décimal par 10, 100 ou 1 000','Maths'],['CD04','Diviser par 10, 100 ou 1 000','Maths']
  ].map(([code, label, branch]) => ({ code, label, branch }));
  const defaultStudents: Student[] = ['KB','DM','TD','DR','ND','TJ'].map(name => ({ id: name, name }));
  let students = $state<Student[]>(defaultStudents);
  let selectedBranch = $state('Toutes');
  let cells = $state<Record<string, Cell>>({});
  let newStudent = $state('');
  let message = $state('');
  const visibleSkills = $derived(skills.filter(skill => selectedBranch === 'Toutes' || skill.branch === selectedBranch));

  onMount(() => {
    try { const saved = JSON.parse(localStorage.getItem('orbis-competency-tracker') ?? '{}'); students = saved.students?.length ? saved.students : defaultStudents; cells = saved.cells ?? {}; } catch { /* empty state */ }
  });
  function persist() { localStorage.setItem('orbis-competency-tracker', JSON.stringify({ students, cells })); }
  function key(student: Student, skill: Skill) { return `${student.id}:${skill.code}`; }
  function markLabel(mark: Mark) { return mark === 'yellow' ? '(✓)' : mark === 'green' ? '✓' : mark === 'red' ? '×' : '·'; }
  function cycle(student: Student, skill: Skill) { const k = key(student, skill); const next: Mark = ({'':'yellow', yellow:'green', green:'red', red:''} as Record<Mark, Mark>)[cells[k]?.mark ?? '']; cells[k] = { mark: next, note: cells[k]?.note ?? '' }; cells = { ...cells }; persist(); }
  function noteChanged(student: Student, skill: Skill, note: string) { const k = key(student, skill); cells[k] = { mark: cells[k]?.mark ?? '', note }; cells = { ...cells }; persist(); }
  function addStudent() { const name = newStudent.trim(); if (!name || students.some(s => s.name.toLowerCase() === name.toLowerCase())) return; students = [...students, { id: crypto.randomUUID(), name }]; newStudent = ''; persist(); }
  function removeStudent(student: Student) { if (!confirm(`Supprimer ${student.name} du suivi ?`)) return; students = students.filter(s => s.id !== student.id); persist(); }
</script>

<section class="tracker" id="competences">
  <div class="tracker-head"><div><p class="eyebrow">Suivi manuel</p><h2>Réussites par compétence</h2><p>Clique une case pour faire défiler : vide → à revoir → réussi → non réussi. Le commentaire est propre à chaque exercice.</p></div><div class="tools"><label>Branche<select bind:value={selectedBranch}><option>Toutes</option>{#each [...new Set(skills.map(s => s.branch))] as branch}<option>{branch}</option>{/each}</select></label><label>Ajouter un élève<div class="add"><input bind:value={newStudent} placeholder="Initiales" onkeydown={(e) => e.key === 'Enter' && addStudent()} /><button onclick={addStudent}>+</button></div></label></div></div>
  {#if message}<p class="message">{message}</p>{/if}
  <div class="legend"><span class="yellow">(✓) À revoir</span><span class="green">✓ Réussi</span><span class="red">× Non réussi</span><span>· Vide</span></div>
  <div class="table-wrap"><table><thead><tr><th class="student-col">Élève</th>{#each visibleSkills as skill}<th title={skill.label}><strong>{skill.code}</strong><small>{skill.label}</small></th>{/each}</tr></thead><tbody>{#each students as student}<tr><th class="student-col"><span>{student.name}</span><button class="remove" title="Supprimer l’élève" onclick={() => removeStudent(student)}>×</button></th>{#each visibleSkills as skill}{@const cell = cells[key(student, skill)] ?? { mark: '', note: '' }}<td><button class:yellow={cell.mark === 'yellow'} class:green={cell.mark === 'green'} class:red={cell.mark === 'red'} class="mark" onclick={() => cycle(student, skill)} aria-label={`${student.name} ${skill.code}`}>{markLabel(cell.mark)}</button><textarea value={cell.note} placeholder="note…" rows="1" oninput={(e) => noteChanged(student, skill, e.currentTarget.value)}></textarea></td>{/each}</tr>{/each}</tbody></table></div>
</section>

<style>
  .tracker{background:#fff;border:1px solid #dbe3ec;border-radius:16px;padding:1.1rem;margin:1.25rem 0;color:#233044}.tracker-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.eyebrow{margin:0;color:#667eea;font-size:.75rem;font-weight:800;text-transform:uppercase}.tracker h2{margin:.15rem 0;color:#233044}.tracker-head p:not(.eyebrow){margin:.35rem 0;color:#64748b}.tools{display:flex;gap:.7rem;align-items:end;flex-wrap:wrap}.tools label{font-size:.75rem;font-weight:700;color:#64748b}.tools select,.tools input{display:block;margin-top:.25rem;border:1px solid #cbd5e1;border-radius:8px;padding:.55rem;background:#fff}.add{display:flex}.add input{border-radius:8px 0 0 8px;width:100px}.add button{border:0;border-radius:0 8px 8px 0;background:#5267d9;color:#fff;font-size:1.1rem}.legend{display:flex;gap:1rem;flex-wrap:wrap;margin:.8rem 0;font-size:.8rem;color:#64748b}.yellow{color:#b57800}.green{color:#168c62}.red{color:#db3b55}.table-wrap{overflow:auto;max-height:70vh;border:1px solid #e2e8f0;border-radius:10px}table{border-collapse:separate;border-spacing:0;min-width:max-content;width:100%}th,td{border-bottom:1px solid #e2e8f0;border-right:1px solid #edf2f7;padding:.45rem;text-align:center;vertical-align:top}thead th{position:sticky;top:0;background:#f5f8fc;z-index:2;min-width:100px;color:#2d3a8c}thead th small{display:block;color:#475569;font-weight:500;font-size:.66rem;line-height:1.15;margin-top:.25rem;max-width:110px}.student-col{position:sticky;left:0;z-index:3;background:#fff;min-width:92px;text-align:left}thead .student-col{background:#f5f8fc;z-index:4}.student-col span{font-weight:800}.remove{float:right;border:0;background:transparent;color:#cbd5e1;cursor:pointer;font-size:1rem}.remove:hover{color:#db3b55}.mark{display:block;margin:auto;width:36px;height:36px;border-radius:10px;border:2px solid #dbe3ec;background:#f8fafc;color:#94a3b8;font-size:1.05rem;font-weight:800;cursor:pointer}.mark.yellow{background:#fff5cf;border-color:#f3ae00;color:#a86c00}.mark.green{background:#d6f8e9;border-color:#19c58b;color:#168c62}.mark.red{background:#ffe1e7;border-color:#ff5570;color:#db3b55}textarea{display:block;margin:.35rem auto 0;width:92px;min-height:26px;resize:vertical;border:1px solid #dbe3ec;border-radius:6px;padding:.3rem;font:inherit;font-size:.68rem;color:#334155}textarea:focus{min-height:70px;width:140px;position:relative;z-index:5}.message{color:#168c62}@media(max-width:800px){.tracker-head{flex-direction:column}.tools{width:100%}}
</style>
