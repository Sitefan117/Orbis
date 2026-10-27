<script lang="ts">
	// Tableau local historique : importe des sauvegardes Fraction Tower et produit un CSV.
	import { languageState } from '$lib/games/fractionstower2/persistence/LanguageManager';
	import { SaveManager, type SaveData } from '$lib/games/fractionstower2/persistence/SaveManager';
	import LocalTrackingPanel from '$lib/orbis/teacher/LocalTrackingPanel.svelte';

	let isAuthenticated = $state(false);
	let password = $state('');
	let students = $state<SaveData[]>([]);
	
	const TEACHER_PASSWORD = 'admin';

	// Les actions importent des fichiers de sauvegarde, les regroupent et préparent l’export.
	function login() {
		if (password === TEACHER_PASSWORD) {
			isAuthenticated = true;
		} else {
			alert(languageState.current === 'fr-FR' ? "Mot de passe incorrect." : "Неверный пароль.");
		}
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
			<h1>{languageState.current === 'fr-FR' ? 'Espace Enseignant' : 'Пространство учителя'}</h1>
			<p>{languageState.current === 'fr-FR' ? 'Veuillez entrer le mot de passe pour accéder au tableau de bord.' : 'Пожалуйста, введите пароль для доступа к панели управления.'}</p>
			<p class="local-warning">Protection locale provisoire : elle ne remplace pas encore un compte enseignant sécurisé.</p>
			<input type="password" bind:value={password} placeholder="Mot de passe..." />
			<button onclick={login}>{languageState.current === 'fr-FR' ? 'Se connecter' : 'Войти'}</button>
		</div>
	</div>
{:else}
	<div class="teacher-container">
		<header>
			<h1>{languageState.current === 'fr-FR' ? 'Tableau de Bord des Élèves' : 'Панель управления учениками'}</h1>
		</header>

		<LocalTrackingPanel />

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
	.local-warning { color: #ffdc72; font-size: .85rem; }
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
</style>
