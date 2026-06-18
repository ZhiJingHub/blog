import { encodeUrl } from '$lib/utils/redirect';
import { redirects } from '$lib/config/redirects';
import { siteConfig } from '$lib/config/site';
import { isInternalDomain } from '$lib/utils/site-domains';
import type { EntryGenerator } from './$types';

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
	// HTML/Svelte 中的 href="url" 或 href='url'
	const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/g;
	while ((match = hrefRegex.exec(raw)) !== null) {
		links.push(match[1]);
	}
	// TypeScript/JS 中的 URL 字符串字面量
	const tsRegex = /["'](https?:\/\/[^"'\s]+)["']/g;
	while ((match = tsRegex.exec(raw)) !== null) {
		links.push(match[1]);
	}
	return links;
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

export const entries: EntryGenerator = () => {
	const slugs = new Set<string>();

	/** 添加外部链接到 slug 集合 */
	function addUrl(url: string) {
		if (isExternal(url)) {
			slugs.add(encodeUrl(normalizeUrl(url)));
		}
	}

	// 1. 直接从 siteConfig 提取所有 URL（覆盖动态绑定的场景）
	for (const url of extractUrlsFromObject(siteConfig)) {
		addUrl(url);
	}

	// 2. 扫描 Markdown 文章中的外链
	const rawPosts = import.meta.glob('/src/content/posts/**/index.md', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;
	for (const content of Object.values(rawPosts)) {
		for (const url of extractExternalLinks(content)) {
			addUrl(url);
		}
	}

	// 3. 扫描 Svelte 组件中的外链
	const rawSvelte = import.meta.glob('/src/**/*.svelte', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;
	for (const content of Object.values(rawSvelte)) {
		for (const url of extractExternalLinks(content)) {
			addUrl(url);
		}
	}

	// 4. 扫描 TS/JS 配置文件中的外链
	const rawTs = import.meta.glob('/src/**/*.{ts,js}', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;
	for (const content of Object.values(rawTs)) {
		for (const url of extractExternalLinks(content)) {
			addUrl(url);
		}
	}

	// 5. 扫描友链数据中的外链
	const friendData = import.meta.glob('/src/data/friends/*.json', {
		eager: true
	}) as Record<string, { default: { url?: string } }>;
	for (const mod of Object.values(friendData)) {
		const url = mod.default?.url;
		if (url) addUrl(url);
	}

	// 6. 添加短链配置中的条目
	for (const target of Object.values(redirects)) {
		addUrl(target);
	}

	return Array.from(slugs).map((slug) => ({ slug }));
};
