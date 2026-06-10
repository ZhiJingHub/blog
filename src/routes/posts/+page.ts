import { getAllPosts } from '$lib/utils/posts';
import { resolvePostAssetPath } from '$lib/utils/asset-path';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const posts = getAllPosts().map((post) => ({
		...post,
		metadata: {
			...post.metadata,
			image: resolvePostAssetPath(post.slug, post.metadata.image)
		}
	}));

	// 批量获取浏览量
	const paths = posts.map((p) => `/posts/${p.slug}/`);
	let viewCounts: Record<string, number> = {};
	try {
		const res = await fetch('/api/views', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ paths })
		});
		if (res.ok) {
			const counts: number[] = await res.json();
			paths.forEach((path, i) => {
				viewCounts[path] = counts[i] ?? 0;
			});
		}
	} catch {
		// 静默失败，浏览量显示 0
	}

	return { posts, viewCounts };
};
