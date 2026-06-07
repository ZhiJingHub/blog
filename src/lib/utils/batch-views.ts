import { browser } from '$app/environment';

const cache = new Map<string, number>();
let pendingPaths = new Set<string>();
let pendingResolvers: ((result: Map<string, number>) => void)[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function flushBatch() {
	if (pendingPaths.size === 0) return;
	const paths = Array.from(pendingPaths);
	pendingPaths.clear();
	const currentResolvers = pendingResolvers;
	pendingResolvers = [];
	batchTimer = null;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 5000);

	fetch('/api/views', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ paths }),
		signal: controller.signal
	})
		.then((res) => { clearTimeout(timeoutId); return res.json(); })
		.then((data: number[]) => {
			const result = new Map<string, number>();
			paths.forEach((p, i) => {
				const c = data[i] ?? 0;
				cache.set(p, c);
				result.set(p, c);
			});
			currentResolvers.forEach((resolve) => resolve(result));
		})
		.catch(() => {
			clearTimeout(timeoutId);
			currentResolvers.forEach((resolve) => resolve(new Map()));
		});
}

export function batchGetViews(paths: string[]): Promise<Map<string, number>> {
	if (!browser) return Promise.resolve(new Map());

	const uncached = paths.filter((p) => !cache.has(p));
	if (uncached.length === 0) {
		const result = new Map<string, number>();
		paths.forEach((p) => result.set(p, cache.get(p) ?? 0));
		return Promise.resolve(result);
	}

	for (const p of uncached) pendingPaths.add(p);
	if (batchTimer) clearTimeout(batchTimer);
	batchTimer = setTimeout(flushBatch, 50);

	return new Promise((resolve) => {
		pendingResolvers.push(() => {
			const final = new Map<string, number>();
			paths.forEach((p) => final.set(p, cache.get(p) ?? 0));
			resolve(final);
		});
	});
}
