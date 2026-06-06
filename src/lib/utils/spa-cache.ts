interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

class SPACache {
	private cache = new Map<string, CacheEntry<any>>();

	async get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = this.cache.get(key);
		const now = Date.now();
		if (cached && (!ttl || now - cached.timestamp < ttl)) {
			return cached.data as T;
		}
		const data = await fetcher();
		this.cache.set(key, { data, timestamp: now });
		return data;
	}

	peek<T>(key: string): T | undefined {
		const entry = this.cache.get(key);
		return entry ? (entry.data as T) : undefined;
	}

	set<T>(key: string, data: T): void {
		this.cache.set(key, { data, timestamp: Date.now() });
	}

	clear(key: string): void {
		this.cache.delete(key);
	}

	clearAll(): void {
		this.cache.clear();
	}

	has(key: string): boolean {
		return this.cache.has(key);
	}
}

export const spaCache = new SPACache();
