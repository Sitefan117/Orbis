<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	// Tableau local historique : importe des sauvegardes Fraction Tower et produit un CSV.
	import { languageState } from '$lib/games/fractionstower2/persistence/LanguageManager';
	import { SaveManager, type SaveData } from '$lib/games/fractionstower2/persistence/SaveManager';
	import LocalTrackingPanel from '$lib/orbis/teacher/LocalTrackingPanel.svelte';
	import RemoteTeacherDashboard from '$lib/orbis/teacher/RemoteTeacherDashboard.svelte';
	import { currentSession, refreshRemoteSession, signInWithShortId, signOut, startSessionRefresh } from '$lib/orbis/auth/client';
	import { createStudent, createTeacherClass, listTeacherClasses, listTeacherStudents, listTeacherStudentDocuments, resetStudentPassword, type OrbisClass, type OrbisStudent, type RemoteStudentDocument } from '$lib/orbis/teacher/remote';

	let isAuthenticated = $state(false);
	let loginId = $state('');
	let password = $state('');
	let loginMessage = $state('');
	let isLoggingIn = $state(false);
	let showPassword = $state(false);
	let students = $state<SaveData[]>([]);
	let classes = $state<OrbisClass[]>([]);
	let newClassName = $state('');
	let classMessage = $state('');
	let isCreatingClass = $state(false);
	let studentLoginId = $state('');
	let studentDisplayName = $state('');
	let studentPassword = $state('');
	let studentClassId = $state('');
	let studentMessage = $state('');
	let isCreatingStudent = $state(false);
	let remoteStudents = $state<OrbisStudent[]>([]);
	let remoteDocuments = $state<RemoteStudentDocument[]>([]);
	let resetStudentId = $state('');
	let resetPassword = $state('');
	let resetMessage = $state('');

	onMount(() => {
		startSessionRefresh();
		void (async () => {
			await refreshRemoteSession();
			const session = currentSession();
			if (!session) return;
			isAuthenticated = true;
			try { classes = await listTeacherClasses(); remoteStudents = await listTeacherStudents(classes); try { remoteDocuments = await listTeacherStudentDocuments(); } catch { remoteDocuments = []; } }
			catch { classMessage = 'Session restaurée, mais les classes ne sont pas encore accessibles.'; }
		})();
	});

	// Les actions importent des fichiers de sauvegarde, les regroupent et préparent l’export.
	async function login() {
		isLoggingIn = true;
		loginMessage = '';
		const result = await signInWithShortId(loginId, password);
		isLoggingIn = false;
		if (result.ok && result.role === 'teacher') {
			isAuthenticated = true;
			password = '';
			try { classes = await listTeacherClasses(); remoteStudents = await listTeacherStudents(classes); try { remoteDocuments = await listTeacherStudentDocuments(); } catch { remoteDocuments = []; } } catch { classMessage = 'Connexion réussie, mais les classes ne sont pas encore accessibles.'; }
			return;
		}
		loginMessage = result.ok ? 'Ce compte n’est pas un compte enseignant.' : result.message;
	}

	function logout() {
		signOut();
		isAuthenticated = false;
	}

	async function addClass() {
		const name = newClassName.trim();
		if (name.length < 1) { classMessage = 'Donne un nom à la classe.'; return; }
		isCreatingClass = true;
		classMessage = '';
		try {
			const created = await createTeacherClass(name);
			classes = [...classes, created];
			newClassName = '';
			classMessage = 'Classe créée.';
		} catch {
			classMessage = 'La classe n’a pas pu être créée.';
		} finally { isCreatingClass = false; }
	}

	async function addStudent() {
		if (!studentClassId) { studentMessage = 'Choisis une classe.'; return; }
		if (!/^[a-zA-Z0-9_-]{3,40}$/.test(studentLoginId.trim())) { studentMessage = 'L’identifiant doit contenir 3 à 40 caractères simples.'; return; }
		if (studentDisplayName.trim().length < 1 || studentPassword.length < 10) { studentMessage = 'Pseudonyme obligatoire et mot de passe de 10 caractères minimum.'; return; }
		isCreatingStudent = true;
		studentMessage = '';
		try {
			await createStudent({ loginId: studentLoginId.trim(), displayName: studentDisplayName.trim(), password: studentPassword, classId: studentClassId });
			remoteStudents = await listTeacherStudents(classes);
			studentLoginId = ''; studentDisplayName = ''; studentPassword = '';
			studentMessage = 'Élève créé et inscrit dans la classe.';
		} catch (error) {
			const detail = error instanceof Error ? error.message : 'erreur inconnue';
			studentMessage = `Création impossible : ${detail}`;
		}
		finally { isCreatingStudent = false; }
	}

	async function applyPasswordReset() {
		if (!resetStudentId || resetPassword.length < 10) { resetMessage = 'Choisis un élève et un mot de passe de 10 caractères minimum.'; return; }
		try { await resetStudentPassword(resetStudentId, resetPassword); resetPassword = ''; resetMessage = 'Mot de passe réinitialisé.'; }
		catch (error) { resetMessage = `Réinitialisation impossible : ${error instanceof Error ? error.message : 'erreur inconnue'}`; }
	}

	async function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files) return;

		const files = Array.from(target.files);
		for (const file of files) {
			const data = await SaveManager.importSave(file);
			if (data) {
				if (!students.find(s => s.studentId === data.studentId && data.timestamp === s.timestamp)) {
					students.push(data);
				}
			}
		}
	}

	function clearStudents() {
		students = [];
	}

	/**
	 * EXPORT EXCEL (CSV)
	 * Convertit la liste des élèves en format CSV compatible Excel.
	 */
	function exportToExcel() {
		if (students.length === 0) {
			alert(languageState.current === 'fr-FR' ? "Aucune donnée à exporter." : "Нет данных для экспорта.");
			return;
		}

		const headers = [
			languageState.current === 'fr-FR' ? 'Eleve' : 'Ученик',
			languageState.current === 'fr-FR' ? 'Etage' : 'Этаж',
			languageState.current === 'fr-FR' ? 'Bosses Vaincus' : 'Побежденные боссы',
			languageState.current === 'fr-FR' ? 'Acces Ascenseur' : 'Доступ к лифту',
			languageState.current === 'fr-FR' ? 'Statut' : 'Статус'
		];

		const rows = students.map(s => {
			const status = s.defeatedBosses.length === 8 
				? (languageState.current === 'fr-FR' ? 'Terminé' : 'Завершено')
				: (s.defeatedBosses.length === 0 
					? (languageState.current === 'fr-FR' ? 'Débutant' : 'Новичок') 
					: (languageState.current === 'fr-FR' ? 'En cours' : 'В процессе'));

			return [
				`"${s.studentId}"`, 
				`"${s.player.currentFloorId}"`, 
				s.defeatedBosses.length, 
				s.hasElevatorAccess ? 'Oui' : 'Non', 
				`"${status}"`
			].join(',');
		});

		const csvContent = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', `rapport_fractions_${new Date().toISOString().slice(0,10)}.csv`);
		link.click();
		
		URL.revokeObjectURL(url);
	}
