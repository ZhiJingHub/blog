import { dev } from '$app/environment';

if (__PLATFORM__ === 'vercel') {
	const { injectAnalytics } = await import('@vercel/analytics/sveltekit');
	injectAnalytics({ mode: dev ? 'development' : 'production' });
}

export const prerender = true;
export const ssr = true;
export const trailingSlash = 'always';
