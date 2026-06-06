import { mdsvex } from 'mdsvex';
import mdsvexConfig from './src/lib/config/mdsvex.config.js';

const PLATFORM = process.env.ADAPTER || 'static';

/**
 * 适配器映射
 * 本项目为全量预渲染（prerender=true），所有路由在构建时生成静态 HTML，
 * 因此除 Cloudflare Workers 外，其余平台统一使用 adapter-static（最高效）。
 */
/** @type {Record<string, () => Promise<{ default: any }>>} */
const adapterMap = {
	static: () => import('@sveltejs/adapter-static'),
	cloudflare: () => import('@sveltejs/adapter-cloudflare'),
	netlify: () => import('@sveltejs/adapter-static'),
	vercel: () => import('@sveltejs/adapter-static'),
	edgeone: () => import('@sveltejs/adapter-static')
};

const adapterConfigs = {
	static: { strict: false, pages: 'build', assets: 'build', fallback: undefined },
	cloudflare: {},
	netlify: { strict: false, pages: 'build', assets: 'build', fallback: undefined },
	vercel: { strict: false, pages: 'build', assets: 'build', fallback: undefined },
	edgeone: { strict: false, pages: 'build', assets: 'build', fallback: undefined }
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