import { visit } from './ast-visit.js';

const CONVERTIBLE_RE = /\.(png|jpe?g|webp)(?=$|[?#])/i;

/**
 * @param {unknown} url
 * @returns {unknown}
 */
function rewriteUrl(url) {
	if (typeof url !== 'string') return url;
	if (/^(https?:)?\/\//i.test(url)) return url;
	if (!CONVERTIBLE_RE.test(url)) return url;
	return url.replace(CONVERTIBLE_RE, '.avif');
}

/**
 * @returns {(tree: import('mdast').Root, file: import('vfile').VFile) => void}
 */
export default function remarkAvifRewrite() {
	return (tree, file) => {
		if (process.env.NODE_ENV !== 'production') return;

		visit(tree, 'image', (node) => {
			const img = /** @type {import('mdast').Image} */ (node);
			img.url = /** @type {string} */ (rewriteUrl(img.url));
		});

		visit(tree, 'html', (node) => {
			const html = /** @type {import('mdast').Html} */ (node);
			if (typeof html.value !== 'string') return;
			html.value = html.value
				.replace(
					/(<img[^>]+src=["'])([^"']+)(["'])/gi,
					(_, p1, src, p3) => p1 + rewriteUrl(src) + p3
				)
				.replace(
					/(<source[^>]+srcset=["'])([^"']+)(["'])/gi,
					(_, p1, src, p3) => p1 + rewriteUrl(src) + p3
				);
		});

		const fm = /** @type {any} */ (file.data).fm;
		if (fm && typeof fm.image === 'string') {
			fm.image = rewriteUrl(fm.image);
		}
	};
}
