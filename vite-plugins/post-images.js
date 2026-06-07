import fs from 'fs';
import path from 'path';

/**
 * 路径安全检查：确保 targetPath 解析后严格位于 basePath 目录内。
 * 使用 path.sep 作为后缀防止前缀相似目录绕过（如 /posts vs /posts_secret）。
 * @param {string} basePath
 * @param {string} targetPath
 * @returns {boolean}
 */
function isPathSafe(basePath, targetPath) {
	const normalizedBase = path.resolve(basePath) + path.sep;
	const resolved = path.resolve(basePath, targetPath);
	return resolved.startsWith(normalizedBase);
}

/**
 * @returns {import('vite').Plugin}
 */
export function postImagesPlugin() {
	return {
		name: 'post-images',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/posts', (req, res, next) => {
				const urlPath = decodeURIComponent((req.url ?? '').split('?')[0].split('#')[0]);
				const match = urlPath.match(/^\/([^\/]+)\/img\/(.+)$/);
				if (match) {
					const [, slug, filename] = match;
					const postsBase = path.join(process.cwd(), 'src/content/posts');

					if (!isPathSafe(postsBase, path.join(slug, 'img', filename))) {
						res.statusCode = 403;
						res.end('Forbidden');
						return;
					}

					const imagePath = path.join(postsBase, slug, 'img', filename);

					if (fs.existsSync(imagePath)) {
						const stat = fs.statSync(imagePath);
						const ext = path.extname(filename).toLowerCase();

						/** @type {Record<string, string>} */
						const mimeTypes = {
							'.webp': 'image/webp',
							'.png': 'image/png',
							'.jpg': 'image/jpeg',
							'.jpeg': 'image/jpeg',
							'.gif': 'image/gif',
							'.svg': 'image/svg+xml',
							'.avif': 'image/avif'
						};

						res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
						res.setHeader('Content-Length', stat.size);

						const stream = fs.createReadStream(imagePath);
						stream.on('error', (err) => {
							console.error(`[post-images] stream error: ${err.message}`);
							if (!res.headersSent) res.statusCode = 500;
							res.end();
						});
						stream.pipe(res);
						return;
					}
				}

				next();
			});
		}
	};
}
