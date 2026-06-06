import { visit } from './ast-visit.js';

/**
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
	const cjk = text.match(/[一-鿿㐀-䶿豈-﫿]/g) || [];
	const kana = text.match(/[぀-ゟ゠-ヿ]/g) || [];
	const hangul = text.match(/[가-힯ᄀ-ᇿ㄰-㆏]/g) || [];
	const words = text.match(/[a-zA-Z0-9À-ɏЀ-ӿ]+(?:['’\-][a-zA-Z0-9À-ɏЀ-ӿ]+)*/g) || [];
	return cjk.length + kana.length + hangul.length + words.length;
}

/**
 * @returns {(tree: import('mdast').Root, file: import('vfile').VFile) => void}
 */
export default function remarkReadingTime() {
	return function (tree, file) {
		let textContent = '';
		let imageCount = 0;

		visit(tree, 'text', (node) => {
			textContent += /** @type {import('mdast').Text} */ (node).value + ' ';
		});

		visit(tree, 'inlineCode', (node) => {
			textContent += /** @type {import('mdast').InlineCode} */ (node).value + ' ';
		});

		visit(tree, 'code', (node) => {
			textContent += /** @type {import('mdast').Code} */ (node).value + ' ';
		});

		visit(tree, 'image', () => {
			imageCount++;
		});

		visit(tree, 'html', (node) => {
			const html = /** @type {import('mdast').Html} */ (node);
			if (html.value && /<img\s+[^>]*src=/i.test(html.value)) {
				imageCount += (html.value.match(/<img\s+[^>]*src=/gi) || []).length;
			}
		});

		const wordCount = countWords(textContent);
		const WORDS_PER_MINUTE = 300;
		const readTime = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

		const fm = /** @type {any} */ (file.data).fm || {};
		fm.stats = { wordCount, readTime, imageCount };
		/** @type {any} */ (file.data).fm = fm;
	};
}
