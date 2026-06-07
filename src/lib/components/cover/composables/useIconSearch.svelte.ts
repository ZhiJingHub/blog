export function useIconSearch() {
	let searchQuery = $state('');
	let searchResults = $state<string[]>([]);
	let isSearching = $state(false);
	let searchDebounce: ReturnType<typeof setTimeout>;
	let searchAbort: AbortController | null = null;

	async function handleSearch() {
		if (!searchQuery) {
			searchResults = [];
			return;
		}
		if (searchAbort) searchAbort.abort();
		searchAbort = new AbortController();
		const gen = searchAbort;
		isSearching = true;
		try {
			const res = await fetch(
				`https://api.iconify.design/search?query=${encodeURIComponent(searchQuery)}&limit=20`,
				{ signal: gen.signal }
			);
			const data = await res.json();
			if (gen === searchAbort) searchResults = data.icons || [];
		} catch (e) {
			if ((e as Error).name !== 'AbortError' && gen === searchAbort) searchResults = [];
		} finally {
			if (gen === searchAbort) isSearching = false;
		}
	}

	function onSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchQuery = val;
		clearTimeout(searchDebounce);
		if (val.trim()) {
			searchDebounce = setTimeout(() => handleSearch(), 500);
		} else {
			searchResults = [];
		}
	}

	function dispose() {
		clearTimeout(searchDebounce);
	}

	return {
		get searchQuery() { return searchQuery; },
		get searchResults() { return searchResults; },
		get isSearching() { return isSearching; },
		onSearchInput,
		dispose
	};
}
