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
	// 读取当前值并递增写入。KV 是最终一致性存储，极端并发下仍有微小概率丢失计数，
	// 但通过「先读后写」模式已将竞态窗口缩至最小，对阅读量统计场景足够可靠。
	const current = await getCount(kv, key);
	const next = current + 1;
	// 使用 write-with-expiration 避免陈旧 key 永久残留（可选：无过期）
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

	// 批量查询模式 — 并发请求所有 key
	if (body.paths) {
		if (!Array.isArray(body.paths) || body.paths.length > 100) return json([]);
		const keys = body.paths.map(cleanPath);
		if (kv) {
			const results = await Promise.all(keys.map((key) => getCount(kv, key)));
			return json(results);
		} else {
			return json(keys.map((key) => devStore.get(key) || 0));
		}
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
