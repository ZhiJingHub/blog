import { encodeUrl } from '$lib/utils/redirect';
import { redirects } from '$lib/config/redirects';
import type { EntryGenerator } from './$types';

/** 扫描 Markdown 内容中的外链 */
function extractExternalLinks(raw: string): string[] {
	const regex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
	const links: string[] = [];
	let match: RegExpExecArray | null;
	while ((match = regex.exec(raw)) !== null) {
		links.push(match[2]);
	}
	return links;
}

export const entries: EntryGenerator = () => {
	const slugs = new Set<string>();

	// 扫描所有文章中的外链
	const rawPosts = import.meta.glob('/src/content/posts/**/index.md', {
		query: '?raw',
		eager: true
	}) as Record<string, string>;

	for (const content of Object.values(rawPosts)) {
		for (const url of extractExternalLinks(content)) {
			slugs.add(encodeUrl(url));
		}
	}

	// 添加短链配置中的条目
	for (const target of Object.values(redirects)) {
		if (/^https?:\/\//i.test(target)) {
			slugs.add(encodeUrl(target));
		}
	}

	return Array.from(slugs).map((slug) => ({ slug }));
};
