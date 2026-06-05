export function useFontManager() {
	let customFont = $state<string | null>(null);
	let customFontName = $state('');
	let fontFile: File | null = null;

	function getFontDataBase64(): Promise<string | null> {
		if (!fontFile) return Promise.resolve(null);
		const file = fontFile;
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => resolve(null);
			reader.readAsDataURL(file);
		});
	}

	function handleFontUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (customFont) URL.revokeObjectURL(customFont);
		customFontName = file.name.replace(/\.[^/.]+$/, '');
		customFont = URL.createObjectURL(file);
		fontFile = file;
		const fontFace = new FontFace(customFontName, `url(${customFont})`);
		fontFace.load().then((loadedFace) => {
			document.fonts.add(loadedFace);
		}).catch((e) => {
			console.warn('[FontManager] Failed to load font:', e);
		});
	}

	function handleSystemFontSelect(fontName: string) {
		customFontName = fontName;
		customFont = null;
		fontFile = null;
	}

	function removeFont() {
		if (customFont) URL.revokeObjectURL(customFont);
		customFont = null;
		customFontName = '';
		fontFile = null;
	}

	function dispose() {
		if (customFont) URL.revokeObjectURL(customFont);
	}

	return {
		get customFont() { return customFont; },
		get customFontName() { return customFontName; },
		getFontDataBase64,
		handleFontUpload,
		handleSystemFontSelect,
		removeFont,
		dispose
	};
}
