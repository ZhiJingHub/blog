export interface ShadowConfig {
	x: number;
	y: number;
	blur: number;
	color: string;
	alpha: number;
}

export type ShadowTarget = 'both' | 'text' | 'icon';

const DEFAULT_SHADOW: ShadowConfig = { x: 0, y: 0, blur: 0, color: '#000000', alpha: 0 };

export function useShadow() {
	let textShadow = $state<ShadowConfig>({ ...DEFAULT_SHADOW });
	let iconShadow = $state<ShadowConfig>({ ...DEFAULT_SHADOW });
	let shadowTarget = $state<ShadowTarget>('both');

	function updateShadow(key: string, value: string | number) {
		if (shadowTarget === 'both' || shadowTarget === 'text') {
			textShadow = { ...textShadow, [key]: value };
		}
		if (shadowTarget === 'both' || shadowTarget === 'icon') {
			iconShadow = { ...iconShadow, [key]: value };
		}
	}

	return {
		get textShadow() { return textShadow; },
		get iconShadow() { return iconShadow; },
		get shadowTarget() { return shadowTarget; },
		set shadowTarget(v: ShadowTarget) { shadowTarget = v; },
		updateShadow
	};
}
