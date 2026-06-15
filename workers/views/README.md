# Views Worker

基于 Cloudflare Workers + D1 的全平台浏览量统计 API。独立于博客部署平台，任何静态站点均可通过 HTTP 调用。

## 前置条件

- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)（免费即可）

---

## 部署步骤（Git 连接自动部署）

### 第一步：创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **D1**
3. 点击右上角 **Create** 按钮
4. 数据库名称填 `page-views`，点击 **Create**
5. 进入数据库详情页 → 点击 **Console** 标签
6. 将以下 SQL 粘贴进输入框，点击 **Execute**：

```sql
CREATE TABLE IF NOT EXISTS page_views (
  path TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
```

7. 看到 `Success` 即表示建表成功
8. 复制右侧栏的 **Database ID**（格式为 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

### 第二步：配置 Database ID

编辑 `workers/views/wrangler.toml`，将 `<YOUR_DATABASE_ID>` 替换为上一步复制的 ID：

```toml
name = "views"
main = "src/index.ts"
compatibility_date = "2026-06-01"

[[d1_databases]]
binding = "DB"
database_name = "page-views"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 替换这里
```

提交并推送到 GitHub。

### 第三步：连接 Git 自动部署

1. 左侧菜单 → **Workers & Pages**
2. 点击 **Create** → 选择 **Workers** 标签 → 点击 **Connect to Git**
3. 选择你的博客仓库
4. 配置部署设置：
   - **Production branch**: `main`
   - **Root directory**: `workers/views`
   - **Build command**: 留空（不需要）
   - **Worker name**: `views`
5. 点击 **Save and Deploy**

首次部署成功后，以后每次 push 到 `main` 分支的 `workers/views/` 目录变更都会自动部署。

### 第四步：绑定 D1 数据库

首次 Git 部署后，需要手动绑定 D1：

1. Worker 详情页 → **Settings** → **Variables**
2. 找到 **D1 Database Bindings**，点击 **Add binding**
3. 填写：
   - **Variable name**: `DB`
   - **D1 database**: 选择第一步创建的 `page-views`
4. 点击 **Save and deploy**

> 这一步只需操作一次，后续 Git 自动部署不会覆盖此绑定。

### 第五步：验证

1. Worker 详情页上方有访问链接（如 `https://views.xxxxxxxx.workers.dev`）
2. 浏览器访问应显示 `ok`（GET 健康检查）
3. 测试递增：

```bash
curl -X POST https://views.xxxxxxxx.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"path":"/posts/hello-world/"}'
# → {"count":1}
```

### 第六步：绑定自定义域名（可选）

1. Worker 详情页 → **Settings** → **Domains & Routes**
2. 点击 **Add** → 选择 **Custom Domain**
3. 输入子域名（如 `views.iwexe.top`），点击 **Add Domain**

> 前提：该域名的 DNS 已托管在 Cloudflare。

### 第七步：配置博客站点

编辑 `src/lib/config/site.ts`，填入 Worker 地址：

```ts
viewsApi: "https://views.xxxxxxxx.workers.dev"  // 或自定义域名
```

留空（`""`）则禁用浏览量功能。

---

## wrangler.toml 配置说明

```toml
# Worker 名称，部署后对应的访问地址为 https://views.workers.dev
name = "views"

# 入口文件，Git 部署时自动编译 TypeScript
main = "src/index.ts"

# Cloudflare 兼容日期，决定运行时可用的 API 版本
compatibility_date = "2026-06-01"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"                                    # 代码中通过 env.DB 访问
database_name = "page-views"                       # 数据库名称（仅标识用）
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 必须替换为真实 ID
```

---

## 数据管理

### 查看浏览量数据

1. 左侧菜单 → **Workers & Pages** → **D1**
2. 点击 `page-views` 数据库
3. 点击 **Console** 标签，输入 SQL 查询：

```sql
-- 查看浏览量 Top 10
SELECT * FROM page_views ORDER BY count DESC LIMIT 10;

-- 查看某篇文章
SELECT * FROM page_views WHERE path = '/posts/hello-world/';

-- 查看总浏览量
SELECT SUM(count) AS total FROM page_views;
```

### 重置某篇文章的计数

```sql
DELETE FROM page_views WHERE path = '/posts/some-post/';
```

### 导出 / 导入

- **导出**：D1 数据库详情页 → 右上角 **Export** → 下载 SQL 文件
- **导入**：D1 数据库详情页 → **Console** → 粘贴 SQL 执行

---

## API 文档

所有请求方法为 `POST`，`Content-Type: application/json`。支持 CORS 跨域。

### 递增浏览量

```json
{ "path": "/posts/hello-world/" }
→ { "count": 1 }
```

每次调用计数 +1 并返回最新值。

### 批量读取浏览量

```json
{ "paths": ["/posts/a/", "/posts/b/"] }
→ [42, 17]
```

返回值顺序与请求的 `paths` 一一对应。最多支持 100 个路径。

### 健康检查

`GET /` → `200 ok`

---

## 常见问题

### Q: Git 部署时报错找不到入口文件

确认 Root directory 设置为 `workers/views`，不是仓库根目录。

### Q: 绑定 D1 时看不到数据库

确认 D1 数据库和 Worker 在同一个 Cloudflare 账号下。

### Q: 浏览量不增长

- 检查 `site.ts` 中 `viewsApi` 是否填写正确
- 浏览器 F12 控制台查看是否有 CORS 错误
- 确认 Worker → Settings → Variables → D1 Binding 中变量名为 `DB`（区分大小写）
- 确认数据库表已创建（D1 Console 中执行 `SELECT * FROM page_views;`）

### Q: 更新 wrangler.toml 后 D1 绑定会丢失吗

不会。D1 绑定通过 Dashboard 配置，优先级高于 wrangler.toml，Git 重新部署不会覆盖。

### Q: 免费额度够用吗？

Cloudflare Workers 免费版：每天 100,000 次请求，每次请求 CPU 时间 10ms。
D1 免费版：每天 500 万次读取、10 万次写入，存储 5GB。
个人博客完全够用。
