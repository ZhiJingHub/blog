import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** @deprecated 已迁移至独立 Cloudflare Worker，此端点保留兼容 */
export const prerender = false;

export const POST: RequestHandler = async () => {
	return json({ error: 'Deprecated: use external views API' }, { status: 410 });
};
