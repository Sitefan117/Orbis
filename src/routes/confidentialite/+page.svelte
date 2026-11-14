<script lang="ts">
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>Confidentialité · Orbis</title>
  <meta name="description" content="Données enregistrées par Orbis et droits des élèves." />
</svelte:head>

<main>
  <a class="back" href={`${base}/`}>← Retour à Orbis</a>
  <p class="eyebrow">ORBIS · DONNÉES</p>
  <h1>Ce qu’Orbis enregistre</h1>
  <p class="lead">Orbis collecte seulement les informations utiles pour reprendre une activité et permettre à l’enseignant d’accompagner les apprentissages.</p>

  <section>
    <h2>Données du compte</h2>
    <ul><li>un identifiant court et un pseudonyme ;</li><li>la classe à laquelle le compte est rattaché ;</li><li>un mot de passe conservé sous forme protégée par Supabase.</li></ul>
  </section>
  <section>
    <h2>Progression pédagogique</h2>
    <ul><li>jeu, activité et date ;</li><li>réponses justes ou fausses, essais et indices lorsque le jeu sait les mesurer ;</li><li>durée lorsqu’elle est disponible ;</li><li>sauvegarde nécessaire pour reprendre une partie.</li></ul>
    <p>Une donnée absente ne doit pas être interprétée comme un zéro. Les résultats aident l’enseignant, mais ne remplacent ni son observation ni une évaluation scolaire.</p>
  </section>
  <section>
    <h2>CV et lettres PCP</h2>
    <p>Ces documents peuvent contenir davantage d’informations personnelles. Ils sont visibles uniquement par l’élève et l’enseignant de sa classe. L’élève doit éviter d’y inscrire des informations inutiles.</p>
  </section>
  <section>
    <h2>Conservation et droits</h2>
    <p>Pour le pilote, les données sont conservées pendant l’année scolaire et au maximum douze mois après la fin de la classe, sauf obligation institutionnelle différente. L’élève ou son représentant peut demander à l’enseignant :</p>
    <ul><li>une copie des données ;</li><li>la correction d’une information ;</li><li>la suppression du compte et de ses données.</li></ul>
  </section>
  <section>
    <h2>Hébergement</h2>
    <p>Le portail est publié sur GitHub Pages. Les comptes et données synchronisées sont hébergés par Supabase dans la région de Zurich. Une partie des données peut rester temporairement dans le navigateur lorsque le réseau est indisponible.</p>
  </section>
  <aside>Cette notice décrit le fonctionnement technique actuel. L’utilisation avec de vrais élèves doit encore être validée par la direction et selon les règles de protection des données applicables à l’établissement.</aside>
</main>

<style>
  :global(body){margin:0;background:#eef1eb;color:#20332e;font-family:Arial,Helvetica,sans-serif;line-height:1.65}
  main{width:min(100% - 2rem,52rem);margin:auto;padding:2rem 0 4rem}
  .back{display:inline-block;margin-bottom:2rem;color:#285f4c;font-weight:700}
  .eyebrow{font-size:.82rem;letter-spacing:.12em;font-weight:800;color:#46715f}
  h1{font-size:clamp(2.2rem,7vw,4.5rem);line-height:1;margin:.5rem 0 1rem}
  .lead{font-size:1.2rem;max-width:44rem}
  section,aside{background:#fffdf7;border:1px solid #cdd8ce;border-radius:16px;padding:1.25rem 1.5rem;margin-top:1rem}
  h2{font-size:1.3rem;margin:0 0 .5rem} p,ul{margin:.5rem 0} li+li{margin-top:.35rem}
  aside{border-left:6px solid #d58a32;font-weight:700}
  a:focus-visible{outline:3px solid #20332e;outline-offset:4px}
</style>
