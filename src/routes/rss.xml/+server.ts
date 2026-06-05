import { getAllPosts } from '$lib/utils/posts';
import { siteConfig } from '$lib/config/site';

export const prerender = true;

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function GET() {
	const posts = getAllPosts();

	const items = posts
		.map(
			(post) => `    <item>
      <title>${escapeXml(post.metadata.title)}</title>
      <link>${siteConfig.url}/posts/${post.slug}/</link>
      <description>${escapeXml(post.metadata.description)}</description>
      <pubDate>${new Date(post.metadata.published).toUTCString()}</pubDate>
      <guid>${siteConfig.url}/posts/${post.slug}/</guid>
    </item>`
		)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>zh-CN</language>
    <atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

	return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
