import { mdsvex } from 'mdsvex';
import mdsvexConfig from './src/lib/config/mdsvex.config.js';

const PLATFORM = process.env.ADAPTER || 'static';

/** @type {Record<string, () => Promise<{ default: any }>>} */
const adapterMap = {
	static: () => import('@sveltejs/adapter-static'),
	cloudflare: () => import('@sveltejs/adapter-cloudflare'),
	netlify: () => import('@sveltejs/adapter-netlify'),
	vercel: () => import('@sveltejs/adapter-vercel'),
	edgeone: () => import('@sveltejs/adapter-static')
};

const adapterConfigs = {
	static: { strict: false },
	cloudflare: {},
	netlify: {},
	vercel: {},
	edgeone: { strict: false }
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapterMap[PLATFORM]
			? (await adapterMap[PLATFORM]()).default(adapterConfigs[PLATFORM] || {})
			: (await import('@sveltejs/adapter-static')).default({ strict: false }),
		prerender: {
			handleHttpError: ({ path, status }) => {
				if (path.endsWith('.avif') && status === 404) return;
				throw new Error(`HTTP ${status} ${path}`);
			}
		}
	},
	preprocess: [mdsvex(mdsvexConfig)],
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
