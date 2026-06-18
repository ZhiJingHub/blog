import { building } from '$app/environment';
import { redirects } from '$lib/config/redirects';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// 短链重定向（SSR 平台：Cloudflare/Vercel/Netlify）
	const pathname = event.url.pathname.replace(/\/$/, '') || '';
	if (pathname in redirects && !building) {
		return new Response(null, {
			status: 302,
			headers: { Location: redirects[pathname] }
		});
	}

	const start = Date.now();
	const response = await resolve(event);

	if (building) {
		const ms = Date.now() - start;
		console.log(`[prerender] ${event.url.pathname} -> ${response.status} (${ms}ms)`);
	}

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	return response;
};

export const handleError: HandleServerError = ({ error, event }) => {
	const errorId = crypto.randomUUID();
	console.error(`[error] ${errorId} ${event.request.method} ${event.url.pathname}`, error);
	return {
		message: '服务器内部错误',
		errorId
	};
};
