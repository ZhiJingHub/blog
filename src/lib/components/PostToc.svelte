<script lang="ts">
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { tocFloating } from '$lib/stores/toc-floating.svelte';
	import { slugify } from '$lib/utils/slugify';

	let { container, trigger }: { container?: HTMLElement; trigger?: object } = $props();

	type Heading = { id: string; text: string; level: number };

	let headings = $state<Heading[]>([]);
	let activeId = $state('');
	let observer: IntersectionObserver | undefined;
	let rebuildGeneration = 0;

	let mobileOpen = $derived(tocFloating.open);
	let minLevel = $derived(headings.length ? Math.min(...headings.map((h) => h.level)) : 1);

	function indentClass(level: number): string {
		const depth = Math.max(0, level - minLevel);
		return ['pl-3', 'pl-6', 'pl-9', 'pl-12', 'pl-14'][depth] ?? 'pl-14';
	}

	async function rebuild() {
		const gen = ++rebuildGeneration;
		await tick();
		if (!container || gen !== rebuildGeneration) return;
		observer?.disconnect();

		const els = Array.from(container.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6'));
		const seen = new Map<string, number>();
		const list: Heading[] = [];

		for (const el of els) {
			const text = (el.textContent || '').trim();
			if (!text) continue;
			let id = el.id || slugify(text);
			if (seen.has(id)) {
				const n = (seen.get(id) || 1) + 1;
				seen.set(id, n);
				id = `${id}-${n}`;
			} else {
				seen.set(id, 1);
			}
			el.id = id;
			list.push({ id, text, level: Number(el.tagName.slice(1)) });
		}

		if (gen !== rebuildGeneration) return;
		headings = list;
		tocFloating.setAvailable(list.length > 0);
		if (list.length === 0) return;

		observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible.length > 0) activeId = (visible[0].target as HTMLElement).id;
			},
			{ rootMargin: '-80px 0px -60% 0px', threshold: 0 }
		);
		for (const el of els) observer.observe(el);

		const firstVisible = els.find((el) => el.getBoundingClientRect().bottom > 80);
		activeId = (firstVisible || els[0]).id;
	}

	$effect(() => {
		void trigger;
		void container;
		rebuild();
		return () => { observer?.disconnect(); tocFloating.reset(); };
	});

	function handleClick(e: MouseEvent, id: string) {
		const el = document.getElementById(id);
		if (!el) return;
		e.preventDefault();
		const top = el.getBoundingClientRect().top + window.scrollY - 72;
		window.scrollTo({ top, behavior: 'smooth' });
		history.replaceState(null, '', `#${id}`);
		tocFloating.setOpen(false);
	}
</script>

{#if headings.length > 0}
	<aside class="fixed top-24 right-[max(1rem,calc((100vw-48rem)/2-18rem))] z-30 hidden max-h-[calc(100vh-8rem)] w-56 overflow-y-auto pr-2 text-sm xl:block" aria-label="目录">
		<div class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">目录</div>
		<ul class="space-y-1 border-l border-border">
			{#each headings as h (h.id)}
				<li>
					<a
						href={`#${h.id}`}
						onclick={(e) => handleClick(e, h.id)}
						class="-ml-px block border-l-2 py-1 pr-2 transition-colors {indentClass(h.level)} {activeId === h.id ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'}"
					>{h.text}</a>
				</li>
			{/each}
		</ul>
	</aside>

	{#if mobileOpen}
		<div class="xl:hidden">
			<button type="button" aria-label="关闭目录" class="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onclick={() => tocFloating.setOpen(false)}></button>
			<div transition:fly={{ y: 20, duration: 200 }} role="dialog" aria-modal="true" aria-label="目录" class="fixed right-6 bottom-24 z-50 max-h-[60vh] w-72 overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-xl">
				<div class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">目录</div>
				<ul class="space-y-1 border-l border-border text-sm">
					{#each headings as h (h.id)}
						<li>
							<a
								href={`#${h.id}`}
								onclick={(e) => handleClick(e, h.id)}
								class="-ml-px block border-l-2 py-1 pr-2 transition-colors {indentClass(h.level)} {activeId === h.id ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
							>{h.text}</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
{/if}
