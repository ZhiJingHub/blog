import { getAllPosts, getPostBySlug, getPostComponent } from '$lib/utils/posts';
import { resolvePostAssetPath } from '$lib/utils/asset-path';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

// 有文章时才预渲染，避免空目录构建报错
export const prerender = getAllPosts().length > 0;

export const entries: EntryGenerator = () => {
	return getAllPosts().map((post) => ({ slug: post.slug }));
};

export const load: PageLoad = async ({ params }) => {
	const post = getPostBySlug(params.slug);

	if (!post) {
		throw error(404, '文章不存在');
	}

	const component = await getPostComponent(params.slug);

	if (!component) {
		throw error(404, '文章内容加载失败');
	}

	const metadata = {
		...post.metadata,
		image: resolvePostAssetPath(params.slug, post.metadata.image)
	};

	return {
		post: {
			...post,
			metadata
		},
		component
	};
};
