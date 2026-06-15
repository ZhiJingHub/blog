<script lang="ts">
	import Icon from '@iconify/svelte';
	import CoverGenerator from '$lib/components/CoverGenerator.svelte';
	import { siteConfig } from '$lib/config/site';
	import PageViews from '$lib/components/PageViews.svelte';
</script>

<svelte:head>
	<title>封面制作 - {siteConfig.title}</title>
	<meta name="description" content="在线封面图制作工具，支持自定义文本、图标、背景和多种导出格式" />
	<meta property="og:title" content="封面制作 - {siteConfig.title}" />
	<meta property="og:description" content="在线封面图制作工具，支持自定义文本、图标、背景和多种导出格式" />
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="container mx-auto max-w-7xl px-4 pt-6 pb-12 sm:pt-8">
		<div class="mb-6 flex items-center justify-between">
			<a href="/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
				<Icon icon="mdi:chevron-left" class="size-4" />
				返回首页
			</a>
			<span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
				<Icon icon="mdi:eye" class="size-3" />
				<PageViews pathname="/cover/" class="text-xs text-muted-foreground" />
			</span>
		</div>
		<CoverGenerator />
	</div>
</div>
