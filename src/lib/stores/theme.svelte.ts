import { browser } from '$app/environment';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function getStored(): ThemeMode {
	if (!browser) return 'system';
	const v = localStorage.getItem(STORAGE_KEY);
	if (v === 'light' || v === 'dark' || v === 'system') return v;
	return 'system';
}

function getSystemDark(): boolean {
	if (!browser) return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

let mode = $state<ThemeMode>(getStored());
let systemDark = $state(getSystemDark());

export const themeStore = {
	get mode() {
		return mode;
	},
	get isDark() {
		if (mode === 'system') return systemDark;
		return mode === 'dark';
	},
	set(newMode: ThemeMode) {
		mode = newMode;
	},
	cycle() {
		const modes: ThemeMode[] = ['light', 'dark', 'system'];
		const idx = modes.indexOf(mode);
		mode = modes[(idx + 1) % modes.length];
	}
};

function applyTheme(dark: boolean) {
	if (!browser) return;
	const el = document.documentElement;
	el.classList.toggle('dark', dark);
	el.setAttribute('data-theme', dark ? 'dark' : 'light');
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', dark ? '#0a0a0a' : '#ffffff');
}

if (browser) {
	$effect.root(() => {
		$effect(() => {
			applyTheme(themeStore.isDark);
		});

		$effect(() => {
			localStorage.setItem(STORAGE_KEY, themeStore.mode);
		});

		return () => {};
	});

	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	mq.addEventListener('change', (e) => {
		systemDark = e.matches;
	});

	applyTheme(themeStore.isDark);
}
