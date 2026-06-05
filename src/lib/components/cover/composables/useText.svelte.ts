export function useText() {
	let leftText = $state('');
	let rightText = $state('');
	let fontWeight = $state(400);
	let fontSize = $state(64);
	let gap = $state(20);
	let linkScale = $state(true);
	let lastFontSize = $state(64);
	let lastIconSize = $state(64);

	function handleFontSizeChange(value: number, iconSize: number): { fontSize: number; iconSize: number } {
		let newIconSize = iconSize;
		if (linkScale) {
			const ratio = value / lastFontSize;
			newIconSize = Math.round(iconSize * ratio);
			lastIconSize = newIconSize;
		}
		fontSize = value;
		lastFontSize = value;
		return { fontSize, iconSize: newIconSize };
	}

	function handleIconSizeChange(value: number, currentFontSize: number): { fontSize: number; iconSize: number } {
		let newFontSize = currentFontSize;
		if (linkScale) {
			const ratio = value / lastIconSize;
			newFontSize = Math.round(currentFontSize * ratio);
			lastFontSize = newFontSize;
		}
		fontSize = newFontSize;
		lastIconSize = value;
		return { fontSize: newFontSize, iconSize: value };
	}

	return {
		get leftText() { return leftText; },
		set leftText(v: string) { leftText = v; },
		get rightText() { return rightText; },
		set rightText(v: string) { rightText = v; },
		get fontWeight() { return fontWeight; },
		set fontWeight(v: number) { fontWeight = v; },
		get fontSize() { return fontSize; },
		set fontSize(v: number) { fontSize = v; },
		get gap() { return gap; },
		set gap(v: number) { gap = v; },
		get linkScale() { return linkScale; },
		set linkScale(v: boolean) { linkScale = v; },
		get lastFontSize() { return lastFontSize; },
		get lastIconSize() { return lastIconSize; },
		handleFontSizeChange,
		handleIconSizeChange
	};
}
