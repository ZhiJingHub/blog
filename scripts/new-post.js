#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const POSTS_DIR = path.resolve('src/content/posts');

function slugify(text) {
	return text
		.toLowerCase()
		.replace(/[^\w一-鿿㐀-䶿]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

function getToday() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ask(rl, question) {
	return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

async function main() {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	console.log('\n📝 创建新文章\n');

	const title = await ask(rl, '文章标题: ');
	if (!title) {
		console.log('❌ 标题不能为空');
		rl.close();
		return;
	}

	const defaultSlug = slugify(title);
	const slug = (await ask(rl, `URL slug (${defaultSlug}): `)) || defaultSlug;

	const description = await ask(rl, '文章描述: ');
	const tagsInput = await ask(rl, '标签（逗号分隔，可留空）: ');
	const tags = tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [];
	const pinned = (await ask(rl, '是否置顶？(y/N): ')).toLowerCase() === 'y';

	const dir = path.join(POSTS_DIR, slug);
	if (fs.existsSync(dir)) {
		console.log(`\n❌ 目录已存在: ${dir}`);
		rl.close();
		return;
	}

	fs.mkdirSync(dir, { recursive: true });

	function yamlEscape(str) {
		return str.replace(/'/g, "''");
	}

	const frontmatter = [
		'---',
		`title: '${yamlEscape(title)}'`,
		`published: '${getToday()}'`,
		description ? `description: '${yamlEscape(description)}'` : "description: ''",
		pinned ? 'pinned: true' : '',
		tags.length > 0 ? `tags: [${tags.map((t) => `'${yamlEscape(t)}'`).join(', ')}]` : '',
		'---',
		'',
		`# ${title}`,
		'',
		'在这里开始写作...',
		''
	].filter(Boolean).join('\n');

	fs.writeFileSync(path.join(dir, 'index.md'), frontmatter, 'utf-8');

	console.log(`\n✅ 文章已创建`);
	console.log(`   📁 ${dir}/index.md`);
	console.log(`   🔗 /posts/${slug}/\n`);

	rl.close();
}

main();
