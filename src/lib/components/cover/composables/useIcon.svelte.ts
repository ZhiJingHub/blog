export function useIcon() {
	let iconName = $state('');
	let iconSize = $state(64);
	let iconSvg = $state('');
	let localIcon = $state<string | null>(null);
	let showIcon = $state(false);
	let iconColor = $state('#000000');
	let useOriginalIconColor = $state(true);
	let iconRadius = $state(0);

	let iconFetchController: AbortController | null = null;

	$effect(() => {
		const currentIconName = iconName;
		const currentUseOriginal = useOriginalIconColor;

		if (currentIconName?.includes(':')) {
			if (iconFetchController) iconFetchController.abort();
			iconFetchController = new AbortController();

			const [prefix, name] = currentIconName.split(':');
			fetch(`https://api.iconify.design/${prefix}/${name}.svg`, {
				signal: iconFetchController.signal
			})
				.then((res) => {
					if (!res.ok) throw new Error('Icon not found');
					return res.text();
				})
				.then((svg) => {
					let processedSvg = svg
						.replace(/(<svg[^>]*>)\s*/, '$1')
						.replace(/<svg\s([^>]*?)\s+width="[^"]*"/g, '<svg $1')
						.replace(/<svg\s([^>]*?)\s+height="[^"]*"/g, '<svg $1');
					processedSvg = processedSvg.replace(
						/<svg\b([^>]*)>/,
						'<svg$1 width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'
					);
					if (!currentUseOriginal) {
						processedSvg = processedSvg.replace(/fill="[^"]*"/g, 'fill="currentColor"');
					}
					iconSvg = processedSvg;
				})
				.catch((e) => {
					if (e.name !== 'AbortError') iconSvg = '';
				});
		} else {
			iconSvg = '';
		}

		return () => {
			if (iconFetchController) iconFetchController.abort();
		};
	});

	function handleLocalIconUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (localIcon?.startsWith('blob:')) URL.revokeObjectURL(localIcon);
		const url = URL.createObjectURL(file);
		localIcon = url;
		iconName = '本地图片';
		iconSvg = '';
	}

	function selectIcon(icon: string) {
		iconName = icon;
		localIcon = null;
	}

	function dispose() {
		if (iconFetchController) iconFetchController.abort();
		if (localIcon?.startsWith('blob:')) URL.revokeObjectURL(localIcon);
	}

	return {
		get iconName() { return iconName; },
		set iconName(v: string) { iconName = v; },
		get iconSize() { return iconSize; },
		set iconSize(v: number) { iconSize = v; },
		get iconSvg() { return iconSvg; },
		get localIcon() { return localIcon; },
		set localIcon(v: string | null) { localIcon = v; },
		get showIcon() { return showIcon; },
		set showIcon(v: boolean) { showIcon = v; },
		get iconColor() { return iconColor; },
		set iconColor(v: string) { iconColor = v; },
		get useOriginalIconColor() { return useOriginalIconColor; },
		set useOriginalIconColor(v: boolean) { useOriginalIconColor = v; },
		get iconRadius() { return iconRadius; },
		set iconRadius(v: number) { iconRadius = v; },
		handleLocalIconUpload,
		selectIcon,
		dispose
	};
}
