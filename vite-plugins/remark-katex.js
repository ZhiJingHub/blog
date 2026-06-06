import katex from 'katex';

function renderFormula(formula, displayMode) {
	try {
		const html = katex.renderToString(formula, {
			displayMode,
			throwOnError: false,
			output: 'html',
			strict: false
		});
		const stripped = html.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '');
		const safe = stripped.replace(/\\/g, '&#92;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
		return { type: 'html', value: safe };
	} catch {
		return { type: 'text', value: formula };
	}
}

function processInlineChildren(children) {
	const out = [];
	for (const c of children) {
		if (c.type !== 'text') { out.push(c); continue; }
		let text = c.value;
		let last = 0;
		const parts = [];
		const re = /\$([^$\n]+?)\$/g;
		let m;
		while ((m = re.exec(text)) !== null) {
			if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
			const f = m[1].trim();
			if (f) parts.push(renderFormula(f, false));
			last = m.index + m[0].length;
		}
		if (parts.length > 0) {
			if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
			for (const p of parts) out.push(p);
		} else {
			out.push(c);
		}
	}
	return out;
}

function hasDollarDelim(node) {
	if (!node.children || node.children.length !== 1) return null;
	const c = node.children[0];
	if (c.type !== 'text') return null;
	if (c.value.trim() === '$$') return 'block';
	return null;
}

function getNodeText(node) {
	if (!node.children) return '';
	return node.children.filter((c) => c.type === 'text').map((c) => c.value).join('');
}

export default function remarkKatex() {
	return (tree) => {
		const newChildren = [];
		let i = 0;

		while (i < tree.children.length) {
			const node = tree.children[i];

			if (node.type === 'paragraph' && node.children) {
				const text = node.children.filter((c) => c.type === 'text').map((c) => c.value).join('');
				if (/^\$\$[\s\S]*\$\$$/.test(text.trim())) {
					const inner = text.trim().replace(/^\$\$/, '').replace(/\$\$$/, '').trim();
					if (inner) {
						const rendered = renderFormula(inner, true);
						rendered.data = { hName: 'div', hProperties: { className: ['katex-block'] } };
						newChildren.push(rendered);
						i++;
						continue;
					}
				}
			}

			if (hasDollarDelim(node) === 'block') {
				const lines = [];
				let j = i + 1;
				let closed = false;
				while (j < tree.children.length) {
					const next = tree.children[j];
					if (hasDollarDelim(next) === 'block') { closed = true; break; }
					if (next.type === 'paragraph') lines.push(getNodeText(next));
					j++;
				}
				if (closed && lines.length > 0) {
					const formula = lines.join('\n').trim();
					if (formula) {
						const rendered = renderFormula(formula, true);
						rendered.data = { hName: 'div', hProperties: { className: ['katex-block'] } };
						newChildren.push(rendered);
					}
					i = j + 1;
					continue;
				}
			}

			if ((node.type === 'paragraph' || node.type === 'heading') && node.children) {
				node.children = processInlineChildren(node.children);
			}

			newChildren.push(node);
			i++;
		}

		tree.children = newChildren;
	};
}
