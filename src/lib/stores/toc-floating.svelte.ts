import { browser } from '$app/environment';

let open = $state(false);
let available = $state(false);

export const tocFloating = {
	get open() {
		return open;
	},
	get available() {
		return available;
	},
	toggle: () => {
		if (!browser) return;
		open = !open;
	},
	setOpen: (v: boolean) => {
		if (!browser) return;
		open = v;
	},
	setAvailable: (v: boolean) => {
		if (!browser) return;
		available = v;
	},
	reset: () => {
		open = false;
		available = false;
	}
};
