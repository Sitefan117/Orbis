<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { signInWithShortId } from '$lib/orbis/auth/client';
  import { getSupabasePublicConfig } from '$lib/orbis/persistence/supabase-rest';
  import { storeStudentName } from '$lib/orbis/identity/local-student';

  let loginId = $state('');
  let password = $state('');
  let message = $state('');
  let loading = $state(false);

  async function login() {
    loading = true;
    message = '';
    const result = await signInWithShortId(loginId, password);
    if (!result.ok) { message = result.message; loading = false; return; }
    if (result.role !== 'student') { message = 'Ce compte est un compte enseignant.'; loading = false; return; }

    const config = getSupabasePublicConfig();
    try {
      const response = await fetch(`${config?.url}/rest/v1/student_profiles?user_id=eq.${encodeURIComponent(result.session.userId)}&select=display_name&limit=1`, {
        headers: { apikey: config?.publicKey ?? '', authorization: `Bearer ${result.session.accessToken}` }
      });
      const profiles = await response.json() as Array<{ display_name: string }>;
      const displayName = profiles[0]?.display_name;
      if (!response.ok || !displayName) throw new Error('profil');
      storeStudentName(displayName);
      await goto(`${base}/`);
    } catch {
      message = 'La session est valide, mais le profil élève est introuvable.';
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Connexion élève · Orbis</title></svelte:head>

<main class="student-login">
  <section class="card" aria-labelledby="student-title">
    <p class="eyebrow">ORBIS</p>
    <h1 id="student-title">Entrer dans mon espace</h1>
    <p class="intro">Utilise l’identifiant et le mot de passe remis par ton enseignant.</p>
    <label>Identifiant court<input bind:value={loginId} autocomplete="username" placeholder="panda01" /></label>
    <label>Mot de passe<input type="password" bind:value={password} autocomplete="current-password" /></label>
    {#if message}<p class="message" role="alert">{message}</p>{/if}
    <button onclick={login} disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
    <a href={`${base}/`}>← Retour à Orbis</a>
    <a href={`${base}/confidentialite`}>Comment mes données sont utilisées</a>
  </section>
</main>

<style>
  :global(body) { margin: 0; font-family: Arial, sans-serif; background: #f3f6ef; color: #20332e; }
  .student-login { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; }
  .card { width: min(100%, 30rem); max-width: 30rem; background: #fffdf7; border: 2px solid #d4dfd3; border-radius: 20px; padding: 2rem; box-shadow: 0 12px 30px #20332e18; }
  .eyebrow { color: #285f4c; font-weight: 700; letter-spacing: .12em; font-size: .8rem; }
  h1 { font-size: clamp(1.8rem, 5vw, 2.7rem); line-height: 1.1; margin: .5rem 0 1rem; }
  .intro { line-height: 1.5; }
  label { display: block; font-weight: 700; margin-top: 1rem; }
  input { display: block; width: 100%; box-sizing: border-box; margin-top: .4rem; padding: .85rem; border: 2px solid #8da79a; border-radius: 10px; font-size: 1.05rem; }
  button { margin-top: 1.25rem; width: 100%; padding: .9rem; border: 0; border-radius: 10px; background: #285f4c; color: white; font-weight: 700; font-size: 1rem; cursor: pointer; }
  button:disabled { opacity: .65; cursor: wait; }
  .message { color: #9a3027; font-weight: 700; }
  a { display: block; margin-top: 1.25rem; color: #285f4c; }
</style>
