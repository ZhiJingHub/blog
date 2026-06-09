<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import * as Pagination from '$lib/components/ui/pagination';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '$lib/config/site';
	import { formatDate } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let prevSearchQuery = $state('');
	let currentPage = $state(1);
	const postsPerPage = 10;

	$effect(() => {
		if (searchQuery !== prevSearchQuery) {
			prevSearchQuery = searchQuery;
			currentPage = 1;
		}
	});

	let displayPosts = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return data.posts;
		return data.posts.filter(
			(p) =>
				p.metadata.title.toLowerCase().includes(q) ||
				p.metadata.description.toLowerCase().includes(q) ||
				(p.metadata.tags ?? []).some((t) => t.toLowerCase().includes(q))
		);
	});

	let totalPages = $derived(Math.ceil(displayPosts.length / postsPerPage));
	let paginatedPosts = $derived.by(() => {
		const start = (currentPage - 1) * postsPerPage;
		return displayPosts.slice(start, start + postsPerPage);
	});
</script>

<svelte:head>
	<title>文章列表 - {siteConfig.title}</title>
	<meta name="description" content="浏览所有文章" />
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
	<div class="mb-6">
		<a href="/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
			返回首页
		</a>
	</div>

	<div class="mb-8 text-center">
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">文章列表</h1>
		<p class="mt-2 text-lg text-muted-foreground">分享技术、想法和经验</p>
		{#if data.posts.length > 0}
			{@const totalWords = data.posts.reduce((sum, p) => sum + (p.metadata.stats?.wordCount ?? 0), 0)}
			{@const totalImages = data.posts.reduce((sum, p) => sum + (p.metadata.stats?.imageCount ?? 0), 0)}
			<p class="mt-2 text-sm text-muted-foreground">
				共 {data.posts.length} 篇文章 · {totalWords.toLocaleString()} 字
				{#if totalImages > 0}
					 · {totalImages} 张图片
				{/if}
			</p>
		{/if}
	</div>

	<div class="mb-6 sm:mb-8">
		<Input type="text" bind:value={searchQuery} placeholder="搜索文章标题、描述、标签..." class="w-full" aria-label="搜索文章" />
		{#if searchQuery}
			<div class="mt-2 min-h-[20px]">
				{#if displayPosts.length === 0}
					<p class="text-sm text-muted-foreground">未找到匹配的文章</p>
				{:else}
					<p class="text-sm text-muted-foreground">找到 {displayPosts.length} 篇文章</p>
				{/if}
			</div>
		{/if}
	</div>

	{#if paginatedPosts.length === 0}
		<div class="py-16 text-center">
			<Icon icon="mdi:file-document-outline" class="mx-auto mb-4 size-12 text-muted-foreground/30" />
			<p class="text-muted-foreground">
				{searchQuery ? '未找到匹配的文章' : '暂无文章'}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{searchQuery ? '尝试其他关键词' : '在 src/content/posts/ 目录下创建 Markdown 文件即可'}
			</p>
		</div>
	{:else}
		<div class="space-y-4 sm:space-y-6">
			{#each paginatedPosts as post (post.slug)}
				<a href="/posts/{post.slug}" class="block">
					<Card class="group transition-all hover:shadow-md">
						<CardContent class="p-4 sm:p-6">
							<div class="flex flex-col gap-4 sm:flex-row">
								{#if post.metadata.image}
									<div class="sm:w-44 sm:shrink-0">
										<img src={post.metadata.image} alt={post.metadata.title} class="h-40 w-full rounded-lg object-cover sm:h-32" />
									</div>
								{/if}
								<div class="min-w-0 flex-1">
									<div class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
										{#if post.metadata.pinned}
											<Badge class="shrink-0">置顶</Badge>
										{/if}
										<time datetime={post.metadata.published} class="shrink-0 text-sm text-muted-foreground">{formatDate(post.metadata.published)}</time>
										<span class="shrink-0 text-sm text-muted-foreground">· {(post.metadata.stats?.wordCount ?? 0).toLocaleString()} 字</span>
										<span class="shrink-0 text-sm text-muted-foreground">· 约 {post.metadata.stats?.readTime ?? 0} 分钟</span>
									</div>
									<h2 class="mb-2 text-xl font-semibold break-words group-hover:text-primary sm:text-2xl">{post.metadata.title}</h2>
									<p class="line-clamp-2 text-sm text-muted-foreground sm:text-base">{post.metadata.description}</p>
									{#if post.metadata.tags && post.metadata.tags.length > 0}
										<div class="mt-3 flex flex-wrap gap-1.5">
											{#each post.metadata.tags as tag}
												<span class="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</CardContent>
					</Card>
				</a>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="mt-8 flex justify-center">
				<Pagination.Root count={displayPosts.length} perPage={postsPerPage} bind:page={currentPage}>
					{#snippet children({ pages })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.PrevButton>
									{#snippet children()}
										<Icon icon="mdi:chevron-left" class="h-4 w-4" />
										<span>上一页</span>
									{/snippet}
								</Pagination.PrevButton>
							</Pagination.Item>
							{#each pages as page (page.key)}
								{#if page.type === 'ellipsis'}
									<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
								{:else}
									<Pagination.Item>
										<Pagination.Link {page} isActive={currentPage === page.value}>{page.value}</Pagination.Link>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.NextButton>
									{#snippet children()}
										<span>下一页</span>
										<Icon icon="mdi:chevron-right" class="h-4 w-4" />
									{/snippet}
								</Pagination.NextButton>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</div>
		{/if}
	{/if}
</div>
