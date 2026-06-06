import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const devStore = new Map<string, number>();

function cleanPath(path: string): string {
	try {
		const parsed = new URL(path, 'http://dummy.com');
		return parsed.pathname.replace(/\/$/, '') || '/';
	} catch {
		return path.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
	}
}

async function getCount(kv: KVNamespace, key: string): Promise<number> {
	const raw = await kv.get(key);
	const count = parseInt(raw || '0', 10);
	return Number.isNaN(count) ? 0 : count;
}

async function incrementCount(kv: KVNamespace, key: string): Promise<number> {
	const current = await getCount(kv, key);
	const next = current + 1;
	await kv.put(key, String(next));
	return next;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: { paths?: string[]; path?: string };
	try {
		body = await request.json();
	} catch {
		return json({ count: 0 });
	}

	const kv = platform?.env?.VIEWS as KVNamespace | undefined;

	// 批量查询模式
	if (body.paths) {
		if (!Array.isArray(body.paths) || body.paths.length > 100) return json([]);
		const results: number[] = [];
		for (const rawPath of body.paths) {
			const key = cleanPath(rawPath);
			if (kv) {
				results.push(await getCount(kv, key));
			} else {
				results.push(devStore.get(key) || 0);
			}
		}
		return json(results);
	}

	// 单路径递增模式
	const key = cleanPath(body.path || '');

	if (kv) {
		const count = await incrementCount(kv, key);
		return json({ count });
	}

	// 开发模式回退
	const current = devStore.get(key) || 0;
	const next = current + 1;
	devStore.set(key, next);
	return json({ count: next });
};
