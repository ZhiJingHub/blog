<script lang="ts">
	import { encodeUrl } from '$lib/utils/redirect';
	import { siteConfig } from '$lib/config/site';

	const siteHost = new URL(siteConfig.url).hostname;

	$effect(() => {
		function handleClick(e: MouseEvent) {
			const anchor = (e.target as HTMLElement).closest('a');
			if (!anchor) return;

			const href = anchor.href;
			if (!href || !/^https?:\/\//i.test(href)) return;

			// 站内链接跳过（精确匹配 iwexe.top 及 *.iwexe.top）
			try {
				const host = new URL(href).hostname;
				if (host === siteHost || host.endsWith(`.${siteHost}`)) return;
			} catch {
				return;
			}

			// 已经在 /go/ 路径上的跳过
			if (anchor.pathname.startsWith('/go/')) return;

			// 用户明确排除的链接跳过
			if (anchor.hasAttribute('data-no-redirect')) return;

			e.preventDefault();
			window.location.href = `/go/${encodeUrl(href)}/`;
		}

		document.addEventListener('click', handleClick, true);
		return () => document.removeEventListener('click', handleClick, true);
	});
</script>
