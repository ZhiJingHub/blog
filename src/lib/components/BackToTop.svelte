<script lang="ts">
	import Icon from '@iconify/svelte';
	let visible = $state(false);
	let ticking = false;

	function onScroll() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			visible = window.scrollY > 300;
			ticking = false;
		});
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	$effect(() => {
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<button
	onclick={scrollToTop}
	class="fixed bottom-6 right-20 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md ring-1 ring-foreground/10 transition-all hover:text-foreground hover:ring-foreground/20 {visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}"
	aria-label="回到顶部"
>
	<Icon icon="mdi:chevron-up" class="size-5" />
</button>
