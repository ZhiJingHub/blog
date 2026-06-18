import { encodeUrl } from '$lib/utils/redirect';
import { redirects } from '$lib/config/redirects';
import { siteConfig } from '$lib/config/site';
import type { EntryGenerator } from './$types';

const SITE_DOMAINS = ['iwexe.top', 'iwecc.dpdns.org', 'iwecc.qzz.io'];

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

/** 递归提取对象中所有 http/https URL 字符串 */
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

/** 从原始文本中提取 http/https URL */
function extractUrlsFromText(raw: string): string[] {
	const urls: string[] = [];
	const mdRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
	let match: RegExpExecArray | null;
	while ((match = mdRegex.exec(raw)) !== null) {
		urls.push(match[2]);
	}
	const urlRegex = /["'](https?:\/\/[^"'\s]+)["']/g;
	while ((match = urlRegex.exec(raw)) !== null) {
		urls.push(match[1]);
	}
	return urls;
}

export const entries: EntryGenerator = () => {
	const slugs = new Set<string>();

	function addUrl(url: string) {
		if (isExternal(url)) {
			slugs.add(encodeUrl(normalizeUrl(url)));
		}
	}

	// 1. 直接从 siteConfig 提取所有 URL
	for (const url of extractUrlsFromObject(siteConfig)) {
		addUrl(url);
	}

	// 2. 扫描 Markdown 文章
	const rawPosts = import.meta.glob('/src/content/posts/**/index.md', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;
	for (const content of Object.values(rawPosts)) {
		for (const url of extractUrlsFromText(content)) addUrl(url);
	}

	// 3. 扫描 Svelte 组件
	const rawSvelte = import.meta.glob(
		['/src/routes/**/*.svelte', '/src/lib/components/**/*.svelte'],
		{ query: '?raw', eager: true }
	) as Record<string, string>;
	for (const content of Object.values(rawSvelte)) {
		for (const url of extractUrlsFromText(content)) addUrl(url);
	}

	// 4. 扫描友链 JSON
	const friendData = import.meta.glob('/src/data/friends/*.json', {
		eager: true
	}) as Record<string, { default: { url?: string } }>;
	for (const mod of Object.values(friendData)) {
		const url = mod.default?.url;
		if (url) addUrl(url);
	}

	// 5. 添加短链 slug
	for (const key of Object.keys(redirects)) {
		const slug = key.replace(/^\/go\//, '');
		if (slug) slugs.add(slug);
	}

	return Array.from(slugs).map((slug) => ({ slug }));
};
