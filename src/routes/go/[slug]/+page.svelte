<script lang="ts">
	import { page } from '$app/state';
	import { siteConfig } from '$lib/config/site';
	import { decodeUrl } from '$lib/utils/redirect'; // 客户端兜底解码
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// 优先使用服务端数据，回退到客户端解码
	let target = $derived.by(() => {
		if (data.target) return data.target;
		// 客户端兜底（静态部署时服务端 load 不运行）
		const decoded = decodeUrl(page.params.slug) ?? '';
		if (!decoded) return '';
		try {
			const url = new URL(decoded);
			if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
			return decoded;
		} catch {
			return '';
		}
	});
	let targetHost = $derived.by(() => {
		try {
			return target ? new URL(target).host : '';
		} catch {
			return '';
		}
	});

	let countdown = $state(3);
	let timer: ReturnType<typeof setInterval> | undefined;

	$effect(() => {
		if (!target) return;
		countdown = 3;
		timer = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(timer);
				window.location.href = target;
			}
		}, 1000);
		return () => clearInterval(timer);
	});

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>跳转中... - {siteConfig.title}</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center px-4">
	{#if target}
		<Card class="w-full max-w-md">
			<CardContent class="pt-6">
				<div class="space-y-6 text-center">
					<div class="flex justify-center">
						<div class="rounded-full bg-primary/10 p-4">
							<Icon icon="mdi:arrow-right-circle" class="size-14 text-primary" />
						</div>
					</div>

					<div class="space-y-1">
						<h1 class="text-2xl font-bold">正在跳转</h1>
						<p class="text-muted-foreground">
							{siteConfig.title} 正在将您重定向至外部链接
						</p>
					</div>

					<div class="space-y-2">
						{#if targetHost}
							<div class="rounded-md border bg-muted/30 px-3 py-2 text-left">
								<p class="mb-0.5 text-xs text-muted-foreground">目标域名</p>
								<p class="break-all text-sm font-medium">{targetHost}</p>
							</div>
						{/if}
						<div class="rounded-md border bg-muted/30 px-3 py-2 text-left">
							<p class="mb-0.5 text-xs text-muted-foreground">完整地址</p>
							<p class="break-all text-xs text-muted-foreground">{target}</p>
						</div>
					</div>

					<div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<div
							class="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
						></div>
						<span>{countdown} 秒后自动跳转</span>
					</div>

					<div class="space-y-2">
						<Button href={target} class="w-full" target="_blank" rel="noopener noreferrer">
							<Icon icon="mdi:open-in-new" class="mr-1 size-4" />
							立即前往（{countdown}）
						</Button>
						<Button variant="outline" class="w-full" onclick={goBack}>
							<Icon icon="mdi:arrow-left" class="mr-1 size-4" />
							返回上一页
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	{:else}
		<Card class="w-full max-w-md">
			<CardContent class="pt-6">
				<div class="space-y-4 text-center">
					<div class="flex justify-center">
						<div class="rounded-full bg-destructive/10 p-4">
							<Icon icon="mdi:link-variant-off" class="size-14 text-destructive" />
						</div>
					</div>
					<h1 class="text-2xl font-bold">链接无效</h1>
					<p class="text-muted-foreground">无法解析目标地址，请检查链接是否正确。</p>
					<Button href="/" class="w-full">
						<Icon icon="mdi:home" class="mr-1 size-4" />
						返回首页
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
