<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { browser } from '$app/environment';
	import { SvelteMap } from 'svelte/reactivity';
	import { siteConfig } from '$lib/config/site';

	// 模块级请求缓存，避免列表页重复请求
	const viewCache = new SvelteMap<string, Promise<number>>();

	let {
		pathname,
		class: className = '',
		prefix = '',
		suffix = '次浏览',
		increment = true
	}: {
		pathname: string;
		class?: string;
		prefix?: string;
		suffix?: string;
		increment?: boolean;
	} = $props();

	let count = $state<number | null>(null);

	const apiEnabled = $derived(!!siteConfig.viewsApi);

	$effect(() => {
		if (!browser || !apiEnabled) return;

		const pathKey = pathname.replace(/\/$/, '') || '/';
		const cacheKey = `${increment ? 'inc' : 'read'}:${pathKey}`;
		let cancelled = false;

		// 检查本次会话是否已递增过该路径
		if (increment) {
			const sessionKey = `viewed:${pathKey}`;
			try {
				if (sessionStorage.getItem(sessionKey)) {
					// 已递增过，改为只读模式
					increment = false;
				} else {
					sessionStorage.setItem(sessionKey, '1');
				}
			} catch {
				// sessionStorage 不可用时仍正常递增
			}
		}

		// 用实际模式重新计算缓存键
		const finalCacheKey = `${increment ? 'inc' : 'read'}:${pathKey}`;

		if (!viewCache.has(finalCacheKey)) {
			viewCache.set(finalCacheKey, fetch(siteConfig.viewsApi, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(increment ? { path: pathKey } : { paths: [pathKey] })
			}).then((res) => res.ok ? res.json() : null).then((data) => {
				if (!data) return 0;
				return increment ? data.count : data[0] || 0;
			}).catch(() => 0));
		}

		viewCache.get(finalCacheKey)!.then((n) => { if (!cancelled) count = n; });

		return () => { cancelled = true; };
	});
</script>

{#if apiEnabled && count !== null}
	<span class={className} transition:fly={{ y: 8, duration: 350, easing: quintOut }}>
		{prefix}{count.toLocaleString()}{suffix}
	</span>
{/if}
