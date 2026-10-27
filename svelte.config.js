import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: '404.html'
        }),
        paths: {
            // GitHub Pages publie ce dépôt sous https://sitefan117.github.io/Orbis/.
            // ORBIS_BASE_PATH permet de conserver une prévisualisation flexible si besoin.
            base: process.env.NODE_ENV === 'production' ? (process.env.ORBIS_BASE_PATH ?? '/Orbis') : ''
        },
        prerender: {
            handleHttpError: ({ path, referrer, message }) => {
                // Ignore les erreurs de prerender pour les formulaires de la zone teacher
                if (path.startsWith('/teacher')) {
                    return;
                }
                throw new Error(message);
            }
        }
    }
};

export default config;
