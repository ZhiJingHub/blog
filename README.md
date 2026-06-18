# ZhiJing's Blog

基于 **SvelteKit 2 + Svelte 5** 构建的现代静态博客，集成封面制作、隐图工具、格式转换、图片水印、友链管理，支持 5 种部署平台。

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | SvelteKit + Svelte 5 (Runes) | ^2.63 / ^5.56 |
| 语言 | TypeScript | ^6.0 |
| 构建 | Vite 8 | ^8.0 |
| 样式 | Tailwind CSS v4 + @tailwindcss/typography | ^4.3 |
| 组件库 | shadcn-svelte + bits-ui | ^1.3 / ^2.18 |
| Markdown | mdsvex | ^0.12 |
| 代码高亮 | Shiki（双主题：github-light / github-dark） | ^4.2 |
| 数学公式 | KaTeX | ^0.17 |
| 图表 | Mermaid（CDN 按需加载） | — |
| 图标 | Iconify（mdi + simple-icons） | ^5.2 |
| 图片处理 | Sharp（AVIF 转换） | ^0.34 |
| 图片浏览 | PhotoSwipe | ^5.4 |
| 统计 | Umami（自托管） + Vercel Analytics + Speed Insights | — |
| 浏览量 | Cloudflare Worker + D1（独立部署，全平台通用） | — |
| 包管理 | pnpm | — |

---

## 功能特性

### 博客系统

