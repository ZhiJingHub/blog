# Blog

基于 SvelteKit 2 + Svelte 5 构建的现代博客系统，集成封面制作、隐藏图生成、友链管理等工具。支持 5 种部署平台。

## 功能

### 博客系统

- Markdown 写作（mdsvex），支持 Svelte 组件嵌入
- Shiki 双主题语法高亮（github-light/dark），行号、一键复制
- GitHub 风格提示块（NOTE/TIP/WARNING/CAUTION）
- Mermaid 图表渲染（CDN 按需加载）
- 文章目录导航（桌面固定 + 移动端抽屉）
- 图片灯箱（PhotoSwipe）
- 前端搜索（title/description/tags）
- 置顶文章、草稿模式、标签系统
- RSS / Sitemap / robots.txt 自动生成

### 封面制作 — `/cover/`

自定义文本/图标/背景/颜色/阴影，导出 PNG/SVG，支持多比例多倍率。

### 隐藏图 — `/ptg/`

光棱坦克（棋盘格交错）和幻影坦克（透明度合成），浏览器本地处理。

### 友链 — `/friends/`

JSON 文件驱动，自动排序，分页展示。

### 页面浏览量

所有页面自动统计浏览次数，数据存储在 Cloudflare KV。博客列表页显示文章总数、总字数、总图片数。

### 主题系统

亮色 / 暗色 / 跟随系统，localStorage 持久化。

### 图片优化

构建时自动将 PNG/JPG/WebP 转为 AVIF（quality 50），带 `.image-cache/` 缓存。

---

## 初始化配置

克隆项目后，**必须修改以下文件**才能正常使用：

### 1. 站点信息 — `src/lib/config/site.ts`

```ts
export const siteConfig = {
  name: "你的博客名",           // 站点简称
  title: "你的博客名",          // 页签标题
  subtitle: "你的副标题",       // 首页副标题
  url: "https://你的域名.com",  // 站点 URL（不含尾部斜杠）
  description: "站点描述",      // SEO 描述
  keywords: ["关键词1", "关键词2"],
  ogImage: "/og-image.svg",    // OG 分享图

  // Umami 统计（可选，不需要可删除 analytics 整块）
  analytics: {
    umami: {
      src: "https://你的umami地址/script.js",
      websiteId: "你的网站ID"
    }
  },

  // 作者信息
  author: { name: "你的名字", url: "https://你的域名.com" },

  // 首页个人简介
  bio: {
    avatar: "/avatar.svg",     // 头像路径（放在 static/ 目录）
    name: "你的名字",
    bio: "一句话介绍",
    links: [                   // 社交链接
      { name: "GitHub", icon: "simple-icons:github", url: "https://github.com/xxx", color: "#333" },
      { name: "邮箱", icon: "mdi:email-outline", url: "mailto:xxx@xxx.com" }
    ]
  },

  // Giscus 评论（可选，不需要可删除 giscus 整块）
  giscus: {
    repo: "你的用户名/仓库名",
    repoId: "从 giscus.app 获取",
    category: "Announcements",
    categoryId: "从 giscus.app 获取"
  },

  // 首页导航链接
  navLinks: [
    { label: "博客", icon: "mdi:post-outline", href: "/posts" },
    { label: "封面制作", icon: "mdi:image-edit", href: "/cover" },
    { label: "隐藏图", icon: "mdi:layers-triple", href: "/ptg" },
    { label: "友链", icon: "mdi:link-variant", href: "/friends" }
  ]
};
```

### 2. 静态资源 — `static/` 目录

替换以下文件：
- `favicon.svg` — 网站图标
- `avatar.svg` — 头像
- `og-image.svg` — OG 分享图（1200×630）

### 3. HTML 模板 — `src/app.html`

修改 `<html lang="zh_CN">` 为你的语言。

### 4. 部署配置

根据目标平台修改对应配置文件中的域名和项目名：

| 平台 | 配置文件 | 需修改 |
|------|----------|--------|
| Cloudflare Workers | `wrangler.toml` | `name`、KV `id` |
| Netlify | `netlify.toml` | 无需修改 |
| Vercel | `vercel.json` | 无需修改 |
| EdgeOne | `edgeone.json` | 无需修改 |

---

## 写文章

在 `src/content/posts/` 下创建目录和 `index.md`：

```yaml
---
title: '文章标题'
published: '2026-06-05'
description: '文章描述'
image: 'cover.png'        # 可选
pinned: false              # 可选，置顶
draft: false               # 可选，草稿
tags: ['标签1', '标签2']   # 可选
---

正文内容...
```

快捷创建：

```bash
pnpm new
```

## 添加友链

在 `src/data/friends/` 下创建 JSON 文件：

```json
{
  "name": "站点名称",
  "avatar": "头像 URL",
  "description": "站点描述",
  "url": "站点地址"
}
```

---

## 部署

### Cloudflare Workers（SSR 模式）

