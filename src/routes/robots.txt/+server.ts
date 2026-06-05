import { siteConfig } from '$lib/config/site';
import type { RequestHandler } from './$types';

export const prerender = true;

export const entries = () => [{ id: '' }];

export const GET: RequestHandler = () => {
	return new Response(`User-agent: *\nAllow: /\nSitemap: ${siteConfig.url}/sitemap.xml\n`, {
		headers: { 'Content-Type': 'text/plain' }
	});
};
