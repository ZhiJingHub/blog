<script lang="ts">
	let visible = $state(false);

	function onScroll() {
		visible = window.scrollY > 300;
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
	class="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md ring-1 ring-foreground/10 transition-all hover:text-foreground hover:ring-foreground/20 {visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}"
	aria-label="回到顶部"
>
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6" /></svg>
</button>
