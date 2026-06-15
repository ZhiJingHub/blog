import { SITE_DOMAINS } from '$lib/utils/site-domains';

export const siteConfig = {
	name: "ZhiJing's Blog",
	title: "ZhiJing's Blog",
	subtitle: "一个基于 SvelteKit 构建的现代博客",
	url: "https://iwexe.top",
	domains: SITE_DOMAINS,
	icon: "/favicon.svg",
	description: "Go with the flow.",
	keywords: ["blog", "sveltekit", "技术博客", "静态博客"],
	lang: "zh-CN",
	ogImage: "/og-image.svg",
	viewsApi: "", // Cloudflare Worker 浏览量 API 地址，如 "https://views.iwexe.top"，空则禁用
	analytics: {
		umami: {
			src: "https://u.iwexe.top/script.js",
			websiteId: "6e7ed14d-e59f-46ea-9bf4-efd7190d066c"
		}
	},
	author: {
		name: "致靖",
		url: "https://iwexe.top"
	},
	bio: {
		avatar: "/avatar.svg",
		name: "致靖",
		bio: "Go with the flow.",
		links: [
			{
				name: "GitHub",
				icon: "simple-icons:github",
				url: "https://github.com/ZhiJingHub",
				color: "#333333"
			},
			{
				name: "Telegram",
				icon: "simple-icons:telegram",
				url: "https://t.me/ZhiJing_PM_Bot",
				color: "#0088cc"
			},
			{
				name: "邮箱",
				icon: "mdi:email-outline",
				url: "mailto:me@iwexe.top"
			}
		]
	},
	// giscus 评论系统配置（预留，尚未启用）
	// 需要时填写 repoId 和 categoryId：https://giscus.app/
	giscus: {
		repo: "ZhiJingHub/blog",
		repoId: "",
		category: "Announcements",
		categoryId: ""
	},
	navLinks: [
		{ label: "博客", icon: "mdi:post-outline", href: "/posts" },
		{ label: "封面制作", icon: "mdi:image-edit", href: "/cover" },
		{ label: "隐藏图", icon: "mdi:layers-triple", href: "/ptg" },
		{ label: "格式转换", icon: "mdi:image-sync", href: "/convert" },
		{ label: "水印", icon: "mdi:watermark", href: "/watermark" },
		{ label: "友链", icon: "mdi:link-variant", href: "/friends" },
		{ label: "统计", icon: "mdi:chart-line", href: "https://u.iwexe.top/share/iAHxxL5xADM8Ll43" }
	] as const
};

export type SiteConfig = typeof siteConfig;
