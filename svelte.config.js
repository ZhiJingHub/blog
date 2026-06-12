import { mdsvex } from 'mdsvex';
import mdsvexConfig from './src/lib/config/mdsvex.config.js';

const PLATFORM = process.env.ADAPTER || 'static';

/**
 * 适配器映射
 * - static/edgeone: adapter-static（全量预渲染，无服务端 API）
 * - cloudflare/cf-pages: adapter-cloudflare（Workers/Pages Functions + KV）
 * - netlify: adapter-netlify（Netlify Functions）
 * - vercel: adapter-vercel（Vercel Serverless Functions）
 */
/** @type {Record<string, () => Promise<{ default: any }>>} */
const adapterMap = {
	static: () => import('@sveltejs/adapter-static'),
	cloudflare: () => import('@sveltejs/adapter-cloudflare'),
	'cf-pages': () => import('@sveltejs/adapter-cloudflare'),
	netlify: () => import('@sveltejs/adapter-netlify'),
	vercel: () => import('@sveltejs/adapter-vercel'),
	edgeone: () => import('@sveltejs/adapter-static')
};

const adapterConfigs = {
	static: { strict: false, pages: 'build', assets: 'build' },
	cloudflare: {},
	'cf-pages': {},
	netlify: { fallback: '404.html' },
	vercel: { fallback: '404.html' },
	edgeone: { strict: false, pages: 'build', assets: 'build' }
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