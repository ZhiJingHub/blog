<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { siteConfig } from '$lib/config/site';
	import Icon from '@iconify/svelte';

	const errorMessages: Record<number, { title: string; description: string }> = {
		403: { title: '禁止访问', description: '你没有权限访问此页面' },
		404: { title: '页面走丢了', description: '你访问的页面不存在或已被移除' },
		500: { title: '服务器开小差了', description: '服务器遇到了一个错误，请稍后再试' },
		502: { title: '网关错误', description: '上游服务不可用，请稍后再试' },
		503: { title: '服务不可用', description: '服务器暂时无法处理请求，请稍后再试' }
	};

	let status = $derived(page.status);
	let error = $derived(page.error);
	let info = $derived(errorMessages[status] ?? { title: `错误 ${status}`, description: error?.message ?? '发生了未知错误' });
</script>

<svelte:head>
	<title>{status} - {siteConfig.title}</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
	<p class="text-8xl font-bold text-muted-foreground/30">{status}</p>
	<h1 class="text-2xl font-bold sm:text-3xl">{info.title}</h1>
	<p class="max-w-md text-muted-foreground">{info.description}</p>
	{#if error?.errorId}
		<p class="text-xs text-muted-foreground/60">错误 ID: {error.errorId}</p>
	{/if}
	<div class="flex gap-3">
		<a href="/"><Button><Icon icon="mdi:home" class="mr-2 h-4 w-4" />返回首页</Button></a>
		<a href="/posts/"><Button variant="outline"><Icon icon="mdi:post-outline" class="mr-2 h-4 w-4" />浏览文章</Button></a>
	</div>
</div>
