import { defineMDSveXConfig as defineConfig } from 'mdsvex';
import { createHighlighter } from 'shiki';
import { transformerNotationHighlight } from '@shikijs/transformers';
import remarkAvifRewrite from '../../../vite-plugins/remark-avif-rewrite.js';
import remarkGithubAlerts from '../../../vite-plugins/remark-github-alerts.js';
import remarkReadingTime from '../../../vite-plugins/remark-reading-time.js';
import remarkKatex from '../../../vite-plugins/remark-katex.js';
import rehypeExternalLinks from '../../../vite-plugins/rehype-external-links.js';

const shikiHighlighter = await createHighlighter({
	themes: ['github-dark', 'github-light'],
	langs: [
		'javascript', 'typescript', 'python', 'css', 'html', 'json',
		'bash', 'shell', 'yaml', 'markdown', 'svelte', 'rust', 'go',
		'java', 'c', 'cpp', 'sql', 'xml', 'toml', 'ini', 'diff',
		'ruby', 'php', 'swift', 'kotlin', 'dockerfile'
	]
});

const langAlias = { ts: 'typescript', js: 'javascript', sh: 'bash', md: 'markdown' };

function escapeHtml(str) {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeTemplate(str) {
	return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function codeBlockHtml(inner, lang, title) {
	const label = lang === 'text' ? 'plain text' : lang;
	const titleHtml = title
		? `<span class="code-file-name" title="${title.replace(/"/g, '&quot;')}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>${title}</span>`
		: '';
	const langHtml = `<span class="code-lang-label">${label}</span>`;
	// 有标题时：左侧文件名，右侧语言标签；无标题时：左侧语言标签
	const headerLeft = title ? `${titleHtml}${langHtml}` : langHtml;
	return `{@html \`<div class="not-prose code-block"><div class="code-block-header">${headerLeft}<button class="code-copy-btn" aria-label="复制代码" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('pre code').textContent).then(()=&gt;{this.classList.add('copied');setTimeout(()=&gt;{this.classList.remove('copied')},2000)}).catch(()=&gt;{})"><svg class="code-copy-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><svg class="code-check-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button></div>${inner}</div>\`}`;
}

const config = defineConfig({
	extensions: ['.md'],
	smartypants: { dashes: 'oldschool' },
	remarkPlugins: [remarkAvifRewrite, remarkGithubAlerts, remarkReadingTime, remarkKatex],
	rehypePlugins: [rehypeExternalLinks],
	highlight: {
		alias: langAlias,
		highlighter(code, lang) {
			let resolved = lang || 'text';
			let title = '';
			// 支持两种语法: `lang title` 和 `lang:title`
			if (resolved.includes(':')) {
				const [l, ...t] = resolved.split(':');
				resolved = l;
				title = t.join(':').trim();
			} else if (resolved.includes(' ')) {
				const parts = resolved.split(/\s+/);
				resolved = parts[0];
				title = parts.slice(1).join(' ');
			}
			resolved = langAlias[resolved] || resolved;

			try {
				const html = shikiHighlighter.codeToHtml(code, {
					lang: resolved,
					themes: { light: 'github-light', dark: 'github-dark' },
					defaultColor: false,
					transformers: [transformerNotationHighlight()]
				});
				return codeBlockHtml(escapeTemplate(html), resolved, title);
			} catch {
				return codeBlockHtml(escapeTemplate(`<pre data-language="${resolved}"><code class="language-${resolved}">${escapeHtml(code)}</code></pre>`), resolved, title);
			}
		}
	}
});

export default config;
