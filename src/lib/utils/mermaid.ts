const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.min.js';

interface MermaidLike {
	initialize(opts: Record<string, unknown>): void;
	render(id: string, text: string): Promise<{ svg: string }>;
}
declare global {
	interface Window {
		mermaid?: MermaidLike;
	}
}

let mermaidPromise: Promise<MermaidLike> | null = null;
let initialized = false;
let lastTheme: 'dark' | 'default' | null = null;
const renderedBlocks = new Map<HTMLElement, string>();
let renderDone: Promise<void> = Promise.resolve();
let renderDoneResolve: (() => void) | null = null;

function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.querySelector(`script[data-mermaid-src="${src}"]`)) { resolve(); return; }
		const s = document.createElement('script');
		s.src = src;
		s.async = true;
		s.setAttribute('data-mermaid-src', src);
		s.onload = () => resolve();
		s.onerror = (e) => reject(e);
		document.head.appendChild(s);
	});
}

async function getMermaid(): Promise<MermaidLike> {
	if (window.mermaid) return window.mermaid;
	if (!mermaidPromise) {
		mermaidPromise = loadScript(MERMAID_CDN).then(() => {
			if (!window.mermaid) throw new Error('window.mermaid not present after script load');
			return window.mermaid;
		});
	}
	return mermaidPromise;
}

function decodeText(pre: HTMLElement): string {
	const lines = pre.querySelectorAll('span[data-line]');
	if (lines.length === 0) return (pre.textContent ?? '').trim();
	return Array.from(lines).map((l) => (l.textContent ?? '').replace(/ /g, ' ')).join('\n').trim();
}

export async function renderMermaidIn(container: HTMLElement | null | undefined) {
	if (!container) return;
	renderedBlocks.clear();
	renderDoneResolve?.();
	let resolveRender: () => void;
	renderDone = new Promise<void>((r) => { resolveRender = r; });
	renderDoneResolve = resolveRender!;

	const candidates = new Set<HTMLElement>();
	for (const el of Array.from(container.querySelectorAll<HTMLElement>('pre[data-language="mermaid"]'))) candidates.add(el);
	for (const code of Array.from(container.querySelectorAll<HTMLElement>('code.language-mermaid, code[class*="language-mermaid"]'))) {
		const pre = code.closest('pre') as HTMLElement | null;
		if (pre) candidates.add(pre);
	}
	if (candidates.size === 0) { renderDoneResolve?.(); return; }

	const mermaid = await getMermaid();
	const isDark = document.documentElement.classList.contains('dark');
	const currentTheme = isDark ? 'dark' : 'default';
	if (!initialized || currentTheme !== lastTheme) {
		lastTheme = currentTheme;
		mermaid.initialize({ startOnLoad: false, theme: lastTheme, securityLevel: 'strict', fontFamily: 'inherit' });
		initialized = true;
	}

	let i = 0;
	for (const pre of candidates) {
		const code = decodeText(pre);
		if (!code) continue;
		const id = `mermaid-${Date.now()}-${i++}`;
		try {
			const { svg } = await mermaid.render(id, code);
			const wrapper = document.createElement('div');
			wrapper.className = 'mermaid-rendered flex justify-center my-4 not-prose';
			wrapper.innerHTML = svg;
			renderedBlocks.set(wrapper, code);
			pre.replaceWith(wrapper);
		} catch (err) {
			console.error('[mermaid] render failed:', err);
		}
	}
	renderDoneResolve?.();
}

export async function rerenderAllMermaid() {
	await renderDone;
	const mermaid = await getMermaid();
	const isDark = document.documentElement.classList.contains('dark');
	const newTheme = isDark ? 'dark' : 'default';
	if (newTheme === lastTheme) return;
	lastTheme = newTheme;
	mermaid.initialize({ startOnLoad: false, theme: newTheme, securityLevel: 'strict', fontFamily: 'inherit' });
	let i = 0;
	for (const [wrapper, code] of renderedBlocks) {
		const id = `mermaid-rerender-${Date.now()}-${i++}`;
		try {
			const { svg } = await mermaid.render(id, code);
			wrapper.innerHTML = svg;
		} catch (err) {
			console.error('[mermaid] re-render failed:', err);
		}
	}
}
