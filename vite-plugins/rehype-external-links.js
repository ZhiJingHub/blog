import { visit } from './ast-visit.js';

const SITE_HOST = 'iwexe.top';

function toBase64Url(str) {
	const encoded = typeof Buffer !== 'undefined'
		? Buffer.from(str, 'utf-8').toString('base64')
		: btoa(unescape(encodeURIComponent(str)));
	return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function rehypeExternalLinks() {
	return (tree) => {
		visit(tree, 'element', (node) => {
			if (node.tagName === 'a' && node.properties && node.properties.href) {
				const href = node.properties.href;

				if (/^https?:\/\//i.test(href)) {
					try {
						if (new URL(href).hostname.includes(SITE_HOST)) return;
					} catch {
						return;
					}

					node.properties.target = '_blank';
					node.properties.rel = 'noopener noreferrer';
					node.properties.href = `/go/${toBase64Url(href)}/`;
				}
			}
		});
	};
}