- Markdown 写作（mdsvex），支持 `.md` 和 `.svx`，可嵌入 Svelte 组件
- YAML frontmatter：标题、日期、标签、描述、封面图、置顶、草稿、更新日期、作者
- 自动计算字数、阅读时间、图片数量
- 26 种语言的 Shiki 语法高亮（亮暗双主题自动切换）
- 代码块：一键复制、文件名标签 + 语言徽章同时显示、行高亮标注、冒号语法（` ```ts:utils.ts `）
- KaTeX 数学公式（行内 `$...$` 和块级 `$$...$$`）
- Mermaid 图表渲染（CDN 按需加载，深色主题自动切换）
- GitHub 风格告警提示（`[!NOTE]`、`[!TIP]`、`[!WARNING]`、`[!CAUTION]`）
- 外链跳转中间页（`/go/[slug]`），3 秒倒计时 + 手动确认，三层拦截保障
- 自定义短链重定向（`/go/github` 等），SSR 平台服务端 302 + 静态平台预渲染
- 文章目录导航（桌面侧边固定 + 移动端抽屉弹窗）
- 图片灯箱（PhotoSwipe），支持缩放浏览
- 前端搜索（标题 / 描述 / 标签）
- 置顶文章、草稿模式、标签系统
- RSS / Sitemap / robots.txt 自动生成（全部预渲染）
- 首页显示访客计数（"您是第 X 位访问本站的访客"）

### 外链重定向系统

全站外部链接自动走 `/go/[slug]` 中间页跳转，三层拦截保障：

1. **rehype 插件**（构建时）— Markdown 文章中的外链在编译时改写为 `/go/` 路径
2. **ExternalLinkInterceptor**（运行时）— 全局 click 事件捕获，拦截 Svelte 组件中的外链
3. **服务端重定向**（SSR 平台）— `+page.server.ts` 的 `load` 函数对所有 slug 做 302 重定向

短链在 `src/lib/config/redirects.ts` 中配置：

```ts
export const redirects: Record<string, string> = {
  '/go/github': 'https://github.com/ZhiJingHub',
  '/go/telegram': 'https://t.me/ZhiJing_PM_Bot'
};
```

站内链接白名单在 `src/lib/utils/site-domains.ts` 中配置，支持精确匹配和子域名匹配。

### 封面制作 — `/cover/`

自定义文本、图标、背景、颜色、阴影、尺寸，导出 PNG/SVG，支持多比例多倍率批量导出。本地字体加载，Iconify 图标搜索，背景图片拖拽缩放。

### 隐藏图 — `/ptg/`

- **棱光坦克**（棋盘格交错）— 两张图片交错像素混合
- **幻影坦克**（透明度合成）— 浅色/深色背景显示不同图片

纯 Canvas 客户端处理，支持最大尺寸限制，结果可导出 PNG。

### 格式转换 — `/convert/`

支持 PNG、JPEG、WebP、AVIF、BMP、GIF、SVG 七种格式互转。单图/批量模式，质量调整、尺寸调整、旋转翻转、压缩预设、自定义文件名、内置水印功能。

### 图片水印 — `/watermark/`

独立水印工具，支持同时添加多个水印（文字/图片），六种位置模式（含平铺），可调透明度、旋转角度、字体大小、颜色。实时预览，一键导出。

### 友链 — `/friends/`

**Issue 自动友链**：用户通过 Issue 模板提交申请，GitHub Actions 自动解析表单、校验字段、创建 JSON 文件并提 PR 合并。校验内容包括：必填字段、URL 格式、URL 去重（归一化尾部斜杠）。

申请流程：
1. 在你的站点添加本站友链
2. 点击 [提交友链申请](https://github.com/ZhiJingHub/blog/issues/new?template=friend-link.yml) 填写表单
3. 系统自动校验并创建友链文件，校验通过后自动合并

### 页面浏览量

文章详情页和列表页显示浏览次数，由独立的 Cloudflare Worker + D1 提供 API，不绑定任何部署平台，全平台通用。详见 [workers/views/README.md](workers/views/README.md)。博客列表页显示文章总数、总字数、总图片数。

### 主题系统

亮色 / 暗色 / 跟随系统，localStorage 持久化，Shiki 代码主题自动跟随切换。

### 图片优化

构建时自动将 PNG/JPG/WebP 转为 AVIF（quality 50），带 `.image-cache/` 增量缓存，支持并发处理。

### SEO

Open Graph 元标签、Twitter Cards、Canonical URL、结构化 Sitemap（含优先级）、文章页 `article:published_time` / `article:modified_time`。

### 安全

服务端安全响应头：`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`。错误处理返回唯一 `errorId` 便于问题追踪。

### 动画

- View Transitions API 页面切换动画

---

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 9

### 安装与运行

```bash
git clone https://github.com/ZhiJingHub/blog.git
cd blog
pnpm install
pnpm dev
```

访问 http://localhost:5173 预览。

### 创建新文章

```bash
pnpm new
```

交互式输入标题、slug、描述、标签、是否置顶，自动生成 `src/content/posts/<slug>/index.md`。

---

## 初始化配置

克隆项目后，**必须修改以下文件**才能正常使用：

### 1. 站点信息 — `src/lib/config/site.ts`

```ts
export const siteConfig = {
  name: "你的博客名",
  title: "你的博客名",
  subtitle: "你的副标题",
  url: "https://你的域名.com",
  description: "站点描述",
  keywords: ["关键词1", "关键词2"],
  ogImage: "/og-image.svg",

  // Umami 统计（可选）
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
    avatar: "/avatar.svg",
    name: "你的名字",
    bio: "一句话介绍",
    links: [
      { name: "GitHub", icon: "simple-icons:github", url: "https://github.com/xxx", color: "#333" },
      { name: "邮箱", icon: "mdi:email-outline", url: "mailto:xxx@xxx.com" }
    ]
  },

  // 首页导航链接
  navLinks: [
    { label: "博客", icon: "mdi:post-outline", href: "/posts" },
    { label: "封面制作", icon: "mdi:image-edit", href: "/cover" },
    { label: "隐藏图", icon: "mdi:layers-triple", href: "/ptg" },
    { label: "格式转换", icon: "mdi:image-sync", href: "/convert" },
    { label: "水印", icon: "mdi:watermark", href: "/watermark" },
    { label: "友链", icon: "mdi:link-variant", href: "/friends" }
  ]
};
```

### 2. 站内域名白名单 — `src/lib/utils/site-domains.ts`

```ts
export const SITE_DOMAINS = ['你的域名.com', '其他域名.com'];
```

### 3. 静态资源 — `static/` 目录

替换以下文件：
- `favicon.svg` — 网站图标
- `avatar.svg` — 头像
- `og-image.svg` — OG 分享图（建议 1200×630）

### 4. 部署配置

根据目标平台修改对应配置文件：

| 平台 | 配置文件 | 需修改 |
|------|----------|--------|
| Cloudflare Workers | `wrangler.toml` | `name` |
| Cloudflare Pages | Dashboard | 无需修改 |
| Netlify | `netlify.toml` | 无需修改 |
| Vercel | `vercel.json` | 无需修改 |
| EdgeOne | `edgeone.json` | 无需修改 |

### 5. 浏览量统计（可选）

浏览量由独立的 Cloudflare Worker + D1 提供 API，**不绑定任何博客部署平台**，所有平台通用。

1. **创建 D1 数据库**：Dashboard → Workers & Pages → D1 → Create → 名称 `page-views` → Console 中执行建表 SQL
2. **填入 Database ID**：编辑 `workers/views/wrangler.toml`，将 `<YOUR_DATABASE_ID>` 替换为上一步的 Database ID，提交推送
3. **连接 Git 部署**：Dashboard → Workers & Pages → Create → Workers → Connect to Git → 选择仓库 → Root directory 填 `workers/views` → Deploy
4. **绑定 D1**：Worker → Settings → Variables → D1 Database Bindings → 变量名 `DB` → 选择 `page-views` → Save and deploy
5. **配置站点**：在 `src/lib/config/site.ts` 中填入 Worker 地址

```ts
viewsApi: "https://views.xxxxxxxx.workers.dev"
```

> 详细步骤和 wrangler.toml 配置说明见 [workers/views/README.md](workers/views/README.md)。

### 6. GitHub Actions 自动友链（可选）

友链申请通过 Issue 模板自动处理。确保仓库 Settings → Actions → General 中允许 Actions 运行，并授予 `GITHUB_TOKEN` 写入权限（Settings → Actions → General → Workflow permissions → Read and write permissions）。

---

## 写文章

在 `src/content/posts/` 下创建目录和 `index.md`：

```yaml
---
title: '文章标题'
published: '2026-06-05'
description: '文章描述'
image: 'cover.png'          # 可选，封面图（相对于文章目录）
pinned: false                # 可选，置顶
draft: false                 # 可选，草稿（构建时跳过）
tags: ['标签1', '标签2']     # 可选
updated: '2026-06-06'        # 可选，更新日期
author: '作者名'             # 可选
---

