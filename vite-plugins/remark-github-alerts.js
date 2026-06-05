import { ALERT_REGEX, buildAlertTitleHtml } from './github-alerts-shared.js';
import { visit } from './ast-visit.js';

function detectAlertType(paragraph) {
	const first = paragraph.children?.[0];
	if (!first) return null;
	if (first.type === 'text') {
		const m = first.value.match(ALERT_REGEX);
		return m ? { type: m[1].toLowerCase(), via: 'text' } : null;
	}
	if (first.type === 'linkReference' && first.referenceType === 'shortcut') {
		const label = first.label || first.identifier || '';
		const m = label.match(/^!(NOTE|TIP|INFO|IMPORTANT|WARNING|CAUTION)$/i);
		return m ? { type: m[1].toLowerCase() } : null;
	}
	return null;
}

function stripAlertPrefix(paragraph, detected) {
	if (detected.via === 'text') {
		const firstChild = paragraph.children[0];
		const m = firstChild.value.match(ALERT_REGEX);
		firstChild.value = firstChild.value.slice(m[0].length);
		if (!firstChild.value) paragraph.children.shift();
	} else {
		paragraph.children.shift();
	}
	while (
		paragraph.children.length &&
		((paragraph.children[0].type === 'text' && (!paragraph.children[0].value || /^[ \t]*\r?\n/.test(paragraph.children[0].value))) || paragraph.children[0].type === 'break')
	) {
		const c = paragraph.children[0];
		if (c.type === 'text') {
			c.value = c.value.replace(/^[ \t]*\r?\n/, '');
			if (c.value) break;
		}
		paragraph.children.shift();
	}
}

export default function remarkGithubAlerts() {
	return (tree) => {
		visit(tree, 'blockquote', (node) => {
			const firstPara = node.children?.[0];
			if (!firstPara || firstPara.type !== 'paragraph') return;
			const detected = detectAlertType(firstPara);
			if (!detected) return;
			const { type } = detected;
			stripAlertPrefix(firstPara, detected);
			if (firstPara.children.length === 0) node.children.shift();
			node.type = 'paragraph';
			node.children = [{ type: 'html', value: buildAlertTitleHtml(type) }, ...node.children];
			node.data = node.data || {};
			node.data.hName = 'div';
			node.data.hProperties = { className: ['markdown-alert', `markdown-alert-${type}`] };
		});
	};
}
