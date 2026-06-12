import { encodeUrl } from '$lib/utils/redirect';
import { redirects } from '$lib/config/redirects';
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

/** 从内容中提取外链 */
function extractExternalLinks(raw: string): string[] {
	const links: string[] = [];
	// Markdown 链接语法: [text](url)
	const mdRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
	let match: RegExpExecArray | null;
	while ((match = mdRegex.exec(raw)) !== null) {
		links.push(match[2]);
	}
	// HTML/Svelte 中的 href="url" 或 href={url}
	const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/g;
	while ((match = hrefRegex.exec(raw)) !== null) {
		links.push(match[1]);
	}
	return links;
}

export const entries: EntryGenerator = () => {
	const slugs = new Set<string>();

	// 扫描 Markdown 文章中的外链
	const rawPosts = import.meta.glob('/src/content/posts/**/index.md', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;
	for (const content of Object.values(rawPosts)) {
		for (const url of extractExternalLinks(content)) {
			slugs.add(encodeUrl(normalizeUrl(url)));
		}
	}

	// 扫描 Svelte 组件中的外链
	const rawSvelte = import.meta.glob('/src/**/*.svelte', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;
	for (const content of Object.values(rawSvelte)) {
		for (const url of extractExternalLinks(content)) {
			slugs.add(encodeUrl(normalizeUrl(url)));
		}
	}

	// 扫描友链数据中的外链
	const friendData = import.meta.glob('/src/data/friends/*.json', {
		eager: true
	}) as Record<string, { default: { url?: string } }>;
	for (const mod of Object.values(friendData)) {
		const url = mod.default?.url;
		if (url && /^https?:\/\//i.test(url)) {
			slugs.add(encodeUrl(normalizeUrl(url)));
		}
	}

	// 添加短链配置中的条目
	for (const target of Object.values(redirects)) {
		if (/^https?:\/\//i.test(target)) {
			slugs.add(encodeUrl(normalizeUrl(target)));
		}
	}

	return Array.from(slugs).map((slug) => ({ slug }));
};
