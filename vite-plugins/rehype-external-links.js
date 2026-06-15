import { visit } from './ast-visit.js';

const SITE_DOMAINS = ['iwexe.top', 'iwecc.dpdns.org', 'iwecc.qzz.io'];

function isInternalDomain(hostname) {
	return SITE_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

function encodeBase64Url(str) {
	let binary;
	if (typeof Buffer !== 'undefined') {
		binary = Buffer.from(str, 'utf-8').toString('base64');
	} else {
		const bytes = new TextEncoder().encode(str);
		let bin = '';
		for (const b of bytes) bin += String.fromCharCode(b);
		binary = btoa(bin);
	}
	return binary.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function rehypeExternalLinks() {
	return (tree) => {
		visit(tree, 'element', (node) => {
			if (node.tagName === 'a' && node.properties && node.properties.href) {
				const href = node.properties.href;

				if (/^https?:\/\//i.test(href)) {
					try {
						if (isInternalDomain(new URL(href).hostname)) return;
					} catch {
						return;
					}

					node.properties.target = '_blank';
					node.properties.rel = 'noopener noreferrer';
					node.properties.href = `/go/${encodeBase64Url(href)}/`;
				}
			}
		});
	};
}
