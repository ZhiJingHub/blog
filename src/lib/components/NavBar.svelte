<script lang="ts">
	import { siteConfig } from '$lib/config/site';
	import ThemeToggle from './ThemeToggle.svelte';
</script>

<nav
	aria-label="主导航"
	class="sticky top-0 z-40 w-full bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="relative flex h-14 items-center justify-center">
		<div class="absolute right-4">
			<ThemeToggle />
		</div>
		<a href="/" class="flex items-center space-x-2 transition-opacity hover:opacity-80" aria-label="返回首页">
			<img src={siteConfig.icon} alt="" class="h-6 w-6 rounded-full" aria-hidden="true" />
			<span class="font-medium">{siteConfig.title}</span>
		</a>
	</div>
</nav>
