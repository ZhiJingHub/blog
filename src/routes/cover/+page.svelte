<script lang="ts">
	import CoverGenerator from '$lib/components/CoverGenerator.svelte';
	import { siteConfig } from '$lib/config/site';
</script>

<svelte:head>
	<title>封面制作 - {siteConfig.title}</title>
	<meta name="description" content="在线封面图制作工具，支持自定义文本、图标、背景和多种导出格式" />
	<meta property="og:title" content="封面制作 - {siteConfig.title}" />
	<meta property="og:description" content="在线封面图制作工具，支持自定义文本、图标、背景和多种导出格式" />
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="container mx-auto max-w-7xl px-4 pt-6 pb-12 sm:pt-8">
		<div class="mb-6">
			<a href="/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
				返回首页
			</a>
		</div>
		<CoverGenerator />
	</div>
</div>
