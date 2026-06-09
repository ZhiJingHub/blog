<script lang="ts">
	import '../app.css';
	import '$lib/icons';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import { siteConfig } from '$lib/config/site';
	import { inject } from '@vercel/analytics';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import BackToTop from '$lib/components/BackToTop.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import ExternalLinkInterceptor from '$lib/components/ExternalLinkInterceptor.svelte';

	inject({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	let { children } = $props();

	let isPostDetail = $derived(/^\/posts\/[^/]+\/?$/.test(page.url.pathname));
</script>

<svelte:head>
	<title>{siteConfig.title}</title>
	<link rel="icon" href={siteConfig.icon} />
	<meta name="description" content={siteConfig.description} />
	<meta name="keywords" content={siteConfig.keywords.join(', ')} />
	<meta property="og:site_name" content={siteConfig.title} />
	<meta property="og:locale" content={siteConfig.lang} />
	{#if !isPostDetail}
		<meta property="og:type" content="website" />
		<meta property="og:url" content={siteConfig.url} />
		<meta property="og:title" content={siteConfig.title} />
		<meta property="og:description" content={siteConfig.description} />
		<meta property="og:image" content="{siteConfig.url}{siteConfig.ogImage}" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={siteConfig.title} />
		<meta name="twitter:description" content={siteConfig.description} />
		<meta name="twitter:image" content="{siteConfig.url}{siteConfig.ogImage}" />
	{/if}
	<link rel="canonical" href="{siteConfig.url}{page.url.pathname}{page.url.pathname.endsWith('/') ? '' : '/'}" />
	<link rel="alternate" type="application/rss+xml" title="{siteConfig.title} RSS Feed" href="/rss.xml" />
	{#if siteConfig.analytics.umami.src && siteConfig.analytics.umami.websiteId}
		<script defer src={siteConfig.analytics.umami.src} data-website-id={siteConfig.analytics.umami.websiteId}></script>
	{/if}
</svelte:head>

<NavBar />

<div class="flex min-h-screen flex-col">
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>

<BackToTop />
<Toast />
<ExternalLinkInterceptor />
