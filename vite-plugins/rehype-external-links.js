import { visit } from './ast-visit.js';
import { encodeBase64Url } from '../src/lib/utils/base64url.js';
import { isInternalDomain } from '../src/lib/utils/site-domains.js';

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
