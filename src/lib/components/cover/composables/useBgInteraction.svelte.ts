export function useBgInteraction() {
	let bgImage = $state<string | null>(null);
	let bgImageX = $state(0);
	let bgImageY = $state(0);
	let bgImageScale = $state(1);
	let bgBlur = $state(0);
	let bgOpacity = $state(1);
	let isBgDragOver = $state(false);
	let isDragging = $state(false);

	let dragStartX = 0;
	let dragStartY = 0;
	let initialImageX = 0;
	let initialImageY = 0;
	const activePointers = new Map<number, { x: number; y: number }>();
	let initialPinchDistance = 0;
	let initialScale = 1;

	function loadBgImageFile(file: File) {
		if (!file.type.startsWith('image/')) return;
		if (bgImage?.startsWith('blob:')) URL.revokeObjectURL(bgImage);
		const url = URL.createObjectURL(file);
		bgImage = url;
		bgImageX = 0;
		bgImageY = 0;
		bgImageScale = 1;
		bgBlur = 0;
		bgOpacity = 1;
	}

	function handleBgImageUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) loadBgImageFile(file);
	}

	function handleBgDragOver(e: DragEvent) {
		e.preventDefault();
		isBgDragOver = true;
	}

	function handleBgDragLeave(e: DragEvent) {
		e.preventDefault();
		isBgDragOver = false;
	}

	function handleBgDrop(e: DragEvent) {
		e.preventDefault();
		isBgDragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) loadBgImageFile(file);
	}

	function handlePointerDown(e: PointerEvent) {
		if (!bgImage) return;
		e.preventDefault();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (activePointers.size === 1) {
			isDragging = true;
			dragStartX = e.clientX;
			dragStartY = e.clientY;
			initialImageX = bgImageX;
			initialImageY = bgImageY;
		} else if (activePointers.size === 2) {
			isDragging = false;
			const points = Array.from(activePointers.values());
			initialPinchDistance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
			initialScale = bgImageScale;
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!bgImage || !activePointers.has(e.pointerId)) return;
		e.preventDefault();
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (activePointers.size === 2) {
			const points = Array.from(activePointers.values());
			const currentDistance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
			if (initialPinchDistance > 0) {
				const scaleFactor = currentDistance / initialPinchDistance;
				bgImageScale = Math.max(0.1, Math.min(initialScale * scaleFactor, 10));
			}
		} else if (activePointers.size === 1 && isDragging) {
			const deltaX = e.clientX - dragStartX;
			const deltaY = e.clientY - dragStartY;
			bgImageX = initialImageX + deltaX / bgImageScale;
			bgImageY = initialImageY + deltaY / bgImageScale;
		}
	}

	function handlePointerUp(e: PointerEvent) {
		activePointers.delete(e.pointerId);
		(e.currentTarget as Element).releasePointerCapture(e.pointerId);
		if (activePointers.size < 2) initialPinchDistance = 0;
		if (activePointers.size === 0) isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		if (!bgImage) return;
		e.preventDefault();
		const scaleFactor = 1.1;
		if (e.deltaY < 0) {
			bgImageScale = Math.min(bgImageScale * scaleFactor, 10);
		} else {
			bgImageScale = Math.max(bgImageScale / scaleFactor, 0.1);
		}
	}

	function dispose() {
		if (bgImage?.startsWith('blob:')) URL.revokeObjectURL(bgImage);
	}

	return {
		get bgImage() { return bgImage; },
		set bgImage(v: string | null) {
			if (bgImage?.startsWith('blob:')) URL.revokeObjectURL(bgImage);
			bgImage = v;
		},
		get bgImageX() { return bgImageX; },
		get bgImageY() { return bgImageY; },
		get bgImageScale() { return bgImageScale; },
		get bgBlur() { return bgBlur; },
		set bgBlur(v: number) { bgBlur = v; },
		get bgOpacity() { return bgOpacity; },
		set bgOpacity(v: number) { bgOpacity = v; },
		get isBgDragOver() { return isBgDragOver; },
		get isDragging() { return isDragging; },
		handleBgImageUpload,
		handleBgDragOver,
		handleBgDragLeave,
		handleBgDrop,
		handlePointerDown,
		handlePointerMove,
		handlePointerUp,
		handleWheel,
		dispose
	};
}
