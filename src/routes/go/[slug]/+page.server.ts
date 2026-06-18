import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { encodeUrl, decodeUrl } from '$lib/utils/redirect';
import { redirects } from '$lib/config/redirects';
import { siteConfig } from '$lib/config/site';
import type { EntryGenerator, ServerLoad } from './$types';

const SITE_DOMAINS = ['iwexe.top', 'iwecc.dpdns.org', 'iwecc.qzz.io', 'w3.org'];

function isInternalDomain(hostname: string): boolean {
	return SITE_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

function normalizeUrl(url: string): string {
	try {
		const u = new URL(url);
		if (!u.pathname.endsWith('/')) u.pathname += '/';
		return u.toString();
	} catch {
		return url;
	}
}

function isExternal(url: string): boolean {
	try {
		const u = new URL(url);
		return (u.protocol === 'http:' || u.protocol === 'https:') && !isInternalDomain(u.hostname);
	} catch {
		return false;
	}
}

function extractUrlsFromObject(obj: unknown): string[] {
	const urls: string[] = [];
	function walk(val: unknown) {
		if (typeof val === 'string' && /^https?:\/\//i.test(val)) {
			urls.push(val);
		} else if (Array.isArray(val)) {
			val.forEach(walk);
		} else if (val && typeof val === 'object') {
			Object.values(val).forEach(walk);
		}
	}
	walk(obj);
	return urls;
}

function extractUrlsFromText(raw: string): string[] {
	const urls: string[] = [];
	const mdRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
	let match: RegExpExecArray | null;
	while ((match = mdRegex.exec(raw)) !== null) {
		urls.push(match[2]);
	}
	// 支持带查询参数的 URL（[^"'\s?] 匹配到 ? 之前，然后可选地匹配查询字符串）
	const urlRegex = /["'](https?:\/\/[^"'\s?]+(\?[^"'\s]*)?)["']/g;
	while ((match = urlRegex.exec(raw)) !== null) {
		urls.push(match[1]);
	}
	return urls;
}

// ========== 预渲染入口 ==========
export const prerender = true;

export const entries: EntryGenerator = () => {
	const slugs = new Set<string>();

	function addUrl(url: string) {
		if (isExternal(url)) {
			slugs.add(encodeUrl(normalizeUrl(url)));
		}
	}

	// 1. siteConfig 中的 URL
	for (const url of extractUrlsFromObject(siteConfig)) {
		addUrl(url);
	}

	// 2. Markdown 文章
	const rawPosts = import.meta.glob('/src/content/posts/**/index.md', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;
	for (const mod of Object.values(rawPosts)) {
		const raw = typeof mod === 'string' ? mod : (mod as any).default ?? '';
		for (const url of extractUrlsFromText(raw)) addUrl(url);
	}

	// 3. Svelte 组件
	const rawSvelte = import.meta.glob(
		['/src/routes/**/*.svelte', '/src/lib/components/**/*.svelte'],
		{ query: '?raw', eager: true }
	) as Record<string, string>;
	for (const mod of Object.values(rawSvelte)) {
		const raw = typeof mod === 'string' ? mod : (mod as any).default ?? '';
		for (const url of extractUrlsFromText(raw)) addUrl(url);
	}

	// 4. 友链 JSON
	const friendData = import.meta.glob('/src/data/friends/*.json', {
		eager: true
	}) as Record<string, { default: { url?: string } }>;
	for (const mod of Object.values(friendData)) {
		const url = mod.default?.url;
		if (url) addUrl(url);
	}

	// 5. 短链 slug
	for (const key of Object.keys(redirects)) {
		const slug = key.replace(/^\/go\//, '');
		if (slug) slugs.add(slug);
	}

	return Array.from(slugs).map((slug) => ({ slug }));
};

// ========== 运行时重定向（SSR 平台）==========
export const load: ServerLoad = ({ params }) => {
	const decoded = decodeUrl(params.slug);

	// 预渲染阶段：返回数据让组件渲染静态 HTML，不跳转
	if (building) {
		return { target: decoded && isValidHttpUrl(decoded) ? decoded : null };
	}

	// SSR 运行时：直接 302 重定向
	if (decoded && isValidHttpUrl(decoded)) {
		throw redirect(302, decoded);
	}

	return { target: null };
};

function isValidHttpUrl(str: string): boolean {
	try {
		const url = new URL(str);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}
