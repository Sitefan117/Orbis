import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const staticDeployment = process.env.ORBIS_DEPLOY_TARGET === 'static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: staticDeployment
            ? adapterStatic({ pages: 'build', assets: 'build', fallback: '404.html' })
            : adapterNode(),
        paths: {
            base: staticDeployment ? '/ma-classeV3' : ''
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
