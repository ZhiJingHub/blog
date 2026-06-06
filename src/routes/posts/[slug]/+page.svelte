<script lang="ts">
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { siteConfig } from '$lib/config/site';
	import { formatDate } from '$lib/utils/format';
	import { renderMermaidIn } from '$lib/utils/mermaid';
	import PostToc from '$lib/components/PostToc.svelte';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let proseEl: HTMLDivElement | undefined = $state();
	let PostContent = $derived(data.component);

	$effect(() => {
		void PostContent;
		(async () => {
			await tick();
			if (proseEl) {
				try {
					await renderMermaidIn(proseEl);
				} catch (e) {
					console.error('[Mermaid] 渲染失败:', e);
				}
			}
		})();
	});
</script>

<svelte:head>
	<title>{data.post.metadata.title} - {siteConfig.title}</title>
	<meta name="description" content={data.post.metadata.description} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.post.metadata.title} />
	<meta property="og:description" content={data.post.metadata.description} />
	<meta property="og:url" content="{siteConfig.url}/posts/{page.params.slug}/" />
	{#if data.post.metadata.image}
		<meta property="og:image" content={data.post.metadata.image.startsWith('http') ? data.post.metadata.image : `${siteConfig.url}${data.post.metadata.image}`} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content={data.post.metadata.image.startsWith('http') ? data.post.metadata.image : `${siteConfig.url}${data.post.metadata.image}`} />
	{/if}
	<meta name="twitter:title" content={data.post.metadata.title} />
	<meta name="twitter:description" content={data.post.metadata.description} />
	{#if !data.post.metadata.image}
		<meta name="twitter:card" content="summary" />
	{/if}
	<meta property="article:published_time" content={data.post.metadata.published} />
	{#if data.post.metadata.updated}
		<meta property="article:modified_time" content={data.post.metadata.updated} />
	{/if}
	{#if data.post.metadata.author}
		<meta property="article:author" content={data.post.metadata.author} />
	{/if}
</svelte:head>

<article class="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
	<div class="mb-6">
		<a href="/posts">
			<Button variant="ghost" size="sm">← 返回文章列表</Button>
		</a>
	</div>

	<header class="mb-8">
		<div class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
			{#if data.post.metadata.pinned}
				<Badge>置顶</Badge>
			{/if}
			<time class="text-sm text-muted-foreground">{formatDate(data.post.metadata.published)}</time>
			<span class="text-sm text-muted-foreground">· {data.post.metadata.stats.wordCount.toLocaleString()} 字</span>
			<span class="text-sm text-muted-foreground">· 约 {data.post.metadata.stats.readTime} 分钟</span>
			{#if data.post.metadata.updated}
				<span class="text-sm text-muted-foreground">· 更新于 {formatDate(data.post.metadata.updated)}</span>
			{/if}
		</div>

		<h1 class="mb-4 text-3xl font-bold sm:text-4xl">{data.post.metadata.title}</h1>
		<p class="text-lg text-muted-foreground">{data.post.metadata.description}</p>

		{#if data.post.metadata.image}
			<div class="mt-6">
				<img src={data.post.metadata.image} alt={data.post.metadata.title} class="w-full rounded-lg object-cover" />
			</div>
		{/if}

		{#if data.post.metadata.tags && data.post.metadata.tags.length > 0}
			<div class="mt-4 flex flex-wrap gap-2">
				{#each data.post.metadata.tags as tag}
					<span class="rounded-md bg-muted px-2.5 py-1 text-sm text-muted-foreground">{tag}</span>
				{/each}
			</div>
		{/if}
	</header>

	<div
		bind:this={proseEl}
		class="prose max-w-none break-words prose-neutral dark:prose-invert
			prose-headings:text-foreground
			prose-p:text-foreground
			prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:opacity-80
			prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
			prose-strong:text-foreground
			prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none
			prose-th:border prose-th:border-border prose-th:bg-muted
			prose-td:border prose-td:border-border
			prose-img:rounded-lg
			prose-hr:border-border"
	>
		<PostContent />
	</div>

	<PostToc container={proseEl} trigger={PostContent} />

	<footer class="mt-12 border-t pt-8">
		<div class="flex justify-center">
			<a href="/posts">
				<Button>← 返回文章列表</Button>
			</a>
		</div>
	</footer>
</article>

<ImageViewer />
