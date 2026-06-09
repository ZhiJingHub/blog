<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Pagination from '$lib/components/ui/pagination';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '$lib/config/site';
	import { toast } from '$lib/stores/toast.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let friends = $derived(data.friends);
	let currentPage = $state(1);
	const itemsPerPage = 12;
	let totalPages = $derived(Math.ceil(friends.length / itemsPerPage));
	let paginatedFriends = $derived.by(() => {
		const page = Math.max(1, Math.min(currentPage, totalPages || 1));
		return friends.slice((page - 1) * itemsPerPage, page * itemsPerPage);
	});

	let copied = $state<string | null>(null);
	const siteJson = JSON.stringify(
		{ name: siteConfig.bio.name, avatar: siteConfig.bio.avatar, description: siteConfig.description, url: siteConfig.url },
		null, 2
	);
	const templateJson = `{
  "name": "你的网站名称",
  "avatar": "你的头像 URL",
  "description": "网站描述",
  "url": "你的网站地址"
}`;
	function copyText(text: string, key: string) {
		navigator.clipboard.writeText(text).then(() => {
			copied = key;
			setTimeout(() => (copied = null), 2000);
		}).catch(() => {
			toast.error('复制失败', '请手动复制内容');
		});
	}
</script>

<svelte:head>
	<title>友链 - {siteConfig.title}</title>
	<meta name="description" content="友情链接页面，展示我的朋友们和他们的博客站点" />
	<meta property="og:title" content="友链 - {siteConfig.title}" />
	<meta property="og:description" content="友情链接页面，展示我的朋友们和他们的博客站点" />
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="container mx-auto max-w-6xl px-4 pt-6 pb-12 sm:pt-8">
		<div class="mb-6">
			<a href="/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
				返回首页
			</a>
		</div>

		<div class="mb-8 text-center">
			<h1 class="flex items-center justify-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
				<Icon icon="mdi:link-variant" class="size-8 text-primary" />
				友情链接
			</h1>
			<p class="mt-2 text-lg text-muted-foreground">这里是我的朋友们，欢迎互相访问交流</p>
		</div>

		<Card class="mb-8">
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-xl">
					<Icon icon="mdi:link-plus" class="size-5" />
					申请友链
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-8">
				<p class="text-base text-muted-foreground">欢迎与我交换友链，请在你的站点添加以下信息后提交 PR。</p>

				<div class="space-y-3">
					<p class="text-base font-semibold">本站信息</p>
					<div class="relative rounded-lg border bg-muted/30 p-5">
						<Button variant="ghost" size="sm" class="absolute top-3 right-3 h-7 text-xs" onclick={() => copyText(siteJson, 'site')}>
							<Icon icon={copied === 'site' ? 'mdi:check' : 'mdi:content-copy'} class="mr-1 h-3.5 w-3.5" />
							{copied === 'site' ? '已复制' : '复制'}
						</Button>
						<pre class="overflow-x-auto text-sm leading-relaxed text-foreground"><code>{siteJson}</code></pre>
					</div>
				</div>

				<div class="space-y-3">
					<p class="text-base font-semibold">申请方式</p>
					<div class="space-y-3 text-base text-muted-foreground">
						<p>1. Fork 本仓库：<a href="https://github.com/ZhiJingHub/blog" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">github.com/ZhiJingHub/blog</a></p>
						<p>2. 在 <code class="rounded bg-muted px-1.5 py-0.5 text-sm">src/data/friends/</code> 目录下创建 JSON 文件（<a href="https://github.com/ZhiJingHub/blog/tree/main/src/data/friends" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">查看目录</a>）</p>
						<p>3. 文件格式：</p>
						<div class="relative rounded-lg border bg-muted/30 p-5">
							<Button variant="ghost" size="sm" class="absolute top-3 right-3 h-7 text-xs" onclick={() => copyText(templateJson, 'template')}>
								<Icon icon={copied === 'template' ? 'mdi:check' : 'mdi:content-copy'} class="mr-1 h-3.5 w-3.5" />
								{copied === 'template' ? '已复制' : '复制'}
							</Button>
							<pre class="overflow-x-auto text-sm leading-relaxed text-foreground"><code>{templateJson}</code></pre>
						</div>
						<p>4. 提交 Pull Request，构建时会自动加载合并</p>
						<p>5. 支持双向链接验证，请在你的友链页面添加本站链接（<a href="https://iwexe.top" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">https://iwexe.top</a>）</p>
						<p>6. 在 PR 中添加 <code class="rounded bg-muted px-1.5 py-0.5 text-sm">backlink</code> 字段指向你的友链页面，系统会自动验证双向链接</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<div>
			<h2 class="mb-6 flex items-center gap-2 text-xl font-bold">
				<Icon icon="mdi:account-group" class="size-5" />
				友链列表 ({friends.length})
			</h2>
			{#if friends.length === 0}
				<Card><CardContent class="py-12 text-center text-muted-foreground">暂无友链</CardContent></Card>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each paginatedFriends as friend (friend.url)}
						<a href={friend.url} target="_blank" rel="noopener noreferrer" class="block" aria-label={friend.name}>
							<Card class="h-full transition-all hover:shadow-md">
								<CardContent class="flex items-start gap-4 p-5">
									<div class="relative h-14 w-14 shrink-0">
										{#if friend.avatar}
											<img
												src={friend.avatar}
												alt={friend.name}
												class="h-14 w-14 rounded-lg object-cover"
												onerror={(e) => {
													(e.target as HTMLImageElement).style.display = 'none';
													(e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
												}}
											/>
										{/if}
										<div
											class="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-xl font-bold text-muted-foreground"
											hidden={!!friend.avatar}
										>
											{friend.name.charAt(0)}
										</div>
									</div>
									<div class="min-w-0 flex-1">
										<div class="truncate font-semibold">{friend.name}</div>
										<div class="mt-1 line-clamp-2 text-sm text-muted-foreground" title={friend.description || '暂无描述'}>
											{friend.description || '暂无描述'}
										</div>
									</div>
								</CardContent>
							</Card>
						</a>
					{/each}
				</div>

				{#if totalPages > 1}
					<div class="mt-8 flex justify-center">
						<Pagination.Root count={friends.length} perPage={itemsPerPage} bind:page={currentPage}>
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
	</div>
</div>
