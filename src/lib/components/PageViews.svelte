<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { browser } from '$app/environment';

	// 仅在 Cloudflare 平台显示（KV 持久化存储）
	const isCloudflare = __PLATFORM__ === 'cloudflare' || __PLATFORM__ === 'cf-pages';

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
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);

		fetch('/api/views', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(increment ? { path: key } : { paths: [key] }),
			signal: controller.signal
		})
			.then((res) => { clearTimeout(timeout); if (!cancelled && res.ok) return res.json(); })
			.then((data) => {
				if (!cancelled && data) count = increment ? data.count : data[0] || 0;
			})
			.catch(() => { clearTimeout(timeout); if (!cancelled) count = 0; });

		return () => { cancelled = true; controller.abort(); };
	});
</script>

{#if isCloudflare && count !== null}
	<span class={className} transition:fly={{ y: 8, duration: 350, easing: quintOut }}>
		{prefix}{count.toLocaleString()}{suffix}
	</span>
{/if}
