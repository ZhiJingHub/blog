import { mdsvex } from 'mdsvex';
import mdsvexConfig from './src/lib/config/mdsvex.config.js';

const PLATFORM = process.env.ADAPTER || 'static';

/**
 * 适配器映射
 * - static/cloudflare/edgeone: 使用 adapter-static（全量预渲染，无服务端 API）
 * - netlify/vercel: 使用平台原生适配器（支持 /api 路由的服务端函数）
 */
/** @type {Record<string, () => Promise<{ default: any }>>} */
const adapterMap = {
	static: () => import('@sveltejs/adapter-static'),
	cloudflare: () => import('@sveltejs/adapter-cloudflare'),
	netlify: () => import('@sveltejs/adapter-netlify'),
	vercel: () => import('@sveltejs/adapter-vercel'),
	edgeone: () => import('@sveltejs/adapter-static')
};

const adapterConfigs = {
	static: { strict: false, pages: 'build', assets: 'build', fallback: undefined },
	cloudflare: {},
	netlify: {},
	vercel: {},
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