</script>

<!-- Affiche la connexion puis les sauvegardes importées et leurs commandes d’export. -->
{#if !isAuthenticated}
	<div class="login-container">
		<div class="login-card">
			<div class="login-brand"><img src={`${base}/mascotte-noireau/illustrations/noireau-guide-complice.png`} alt="Noireau, guide Orbis" /><span>ORBIS · ENSEIGNANT</span></div>
			<h1>Bienvenue dans ton espace de suivi</h1>
			<p class="login-intro">Retrouve les classes, les progrès et les sauvegardes synchronisées.</p>
			<div class="secure-note"><span aria-hidden="true">●</span> Connexion sécurisée par Supabase</div>
			<label>Identifiant<input type="text" bind:value={loginId} placeholder="Identifiant court" autocomplete="username" /></label>
			<form onsubmit={(event) => { event.preventDefault(); void login(); }}>
				<label>Mot de passe<input type={showPassword ? 'text' : 'password'} bind:value={password} placeholder="Ton mot de passe" autocomplete="current-password" /></label>
				<label class="remember-row"><input type="checkbox" bind:checked={showPassword} /> Afficher le mot de passe</label>
				{#if loginMessage}<p class="login-error" role="alert">{loginMessage}</p>{/if}
				<button type="submit" disabled={isLoggingIn}>{isLoggingIn ? 'Connexion…' : 'Ouvrir le tableau de bord →'}</button>
			</form>
			<p class="stay-connected">La connexion restera active sur cet appareil jusqu’à ta déconnexion.</p>
			<a class="back-link" href={`${base}/`}>← Retour au portail Orbis</a>
		</div>
	</div>
{:else}
	<div class="teacher-container">
		<header class="teacher-header">
			<div><p class="teacher-kicker">ORBIS · ESPACE ENSEIGNANT</p><h1>Tableau de bord pédagogique</h1><p>Une vue simple des progrès, sans remplacer ton observation professionnelle.</p></div>
			<button class="logout-button" onclick={logout}>Se déconnecter</button>
		</header>

		<RemoteTeacherDashboard {classes} students={remoteStudents} documents={remoteDocuments} />

		<details class="secondary-zone">
			<summary>Données locales de cet appareil</summary>
			<LocalTrackingPanel />
		</details>

		<section class="classes-card">
			<h2>Mes classes</h2>
			<div class="class-create-row">
				<input type="text" bind:value={newClassName} placeholder="Nom de la classe" maxlength="100" />
				<button onclick={addClass} disabled={isCreatingClass}>{isCreatingClass ? 'Création…' : 'Créer la classe'}</button>
			</div>
			{#if classMessage}<p class="class-message" role="status">{classMessage}</p>{/if}
			{#if classes.length === 0}<p>Aucune classe pour le moment.</p>{:else}<ul class="class-list">{#each classes as classroom}<li><strong>{classroom.name}</strong><small>{new Date(classroom.created_at).toLocaleDateString('fr-CH')}</small></li>{/each}</ul>{/if}
		</section>

		<section class="classes-card">
			<h2>Ajouter un élève</h2>
			<div class="student-form">
				<select bind:value={studentClassId} aria-label="Classe de l’élève">
					<option value="">Choisir une classe</option>
					{#each classes as classroom}<option value={classroom.id}>{classroom.name}</option>{/each}
				</select>
				<input type="text" bind:value={studentLoginId} placeholder="Identifiant court" autocomplete="off" />
				<input type="text" bind:value={studentDisplayName} placeholder="Pseudonyme affiché" autocomplete="off" />
				<input type="password" bind:value={studentPassword} placeholder="Mot de passe (10 caractères minimum)" autocomplete="new-password" />
				<button onclick={addStudent} disabled={isCreatingStudent}>{isCreatingStudent ? 'Création…' : 'Créer l’élève'}</button>
			</div>
			{#if studentMessage}<p class="class-message" role="status">{studentMessage}</p>{/if}
		</section>

		<section class="classes-card">
			<h2>Élèves de mes classes</h2>
			{#if remoteStudents.length === 0}<p>Aucun élève distant.</p>{:else}
				<ul class="class-list">{#each remoteStudents as pupil}<li><span><strong>{pupil.display_name}</strong><br /><small>{pupil.login_id} · {classes.find((item) => item.id === pupil.class_id)?.name ?? 'Classe'}</small></span><button onclick={() => { resetStudentId = pupil.user_id; resetMessage = ''; }}>Réinitialiser le mot de passe</button></li>{/each}</ul>
			{/if}
			{#if resetStudentId}
				<div class="reset-row"><input type="password" bind:value={resetPassword} placeholder="Nouveau mot de passe" autocomplete="new-password" /><button onclick={applyPasswordReset}>Confirmer</button></div>
			{/if}
			{#if resetMessage}<p class="class-message" role="status">{resetMessage}</p>{/if}
		</section>

		<section class="legacy-heading">
			<div>
				<h2>Anciennes sauvegardes Fractions Tower</h2>
				<p>Cette partie reste disponible pour importer les fichiers <code>.fracsave</code> existants.</p>
			</div>
			<div class="actions">
				<label class="import-btn">📂 Importer<input type="file" multiple accept=".fracsave" onchange={handleFileUpload} /></label>
				<button class="excel-btn" onclick={exportToExcel}>📊 Exporter</button>
				<button class="clear-btn" onclick={clearStudents}>🗑️ Effacer</button>
			</div>
		</section>

		{#if students.length === 0}
			<div class="empty-state">
				<p>{languageState.current === 'fr-FR' ? 'Aucune donnée d\'élève importée.' : 'Данные учеников не импортированы.'}</p>
			</div>
		{:else}
			<div class="dashboard">
				<table>
					<thead>
						<tr>
							<th>{languageState.current === 'fr-FR' ? 'Élève' : 'Ученик'}</th>
							<th>{languageState.current === 'fr-FR' ? 'Étage' : 'Этаж'}</th>
							<th>{languageState.current === 'fr-FR' ? 'Bosses Vaincus' : 'Побежденные боссы'}</th>
							<th>{languageState.current === 'fr-FR' ? 'Accès Ascenseur' : 'Доступ к лифту'}</th>
							<th>{languageState.current === 'fr-FR' ? 'Statut' : 'Статус'}</th>
						</tr>
					</thead>
					<tbody>
						{#each students as s}
							<tr class={s.defeatedBosses.length < 2 ? 'warning' : ''}>
								<td><strong>{s.studentId}</strong></td>
								<td>{s.player.currentFloorId.replace('floor-', 'Étage ')}</td>
								<td>{s.defeatedBosses.length} / 8</td>
								<td>{s.hasElevatorAccess ? '✅' : '❌'}</td>
								<td>
									{#if s.defeatedBosses.length === 8}
										<span class="status-complete">{languageState.current === 'fr-FR' ? 'Terminé' : 'Завершено'}</span>
									{:else if s.defeatedBosses.length === 0}
										<span class="status-stuck">{languageState.current === 'fr-FR' ? 'Débutant' : 'Новичок'}</span>
									{:else}
										<span class="status-progress">{languageState.current === 'fr-FR' ? 'En cours' : 'В процессе'}</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #121212;
		color: white;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.login-container {
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: radial-gradient(circle, #2c3e50 0%, #000000 100%);
	}
	.login-card {
		background: rgba(255, 255, 255, 0.1);
		padding: 2rem;
		border-radius: 15px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		text-align: center;
		width: 400px;
		box-shadow: 0 10px 30px rgba(0,0,0,0.5);
	}
	.login-card h1 { color: #ffcc00; margin-bottom: 1rem; }
	.login-card input {
		width: 80%;
		padding: 10px;
		margin: 20px 0;
		border-radius: 5px;
		border: none;
		text-align: center;
		font-size: 1rem;
	}
	.login-card button {
		background: #ffcc00;
		color: #000;
		border: none;
		padding: 10px 20px;
		border-radius: 5px;
		font-weight: bold;
		cursor: pointer;
	}
	.login-error { color: #ff9d9d; min-height: 1.4em; }
	.logout-button { margin-left: auto; padding: .55rem .9rem; }
	.classes-card { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16); border-radius: 12px; padding: 1.25rem; margin: 1.5rem 0; }
	.class-create-row { display: flex; gap: .75rem; flex-wrap: wrap; }
	.class-create-row input { flex: 1 1 260px; padding: .7rem; border-radius: 6px; border: 1px solid #777; }
	.class-create-row button { padding: .7rem 1rem; }
	.class-message { color: #ffdc72; }
	.class-list { list-style: none; padding: 0; display: grid; gap: .6rem; }
	.class-list li { display: flex; justify-content: space-between; gap: 1rem; padding: .7rem; background: rgba(0,0,0,.2); border-radius: 6px; }
	.class-list small { opacity: .75; }
	.student-form { display: grid; gap: .75rem; max-width: 520px; }
	.student-form input, .student-form select { padding: .7rem; border-radius: 6px; border: 1px solid #777; }
	.student-form button { padding: .7rem 1rem; }
	.reset-row { display:flex; gap:.75rem; flex-wrap:wrap; margin-top:1rem; }
	.reset-row input { flex:1 1 260px; padding:.7rem; }

	.teacher-container {
		padding: 2rem;
		max-width: 1200px;
		margin: auto;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		border-bottom: 2px solid #333;
		padding-bottom: 1rem;
	}
	header h1 { color: #ffcc00; }
	.actions { display: flex; gap: 15px; align-items: center; }
	.import-btn, .clear-btn, .excel-btn {
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: bold;
		font-size: 0.9rem;
		border: none;
	}
	.import-btn { background: #1976d2; color: white; }
	.excel-btn { background: #2e7d32; color: white; }
	.clear-btn { background: #d32f2f; color: white; }
	.import-btn input { display: none; }

	.empty-state {
		text-align: center;
		padding: 100px 0;
		opacity: 0.6;
		font-style: italic;
	}

	.dashboard {
		background: #1e1e1e;
		padding: 20px;
		border-radius: 12px;
		border: 1px solid #333;
		box-shadow: 0 4px 15px rgba(0,0,0,0.3);
	}
	.legacy-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin: 1.5rem 0 1rem; }
	.legacy-heading h2 { margin-bottom: .35rem; color: #ffcc00; }
	.legacy-heading p { margin: 0; color: #aaa; }
	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}
	th, td {
		padding: 15px;
		border-bottom: 1px solid #333;
	}
	th { color: #aaa; font-weight: normal; text-transform: uppercase; font-size: 0.8rem; }
	tr.warning { background: rgba(255, 0, 0, 0.05); }
	
	.status-complete { color: #4caf50; font-weight: bold; }
	.status-progress { color: #ffcc00; }
	.status-stuck { color: #ff5252; }
	@media (max-width: 800px) {
		header, .legacy-heading { align-items: flex-start; flex-direction: column; }
		.actions { flex-wrap: wrap; }
	}

	/* Nouvelle enveloppe visuelle du tableau enseignant. */
	:global(body) { background: #eef3ec; color: #20332e; font-family: Arial, sans-serif; }
	.login-container { min-height: 100vh; height: auto; padding: 1.5rem; box-sizing: border-box; background: radial-gradient(circle at 15% 10%, #d8eadb 0, transparent 35%), linear-gradient(145deg, #f7f7ed, #dfeae1); }
	.login-card { width: min(100%, 460px); box-sizing: border-box; padding: clamp(1.5rem, 5vw, 2.6rem); text-align: left; color: #20332e; background: rgba(255,255,250,.96); border: 1px solid #c8d7c9; border-radius: 24px; box-shadow: 0 24px 70px #17362b24; backdrop-filter: blur(12px); }
	.login-card h1 { margin: 1rem 0 .7rem; color: #173f32; font-size: clamp(2rem, 6vw, 3rem); line-height: 1.04; letter-spacing: -.04em; }
	.login-intro { color: #586d65; line-height: 1.55; margin-bottom: 1.2rem; }
	.login-brand { display:flex; align-items:center; gap:.8rem; color:#2b6f56; font-size:.78rem; font-weight:800; letter-spacing:.12em; }
	.login-brand img { width:58px; height:58px; object-fit:cover; object-position:top; border-radius:14px; background:#e4eee4; }
	.secure-note { padding:.7rem .85rem; border-radius:10px; background:#e7f2e8; color:#37634f; font-size:.86rem; margin-bottom:1.2rem; }
	.secure-note span { color:#47a36f; margin-right:.35rem; }
	.login-card label { display:block; margin-top:.9rem; font-weight:700; font-size:.9rem; color:#304d43; }
	.remember-row { display:flex!important; align-items:center; gap:.5rem; font-weight:500!important; color:#60736c!important; }
	.remember-row input { width:auto!important; margin:0!important; }
	.stay-connected { color:#60736c; font-size:.82rem; line-height:1.4; }
	.login-card input { width:100%; box-sizing:border-box; margin:.4rem 0 0; padding:.85rem .9rem; border:2px solid #a8bbae; border-radius:10px; text-align:left; color:#20332e; background:white; }
	.login-card input:focus { outline:3px solid #e3a42f; outline-offset:2px; border-color:#356f58; }
	.login-card button { width:100%; margin-top:1.2rem; padding:.9rem 1rem; border-radius:11px; background:#285f4c; color:white; font-size:1rem; }
	.back-link { display:block; margin-top:1.2rem; color:#38634f; text-align:center; }
	.login-error { color:#a52f27; background:#fff0ea; border-left:4px solid #b23c2e; padding:.7rem; border-radius:6px; }
	.teacher-container { max-width: 1380px; padding: clamp(1rem, 3vw, 2.2rem); color:#20332e; }
	.teacher-header { margin:0; padding:1rem 0 1.4rem; border-bottom:1px solid #cbd8ce; align-items:flex-end; }
	.teacher-header h1 { margin:.25rem 0; color:#173f32; font-size:clamp(2rem,4vw,3.4rem); letter-spacing:-.04em; }
	.teacher-header p { margin:.3rem 0; color:#64766f; }
	.teacher-kicker { color:#2b7158!important; font-size:.75rem; font-weight:800; letter-spacing:.14em; }
	.logout-button { border:1px solid #9eb2a5; border-radius:10px; background:white; color:#315849; cursor:pointer; }
	.secondary-zone { margin:1.2rem 0; border:1px solid #cbd8ce; border-radius:14px; background:white; padding:.8rem 1rem; }
	.secondary-zone summary { cursor:pointer; font-weight:700; color:#49635a; }
	.classes-card { color:#20332e; background:white; border:1px solid #d3ded4; border-radius:18px; box-shadow:0 10px 28px #17362b0d; }
	.classes-card h2 { color:#173f32; }
	.class-list li { background:#f0f5ef; }
	.class-message { color:#8d5e13; }
	.legacy-heading h2 { color:#315f4e; }
	.legacy-heading p { color:#66766f; }
	.dashboard { background:white; color:#20332e; border-color:#d3ded4; box-shadow:none; }
	.dashboard th,.dashboard td { border-color:#dfe7df; }
	.dashboard th { color:#63756e; }
	@media(max-width:600px){.login-container{padding:.75rem}.login-card{padding:1.35rem}.teacher-header{align-items:flex-start}}
</style>
