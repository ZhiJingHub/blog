<script lang="ts">
	import { encodeUrl } from '$lib/utils/redirect';
	import { siteConfig } from '$lib/config/site';

	const allowedDomains = siteConfig.domains;

	function isInternal(host: string): boolean {
		return allowedDomains.some((d) => host === d || host.endsWith(`.${d}`));
	}

	$effect(() => {
		function handleClick(e: MouseEvent) {
			const anchor = (e.target as HTMLElement).closest('a');
			if (!anchor) return;

			const href = anchor.href;
			if (!href || !/^https?:\/\//i.test(href)) return;

			// 站内链接跳过
			try {
				if (isInternal(new URL(href).hostname)) return;
			} catch {
				return;
			}

			// 已经在 /go/ 路径上的跳过（防止重定向页死循环）
			if (anchor.pathname.startsWith('/go/') || window.location.pathname.startsWith('/go/')) return;

			// 用户明确排除的链接跳过
			if (anchor.hasAttribute('data-no-redirect')) return;

			e.preventDefault();
			window.location.href = `/go/${encodeUrl(href)}/`;
		}

		document.addEventListener('click', handleClick, true);
		return () => document.removeEventListener('click', handleClick, true);
	});
</script>
