<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { browser } from '$app/environment';
	import { SvelteMap } from 'svelte/reactivity';

	// 仅在 Cloudflare 平台显示（KV 持久化存储）
	const isCloudflare = __PLATFORM__ === 'cloudflare' || __PLATFORM__ === 'cf-pages';

	// 模块级请求缓存，避免列表页重复请求
	const viewCache = new SvelteMap<string, Promise<number>>();

	let {
		pathname,
		class: className = '',
		prefix = '',
		suffix = '次浏览',
		increment = true,
		initialCount
	}: {
		pathname: string;
		class?: string;
		prefix?: string;
		suffix?: string;
		increment?: boolean;
		initialCount?: number;
	} = $props();

	let count = $state<number | null>(null);

	$effect(() => {
		if (!browser || !isCloudflare) return;
		if (initialCount !== undefined) {
			count = initialCount;
			return;
		}
		const key = pathname.replace(/\/$/, '') || '/';
		let cancelled = false;

		if (!viewCache.has(key)) {
			viewCache.set(key, fetch('/api/views', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(increment ? { path: key } : { paths: [key] })
			}).then((res) => res.ok ? res.json() : null).then((data) => {
				if (!data) return 0;
				return increment ? data.count : data[0] || 0;
			}).catch(() => 0));
		}

		viewCache.get(key)!.then((n) => { if (!cancelled) count = n; });

		return () => { cancelled = true; };
	});
</script>

{#if isCloudflare && count !== null}
	<span class={className} transition:fly={{ y: 8, duration: 350, easing: quintOut }}>
		{prefix}{count.toLocaleString()}{suffix}
	</span>
{/if}
