<script lang="ts">
	import { onMount } from 'svelte';
	import { siteConfig } from '$lib/config/site';
	import { themeStore } from '$lib/stores/theme.svelte';

	const hasConfig = $derived(!!(siteConfig.giscus?.repoId && siteConfig.giscus?.categoryId));

	$effect(() => {
		if (!hasConfig) return;
		const dark = themeStore.isDark;
		const frame = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
		if (frame?.contentWindow) {
			frame.contentWindow.postMessage(
				{ giscus: { setConfig: { theme: dark ? 'dark' : 'light' } } },
				'https://giscus.app'
			);
		}
	});

	onMount(() => {
		if (!hasConfig) return;
		const container = document.getElementById('giscus-container');
		if (!container || container.querySelector('iframe.giscus-frame')) return;

		const dark = document.documentElement.classList.contains('dark');
		const script = document.createElement('script');
		script.src = 'https://giscus.app/client.js';
		script.setAttribute('data-repo', siteConfig.giscus!.repo);
		script.setAttribute('data-repo-id', siteConfig.giscus!.repoId);
		script.setAttribute('data-category', siteConfig.giscus!.category);
		script.setAttribute('data-category-id', siteConfig.giscus!.categoryId);
		script.setAttribute('data-mapping', 'pathname');
		script.setAttribute('data-strict', '1');
		script.setAttribute('data-reactions-enabled', '1');
		script.setAttribute('data-emit-metadata', '0');
		script.setAttribute('data-input-position', 'top');
		script.setAttribute('data-theme', dark ? 'dark' : 'light');
		script.setAttribute('data-lang', 'zh-CN');
		script.setAttribute('data-loading', 'lazy');
		script.setAttribute('crossorigin', 'anonymous');
		script.async = true;
		container.appendChild(script);
	});
</script>

<div id="giscus-container" class="mt-12">
	{#if !hasConfig}
		<p class="text-center text-sm text-muted-foreground">请在 site.ts 中配置 giscus 的 repoId 和 categoryId 以启用评论。</p>
	{/if}
</div>
