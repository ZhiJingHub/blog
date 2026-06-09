import { visit } from './ast-visit.js';

const ALLOWED_DOMAINS = ['iwexe.top', 'iwecc.dpdns.org', 'iwecc.qzz.io'];

function isInternal(host) {
	return ALLOWED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

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
						if (isInternal(new URL(href).hostname)) return;
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
