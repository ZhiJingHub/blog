export function useColor() {
	let color = $state('#000000');
	let bgColor = $state('#ffffff');
	let bgColorOpacity = $state(1);
	let linkColor = $state(true);

	function handleColorChange(newColor: string, type: 'text' | 'icon'): { color: string; iconColor: string } {
		if (type === 'text') {
			color = newColor;
			return { color, iconColor: linkColor ? newColor : '' };
		} else {
			return { color: linkColor ? newColor : '', iconColor: newColor };
		}
	}

	return {
		get color() { return color; },
		set color(v: string) { color = v; },
		get bgColor() { return bgColor; },
		set bgColor(v: string) { bgColor = v; },
		get bgColorOpacity() { return bgColorOpacity; },
		set bgColorOpacity(v: number) { bgColorOpacity = v; },
		get linkColor() { return linkColor; },
		set linkColor(v: boolean) { linkColor = v; },
		handleColorChange
	};
}
