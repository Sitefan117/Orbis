import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({ out: 'build' }),
        paths: {
            base: process.env.NODE_ENV === 'production' ? '/ma-classeV3' : ''
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
