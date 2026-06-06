import { building } from '$app/environment';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const response = await resolve(event);
	if (building) {
		const ms = Date.now() - start;
		console.log(`[prerender] ${event.url.pathname} -> ${response.status} (${ms}ms)`);
	}
	return response;
};

export const handleError: HandleServerError = ({ error, event }) => {
	console.error(`[error] ${event.request.method} ${event.url.pathname}`, error);
	return {
		message: '服务器内部错误'
	};
};
