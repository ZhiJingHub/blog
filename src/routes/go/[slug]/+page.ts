import { encodeUrl } from '$lib/utils/redirect';
import { redirects } from '$lib/config/redirects';
import type { EntryGenerator } from './$types';

const SITE_DOMAINS = ['iwexe.top', 'iwecc.dpdns.org', 'iwecc.qzz.io'];

function isInternalDomain(hostname: string): boolean {
	return SITE_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

/** 规范化 URL：确保有尾部斜杠，与浏览器解析 <a href> 的行为一致 */
function normalizeUrl(url: string): string {
	try {
		const u = new URL(url);
		if (!u.pathname.endsWith('/')) u.pathname += '/';
		return u.toString();
	} catch {
		return url;
	}
}

/** 判断是否为外部链接 */
function isExternal(url: string): boolean {
	try {
		const u = new URL(url);
		return (u.protocol === 'http:' || u.protocol === 'https:') && !isInternalDomain(u.hostname);
	} catch {
		return false;
	}
}

/** 从内容中提取外链 */
function extractExternalLinks(raw: string): string[] {
	const links: string[] = [];
	// Markdown 链接语法: [text](url)
	const mdRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
	let match: RegExpExecArray | null;
	while ((match = mdRegex.exec(raw)) !== null) {
		links.push(match[2]);
	}
	// HTML/Svelte/TS/JS 中的 URL 字符串字面量
	const urlRegex = /["'](https?:\/\/[^"'\s]+)["']/g;
	while ((match = urlRegex.exec(raw)) !== null) {
		links.push(match[1]);
	}
	return links;
}

export const entries: EntryGenerator = () => {
	const slugs = new Set<string>();

	/** 添加外部链接到 slug 集合 */
	function addUrl(url: string) {
		if (isExternal(url)) {
			slugs.add(encodeUrl(normalizeUrl(url)));
		}
	}

	// 1. 扫描 Markdown 文章
	const rawPosts = import.meta.glob('/src/content/posts/**/index.md', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;
	for (const content of Object.values(rawPosts)) {
		for (const url of extractExternalLinks(content)) {
			addUrl(url);
		}
	}

	// 2. 扫描 Svelte 组件
	const rawSvelte = import.meta.glob(
		['/src/routes/**/*.svelte', '/src/lib/components/**/*.svelte'],
		{ query: '?raw', eager: true }
	) as Record<string, string>;
	for (const content of Object.values(rawSvelte)) {
		for (const url of extractExternalLinks(content)) {
			addUrl(url);
		}
	}

	// 3. 扫描配置文件
	const rawConfig = import.meta.glob(
		['/src/lib/config/*.ts', '/src/lib/config/*.js'],
		{ query: '?raw', eager: true }
	) as Record<string, string>;
	for (const content of Object.values(rawConfig)) {
		for (const url of extractExternalLinks(content)) {
			addUrl(url);
		}
	}

	// 4. 扫描友链数据
	const friendData = import.meta.glob('/src/data/friends/*.json', {
		eager: true
	}) as Record<string, { default: { url?: string } }>;
	for (const mod of Object.values(friendData)) {
		const url = mod.default?.url;
		if (url) addUrl(url);
	}

	// 5. 添加短链配置的 slug（如 "github"、"telegram"）
	for (const key of Object.keys(redirects)) {
		const slug = key.replace(/^\/go\//, '');
		if (slug) slugs.add(slug);
	}

	return Array.from(slugs).map((slug) => ({ slug }));
};
