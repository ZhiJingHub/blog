import type { PostMetadata, RawPostMetadata } from '$lib/types/post';
import type { Component } from 'svelte';

const postModules = import.meta.glob('/src/content/posts/**/index.md', { eager: true });
const postModuleLoaders = import.meta.glob('/src/content/posts/**/index.md');

interface PostModule {
	slug: string;
	metadata: PostMetadata;
}

let cachedPosts: PostModule[] | null = null;

const DEFAULT_STATS = { wordCount: 0, readTime: 0, imageCount: 0 };

function getPublishedDate(meta: PostMetadata): number {
	const timestamp = new Date(meta.published).getTime();
	return isNaN(timestamp) ? 0 : timestamp;
}

function isValidMetadata(raw: unknown): raw is RawPostMetadata {
	if (typeof raw !== 'object' || raw === null) return false;
	const m = raw as Record<string, unknown>;
	const hasPublishedDate = typeof m.published === 'string' || typeof m.date === 'string';
	return typeof m.title === 'string' && hasPublishedDate && typeof m.description === 'string';
}

function normalizeMetadata(raw: RawPostMetadata): PostMetadata {
	return {
		...raw,
		published: raw.published ?? raw.date ?? '',
		stats: raw.stats ?? DEFAULT_STATS
	};
}

export type { PostModule };

export function getAllPosts(): PostModule[] {
	if (cachedPosts) return cachedPosts;

	const posts: PostModule[] = [];

	for (const [path, module] of Object.entries(postModules)) {
		const slug = path.split('/').slice(-2, -1)[0];
		const mod = module as Record<string, unknown>;

		const metadata = mod.metadata as RawPostMetadata;
		if (!isValidMetadata(metadata)) {
			console.warn(`[posts] Invalid metadata in ${path}, skipping`);
			continue;
		}
		if (metadata.draft) continue;

		posts.push({ slug, metadata: normalizeMetadata(metadata) });
	}

	cachedPosts = posts.sort((a, b) => {
		if (a.metadata.pinned && !b.metadata.pinned) return -1;
		if (!a.metadata.pinned && b.metadata.pinned) return 1;
		return getPublishedDate(b.metadata) - getPublishedDate(a.metadata);
	});

	return cachedPosts;
}

export function getPostBySlug(slug: string): PostModule | undefined {
	return getAllPosts().find((post) => post.slug === slug);
}

export async function getPostComponent(slug: string): Promise<Component | null> {
	try {
		const path = `/src/content/posts/${slug}/index.md`;

		if (path in postModuleLoaders) {
			const mod = await postModuleLoaders[path]();
			return (mod as Record<string, unknown>).default as Component;
		}
	} catch (error) {
		console.error('Error loading post component:', error);
	}

	return null;
}
