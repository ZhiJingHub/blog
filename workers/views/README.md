# Views Worker

基于 Cloudflare Workers + D1 的全平台浏览量统计 API。独立于博客部署平台，任何静态站点均可通过 HTTP 调用。

## 前置条件

- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)（免费即可）
- Node.js >= 18
- 已安装 Wrangler CLI（Cloudflare 官方部署工具）

如未安装 Wrangler：

```bash
npm install -g wrangler
```

登录 Cloudflare：

```bash
wrangler login
```

浏览器会弹出授权页面，确认即可。

---

## 部署步骤

### 第一步：安装依赖

```bash
cd workers/views
npm install
```

### 第二步：创建 D1 数据库

**方式一：命令行（推荐）**

```bash
npx wrangler d1 create page-views
```

输出示例：

```
✅ Successfully created DB 'page-views'

[[d1_databases]]
binding = "DB"
database_name = "page-views"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

复制 `database_id` 的值。

**方式二：Cloudflare Dashboard**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Storage & Databases** → **D1 SQL Database**
3. 点击 **Create** → 输入数据库名称 `page-views` → 点击 **Create**
4. 在数据库详情页复制 **Database ID**（右侧栏）

### 第三步：配置 Wrangler

编辑 `wrangler.toml`，将 `<YOUR_DATABASE_ID>` 替换为上一步复制的 ID：

```toml
name = "views"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "page-views"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 替换这里
```

### 第四步：初始化数据库表

```bash
npx wrangler d1 execute page-views --remote --file=schema.sql
```

输出 `🚣 Executed 1 command` 即表示成功。

如需验证表是否创建成功：

```bash
npx wrangler d1 execute page-views --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

应输出 `page_views`。

### 第五步：部署 Worker

```bash
npx wrangler deploy
```

部署成功后会输出 Worker 地址，类似：

```
Published views (x.xx sec)
  https://views.xxxxxxxx.workers.dev
```

记下这个地址。

### 第六步：验证 API

```bash
# 健康检查
curl https://views.xxxxxxxx.workers.dev

# 递增浏览量
curl -X POST https://views.xxxxxxxx.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"path":"/posts/hello-world/"}'

# 预期返回：{"count":1}

# 再次递增
curl -X POST https://views.xxxxxxxx.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"path":"/posts/hello-world/"}'

# 预期返回：{"count":2}

# 批量读取
curl -X POST https://views.xxxxxxxx.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"paths":["/posts/hello-world/"]}'

# 预期返回：[2]
```

### 第七步：配置博客站点

编辑 `src/lib/config/site.ts`，填入 Worker 地址：

```ts
viewsApi: "https://views.xxxxxxxx.workers.dev"
```

留空（`""`）则禁用浏览量功能。

---

## 绑定自定义域名（可选）

默认地址 `https://views.xxxxxxxx.workers.dev` 可以正常使用，但绑定自定义域名更美观且不受 Workers 子域名限制。

### 方式一：命令行

```bash
npx wrangler routes add "views.iwexe.top/*" views
```

### 方式二：Cloudflare Dashboard

1. 左侧菜单 → **Workers & Pages**
2. 点击 **views** Worker
3. **Settings** → **Domains & Routes** → **Add Custom Domain**
4. 输入域名（如 `views.iwexe.top`）→ 点击 **Add Domain**

> 前提：该域名已托管在 Cloudflare（DNS 中有橙色云朵）。

绑定后通过 `https://views.iwexe.top` 访问，更新 `site.ts` 中的 `viewsApi` 即可。

---

## 数据管理

### 查看数据

```bash
npx wrangler d1 execute page-views --remote --command "SELECT * FROM page_views ORDER BY count DESC LIMIT 10;"
```

### 导出数据

```bash
npx wrangler d1 export page-views --remote --output=backup.sql
```

导出为 SQLite 格式的 SQL 文件，可随时导入恢复。

### 导入数据

```bash
npx wrangler d1 execute page-views --remote --file=backup.sql
```

### 重置某篇文章的计数

```bash
npx wrangler d1 execute page-views --remote --command "DELETE FROM page_views WHERE path = '/posts/some-post/';"
```

---

## 本地开发

```bash
npx wrangler dev
```

启动本地开发服务器，默认端口 8787。本地使用模拟 D1，数据不持久。

测试本地 API：

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"path":"/posts/hello-world/"}'
```

---

## API 文档

所有请求方法为 `POST`，`Content-Type: application/json`。支持 CORS 跨域。

### 递增浏览量

**请求：**

```json
{ "path": "/posts/hello-world/" }
```

**响应：**

```json
{ "count": 1 }
```

每次调用计数 +1 并返回最新值。

### 批量读取浏览量

**请求：**

```json
{ "paths": ["/posts/a/", "/posts/b/", "/posts/c/"] }
```

**响应：**

```json
[42, 17, 0]
```

返回值顺序与请求的 `paths` 一一对应。最多支持 100 个路径。

### 健康检查

**请求：** `GET /`

**响应：** `200 ok`

---

## 常见问题

### Q: 部署时报 `wrangler: command not found`

```bash
npm install -g wrangler
```

或使用 `npx wrangler` 代替 `wrangler`。

### Q: `wrangler login` 后仍提示未授权

尝试：

```bash
wrangler logout
wrangler login
```

或设置环境变量 `CLOUDFLARE_API_TOKEN`（Dashboard → My Profile → API Tokens → Create Token）。

### Q: D1 创建失败

确认 Cloudflare 账号已激活（免费账号即可），且当前目录下有 `wrangler.toml`。

### Q: 浏览量不增长

检查 `site.ts` 中 `viewsApi` 是否填写正确，浏览器控制台是否有 CORS 错误。确认 Worker 地址可正常访问。

### Q: 免费额度够用吗？

Cloudflare Workers 免费版每天 100,000 次请求，D1 免费版每天 500 万次读取、10 万次写入。个人博客完全够用。