正文内容...

支持 KaTeX：$E = mc^2$

支持 Mermaid：

​```mermaid
graph LR
  A[开始] --> B[结束]
​```

支持 GitHub 告警：

> [!NOTE]
> 这是一个提示。
```

### 代码块语法

支持两种方式指定文件名标签：

````markdown
​```ts utils.ts
// 空格语法：语言 + 文件名
const x = 1;
​```

​```python:main.py
# 冒号语法：语言:文件名
print("hello")
​```
````

有文件名时，左侧显示文件图标 + 文件名，右侧显示语言徽章。无文件名时，左侧显示语言标签。

文章目录下可放置 `img/` 文件夹存放图片，构建时自动转换为 AVIF 格式。

---

## 添加友链

### 方式一：Issue 自动申请（推荐）

点击 [提交友链申请](https://github.com/ZhiJingHub/blog/issues/new?template=friend-link.yml)，填写表单即可。系统自动校验并创建 PR。

### 方式二：手动提交 PR

Fork 仓库，在 `src/data/friends/` 下创建 JSON 文件：

```json
{
  "name": "站点名称",
  "avatar": "https://example.com/avatar.png",
  "description": "站点描述",
  "url": "https://example.com",
  "backlink": "https://example.com/friends"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | ✅ | 站点名称 |
| `url` | ✅ | 站点地址 |
| `avatar` | ❌ | 头像 URL |
| `description` | ❌ | 站点描述 |
| `backlink` | ❌ | 友链页面地址（用于双向链接验证） |

---

## 部署

### 平台对比

| 平台 | 适配器 | 构建命令 | 部署命令 | API 路由 |
|------|--------|----------|----------|----------|
| Cloudflare Workers | adapter-cloudflare | `pnpm build:cloudflare` | `pnpm deploy:cloudflare` | ✅ KV |
| Cloudflare Pages | adapter-cloudflare | `pnpm build:cf-pages` | `pnpm deploy:cf-pages` | ✅ Functions |
| Netlify | adapter-netlify | `pnpm build:netlify` | `pnpm deploy:netlify` | ✅ Functions |
| Vercel | adapter-vercel | `pnpm build:vercel` | `pnpm deploy:vercel` | ✅ Serverless |
| 腾讯 EdgeOne | adapter-static | `pnpm build:edgeone` | 控制台上传 | ❌ 纯静态 |
| 通用静态 | adapter-static | `pnpm build` | 上传 `build/` | ❌ 纯静态 |

> **阅读量统计**由独立的 Cloudflare Worker + D1 提供，所有平台通用，详见 [workers/views/README.md](workers/views/README.md)。

### Cloudflare Workers

```bash
pnpm add -g wrangler
wrangler login
pnpm deploy:cloudflare
```

`wrangler.toml` 配置：

```toml
name = "blog"                          # ← 修改为你的 Worker 名称
main = ".svelte-kit/cloudflare/_worker.js"
compatibility_date = "2026-06-01"

[assets]
directory = ".svelte-kit/cloudflare"
binding = "ASSETS"
```

### Cloudflare Pages

```bash
pnpm deploy:cf-pages
```

或 Git 自动部署：Dashboard → Workers & Pages → Create → Pages → Connect to Git，构建命令 `pnpm build:cf-pages`，输出 `.svelte-kit/cloudflare`。

### Netlify

```bash
pnpm add -g netlify-cli
netlify login
pnpm deploy:netlify
```

或 Git 自动部署：Dashboard → Add new site → Import from Git，自动检测 `netlify.toml`。

### Vercel

```bash
pnpm add -g vercel
vercel login
pnpm deploy:vercel
```

或 Git 自动部署：Dashboard → Add New Project → Import Git Repository，自动检测 `vercel.json`。

### 腾讯 EdgeOne

```bash
pnpm build:edgeone
# 将 build/ 目录上传到 EdgeOne 控制台
```

或 Git 自动部署：Dashboard → Pages → 创建项目 → 关联 Git 仓库，构建命令 `pnpm build:edgeone`，输出 `build`。

### 通用静态托管

```bash
pnpm build
```

产物在 `build/` 目录，可部署到 Nginx / Apache / GitHub Pages / 任何静态文件服务器。

---

## 项目结构

```
blog/
├── src/
│   ├── app.css                    # 全局样式 + 主题变量 + Shiki + KaTeX + 动画
│   ├── app.html                   # HTML 模板
│   ├── app.d.ts                   # 类型声明（__PLATFORM__、App.Error 等）
│   ├── hooks.server.ts            # 服务端钩子（安全头、短链重定向、错误处理）
│   ├── content/posts/             # Markdown 文章
│   │   └── hello-world/
│   │       ├── index.md           # 文章文件
│   │       └── img/               # 文章图片（构建时自动转 AVIF）
│   ├── data/friends/              # 友链 JSON 文件
│   ├── lib/
│   │   ├── config/
│   │   │   ├── site.ts            # 站点配置 ← 需要修改
│   │   │   ├── redirects.ts       # 自定义短链映射
│   │   │   └── mdsvex.config.js   # Markdown 配置（Shiki、插件）
│   │   ├── types/
│   │   │   ├── post.ts            # 文章元数据类型
│   │   │   ├── friend.ts          # 友链类型
│   │   │   └── watermark.ts       # 水印位置类型
│   │   ├── components/
│   │   │   ├── NavBar.svelte      # 导航栏
│   │   │   ├── Footer.svelte      # 页脚
│   │   │   ├── ThemeToggle.svelte # 主题切换
│   │   │   ├── Toast.svelte       # 通知提示
│   │   │   ├── BackToTop.svelte   # 回到顶部
│   │   │   ├── PostToc.svelte     # 文章目录
│   │   │   ├── ImageViewer.svelte # 图片灯箱
│   │   │   ├── PageViews.svelte   # 阅读量
│   │   │   ├── CoverGenerator.svelte  # 封面生成器
│   │   │   ├── ExternalLinkInterceptor.svelte # 全局外链拦截
│   │   │   ├── cover/             # 封面子组件 + composables
│   │   │   └── ui/                # shadcn-svelte 基础组件
│   │   ├── stores/                # 状态管理（theme、toast、toc）
│   │   ├── utils/                 # 工具函数（posts、format、mermaid 等）
│   │   └── config/
│   │       ├── site.ts            # 站点配置（含域名白名单）
│   │       ├── redirects.ts       # 自定义短链映射
│   │       └── mdsvex.config.js   # Markdown 配置（Shiki、插件）
│   └── routes/
│       ├── +layout.ts             # 根布局加载（Prerender、Analytics）
│       ├── +layout.svelte         # 全局布局（NavBar、Footer、Analytics、外链拦截）
│       ├── +page.svelte           # 首页（社交链接 + 导航 + 访客计数）
│       ├── +error.svelte          # 错误页（403/404/500/502/503）
│       ├── posts/                 # 文章列表 + 详情
│       ├── go/[slug]/             # 外链跳转中间页（服务端 302 + 客户端兜底）
│       ├── friends/               # 友链页面（Issue 自动申请）
│       ├── cover/                 # 封面生成器
│       ├── ptg/                   # 隐图工具
│       ├── convert/               # 格式转换
│       ├── watermark/             # 图片水印
│       ├── api/views/             # 阅读量 API（已废弃，迁移至 Worker）
│       ├── rss.xml/               # RSS 订阅
│       ├── sitemap.xml/           # 站点地图
│       └── robots.txt/            # 爬虫规则
├── scripts/
│   ├── new-post.js                # 文章脚手架 CLI
│   └── post-images.js             # AVIF 图片转换管线
├── workers/
│   └── views/                     # 浏览量统计 Worker + D1（独立部署）
├── vite-plugins/                  # 自定义 remark/rehype 插件
├── static/                        # 静态资源 ← 需要替换
├── svelte.config.js               # SvelteKit 配置（多适配器）
├── vite.config.ts                 # Vite 配置
├── wrangler.toml                  # Cloudflare 配置
├── netlify.toml                   # Netlify 配置
├── vercel.json                    # Vercel 配置
└── edgeone.json                   # EdgeOne 配置
```

---

## 命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 |
| `pnpm new` | 创建新文章 |
| `pnpm build` | 静态构建 |
| `pnpm build:cloudflare` | Cloudflare Workers 构建 |
| `pnpm build:cf-pages` | Cloudflare Pages 构建 |
| `pnpm build:netlify` | Netlify 构建 |
| `pnpm build:vercel` | Vercel 构建 |
| `pnpm build:edgeone` | EdgeOne 构建 |
| `pnpm deploy:cloudflare` | 构建 + 部署到 Cloudflare Workers |
| `pnpm deploy:cf-pages` | 构建 + 部署到 Cloudflare Pages |
| `pnpm deploy:netlify` | 构建 + 部署到 Netlify |
| `pnpm deploy:vercel` | 构建 + 部署到 Vercel |
| `pnpm deploy:edgeone` | 构建 + 部署到 EdgeOne |
| `cd workers/views && npx wrangler deploy` | 部署浏览量统计 Worker |
| `pnpm preview` | 预览构建产物 |
| `pnpm check` | TypeScript 类型检查 |
| `pnpm lint` | ESLint + Prettier 检查 |
| `pnpm format` | 代码格式化 |

---

## 致谢

本项目参考了 [svaf](https://github.com/afoim/svaf) 的架构设计和功能实现。

## 许可

MIT
