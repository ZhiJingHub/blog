<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Pagination from '$lib/components/ui/pagination';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '$lib/config/site';
	import PageViews from '$lib/components/PageViews.svelte';
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
		<div class="mb-6 flex items-center justify-between">
			<a href="/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
				<Icon icon="mdi:chevron-left" class="size-4" />
				返回首页
			</a>
			<span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
				<Icon icon="mdi:eye" class="size-3" />
				<PageViews pathname="/friends/" class="text-xs text-muted-foreground" />
			</span>
		</div>

		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">友情链接</h1>
			<p class="mt-2 text-lg text-muted-foreground">这里是我的朋友们，欢迎互相访问交流</p>
		</div>

		<Card class="mb-8">
			<CardHeader>
				<CardTitle class="text-xl">申请友链</CardTitle>
			</CardHeader>
			<CardContent class="space-y-8">
				<p class="text-base text-muted-foreground">欢迎与我交换友链，提交 Issue 即可自动完成。</p>

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
						<p>1. 在你的站点添加本站友链（<a href="https://iwexe.top" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">https://iwexe.top</a>）</p>
						<p>2. 点击下方按钮提交友链申请 Issue，填写表单即可</p>
						<p>3. 系统会自动校验并创建友链文件，校验通过后自动合并</p>
						<div class="pt-2">
							<a href="https://github.com/ZhiJingHub/blog/issues/new?template=friend-link.yml" target="_blank" rel="noopener noreferrer">
								<Button class="gap-2">
									<Icon icon="mdi:plus-circle" class="h-4 w-4" />
									提交友链申请
								</Button>
							</a>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<div>
			<h2 class="mb-6 text-xl font-bold">友链列表 ({friends.length})</h2>
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
												class="h-14 w-14 rounded-full object-cover"
												onerror={(e) => {
													(e.target as HTMLImageElement).style.display = 'none';
													(e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
												}}
											/>
										{/if}
										<div
											class="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground"
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
