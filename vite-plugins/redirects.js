import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SITE_TITLE = "ZhiJing's Blog";

function generateRedirectHTML(destination) {
	return `<!DOCTYPE html>
<html lang="zh_CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="robots" content="noindex, nofollow">
	<meta http-equiv="refresh" content="3;url=${destination}">
	<title>跳转中... - ${SITE_TITLE}</title>
	<script>
		let c = 3;
		const t = setInterval(() => {
			if (--c <= 0) { clearInterval(t); location.href = "${destination}"; }
		}, 1000);
	<\/script>
	<style>
		:root{--bg:#fff;--fg:#0a0a0a;--muted:#f5f5f5;--muted-fg:#737373;--border:#e5e5e5;--primary:#171717;--primary-fg:#fafafa}
		@media(prefers-color-scheme:dark){:root{--bg:#0a0a0a;--fg:#fafafa;--muted:#262626;--muted-fg:#a3a3a3;--border:#262626;--primary:#fafafa;--primary-fg:#171717}}
		*{margin:0;padding:0;box-sizing:border-box}
		body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--fg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
		.card{max-width:28rem;width:100%;border:1px solid var(--border);border-radius:.75rem;padding:2rem;text-align:center}
		.icon{display:inline-flex;padding:1rem;border-radius:9999px;background:color-mix(in srgb,var(--primary) 10%,transparent);margin-bottom:1.5rem}
		.icon svg{width:3.5rem;height:3.5rem;color:var(--primary)}
		h1{font-size:1.5rem;font-weight:700;margin-bottom:.5rem}
		.desc{color:var(--muted-fg);margin-bottom:1.5rem}
		.url-box{background:var(--muted);border:1px solid var(--border);border-radius:.5rem;padding:.75rem;margin-bottom:1.5rem;word-break:break-all;text-align:left}
		.url-box small{color:var(--muted-fg);font-size:.75rem}
		.url-box code{font-size:.8rem;font-family:monospace}
		.spin{display:inline-flex;align-items:center;gap:.5rem;color:var(--muted-fg);font-size:.875rem;margin-bottom:1.5rem}
		.spinner{width:1rem;height:1rem;border:2px solid var(--muted-fg);border-top-color:transparent;border-radius:50%;animation:sp 1s linear infinite}
		@keyframes sp{to{transform:rotate(360deg)}}
		.btns{display:flex;flex-direction:column;gap:.5rem}
		a.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.5rem 1rem;border-radius:.375rem;font-size:.875rem;font-weight:500;text-decoration:none;transition:opacity .2s}
		a.primary{background:var(--primary);color:var(--primary-fg)}
		a.outline{border:1px solid var(--border);color:var(--fg)}
		a.btn:hover{opacity:.8}
	</style>
</head>
<body>
	<div class="card">
		<div class="icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16l4-4-4-4M8 12h8"/></svg>
		</div>
		<h1>正在跳转</h1>
		<p class="desc">${SITE_TITLE} 正在将您重定向至外部链接</p>
		<div class="url-box">
			<small>目标地址</small><br>
			<code>${destination}</code>
		</div>
		<div class="spin"><div class="spinner"></div><span>3 秒后自动跳转</span></div>
		<div class="btns">
			<a href="${destination}" class="btn primary">立即前往</a>
			<a href="/" class="btn outline">返回首页</a>
		</div>
	</div>
</body>
</html>`;
}

/**
 * 短链重定向 Vite 插件
 * @param {Record<string, string>} redirects 短链映射
 */
export default function redirectsPlugin(redirects) {
	return {
		name: 'vite-plugin-redirects',

		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				let path = req.url?.split('?')[0];
				if (path && path.endsWith('/') && path !== '/') path = path.slice(0, -1);

				if (path && path in redirects) {
					res.writeHead(302, { Location: redirects[path] });
					res.end();
					return;
				}
				next();
			});
		},

		closeBundle() {
			const outputDir = 'build';
			for (const [path, destination] of Object.entries(redirects)) {
				const outputPath = join(outputDir, path.slice(1));
				mkdirSync(outputPath, { recursive: true });
				writeFileSync(join(outputPath, 'index.html'), generateRedirectHTML(destination));
				console.log(`  ✓ redirect: ${path} → ${destination}`);
			}
		}
	};
}
