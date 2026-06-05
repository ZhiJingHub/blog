export function useIconSearch() {
	let searchQuery = $state('');
	let searchResults = $state<string[]>([]);
	let isSearching = $state(false);
	let searchDebounce: ReturnType<typeof setTimeout>;

	async function handleSearch() {
		if (!searchQuery) {
			searchResults = [];
			return;
		}
		isSearching = true;
		try {
			const res = await fetch(
				`https://api.iconify.design/search?query=${encodeURIComponent(searchQuery)}&limit=20`
			);
			const data = await res.json();
			searchResults = data.icons || [];
		} catch {
			searchResults = [];
		} finally {
			isSearching = false;
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