```bash
pnpm add -g wrangler
wrangler login
pnpm build:cloudflare
wrangler deploy
# 或一步完成
pnpm deploy:cloudflare
```

`wrangler.toml`：

```toml
name = "blog"                          # ← 修改为你的 Worker 名称
main = ".svelte-kit/cloudflare/_worker.js"
compatibility_date = "2026-06-01"

[assets]
directory = ".svelte-kit/cloudflare"
binding = "ASSETS"

# 页面浏览量存储（需要创建 KV 命名空间）
[[kv_namespaces]]
binding = "VIEWS"
id = "你的KV命名空间ID"               # ← 在 Cloudflare Dashboard 创建 KV 后填入
```

### Cloudflare Pages（静态模式）

```bash
pnpm build:cf-pages
wrangler pages deploy build --project-name blog
```

或 Git 自动部署：Dashboard → Workers & Pages → Create → Pages → Connect to Git，构建命令 `pnpm build:cf-pages`，输出 `build`。

### Netlify

```bash
pnpm add -g netlify-cli
netlify login
pnpm build:netlify
netlify deploy --prod --dir=build
```

或 Git 自动部署：Dashboard → Add new site → Import from Git，自动检测 `netlify.toml`。

`netlify.toml`：

```toml
[build]
  command = "pnpm build:netlify"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

```bash
pnpm add -g vercel
vercel login
pnpm build:vercel
vercel --prod
```

或 Git 自动部署：Dashboard → Add New Project → Import Git Repository，自动检测 `vercel.json`。

`vercel.json`：

```json
{
  "buildCommand": "pnpm build:vercel",
  "outputDirectory": "build",
  "framework": "sveltekit"
}
```

### 腾讯 EdgeOne 全球区

```bash
pnpm build:edgeone
# 将 build/ 目录上传到 EdgeOne 控制台
```

或 Git 自动部署：Dashboard → Pages → 创建项目 → 关联 Git 仓库，构建命令 `pnpm build:edgeone`，输出 `build`。

`edgeone.json`：

```json
{
  "buildCommand": "pnpm build:edgeone",
  "outputDirectory": "build",
  "compatibilityDate": "2026-06-01"
}
```

### 静态托管（通用）

```bash
pnpm build
```

产物在 `build/` 目录，可部署到 Nginx / Apache / GitHub Pages / 任何静态文件服务器。

### 部署平台对比

| 平台 | 模式 | 构建命令 | 部署命令 | 配置文件 |
|------|------|----------|----------|----------|
| Cloudflare Workers | SSR | `pnpm build:cloudflare` | `wrangler deploy` | `wrangler.toml` |
| Cloudflare Pages | 静态 | `pnpm build:cf-pages` | `wrangler pages deploy build` | `wrangler.toml` |
| Netlify | 静态 | `pnpm build:netlify` | `netlify deploy --prod --dir=build` | `netlify.toml` |
| Vercel | 静态 | `pnpm build:vercel` | `vercel --prod` | `vercel.json` |
| EdgeOne | 静态 | `pnpm build:edgeone` | 控制台上传 | `edgeone.json` |
| 通用静态 | 静态 | `pnpm build` | 上传 `build/` | — |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | SvelteKit 2 + Svelte 5 (Runes) |
| 构建 | Vite 8 |
| 样式 | TailwindCSS 4 + shadcn-svelte |
| Markdown | mdsvex + Shiki |
| 图片 | sharp (AVIF) + PhotoSwipe |
| 图标 | Iconify |
| 统计 | Umami |
| 评论 | Giscus |
| 部署 | adapter-static / cloudflare / netlify / vercel |

## 命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 |
| `pnpm new` | 创建新文章 |
| `pnpm build` | 构建静态站点 |
| `pnpm preview` | 预览构建产物 |
| `pnpm check` | TypeScript 检查 |
| `pnpm lint` | ESLint + Prettier 检查 |
| `pnpm format` | 代码格式化 |

## 项目结构

```
src/
├── app.css                    # 全局样式 + 主题变量 + Shiki + 代码块
├── app.html                   # HTML 模板
├── content/posts/             # Markdown 文章
├── data/friends/              # 友链 JSON
├── lib/
│   ├── components/            # 组件（ui/ cover/ 全局组件）
│   ├── config/
│   │   ├── mdsvex.config.js   # Markdown 配置
│   │   └── site.ts            # 站点配置 ← 需要修改
│   ├── stores/                # 状态管理
│   ├── types/                 # 类型定义
│   └── utils/                 # 工具函数
├── routes/                    # 页面路由
├── scripts/                   # 构建脚本
├── static/                    # 静态资源 ← 需要替换
└── vite-plugins/              # Vite/mdsvex 插件
```

---

## 本地开发

```bash
# 克隆项目
git clone https://github.com/ZhiJingHub/blog.git
cd blog

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:5173 预览。

环境要求：Node.js >= 18，pnpm >= 9。

---

## 致谢

本项目参考了 [svaf](https://github.com/afoim/svaf) 的架构设计和功能实现。

## 许可

MIT
