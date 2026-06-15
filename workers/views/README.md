# Views Worker

基于 Cloudflare Workers + D1 的全平台浏览量统计 API。独立于博客部署平台，任何静态站点均可通过 HTTP 调用。

## 前置条件

- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)（免费即可）
- 该账号下已有至少一个域名托管在 Cloudflare（用于绑定 Worker 路由）

---

## 部署步骤（全部通过 Cloudflare Dashboard 操作）

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
8. 记下页面上的 **Database ID**（右侧栏 `Database ID: xxxxxxxx-...`），后面要用

### 第二步：创建 Worker

1. 左侧菜单 → **Workers & Pages**
2. 点击 **Create** → 选择 **Create Worker**
3. Worker 名称填 `views`，点击 **Deploy**
4. 部署成功后进入 Worker 详情页 → 点击 **Edit Code**
5. 删除编辑器中的所有默认代码
6. 将 `workers/views/src/index.js` 的全部内容粘贴进去
7. 点击右上角 **Save and deploy**

### 第三步：绑定 D1 数据库

1. 回到 Worker 详情页 → **Settings** → **Variables**
2. 找到 **D1 Database Bindings**，点击 **Add binding**
3. 填写：
   - **Variable name**: `DB`
   - **D1 database**: 选择第一步创建的 `page-views`
4. 点击 **Save and deploy**

### 第四步：验证

1. 在 Worker 详情页点击上方的访问链接（如 `https://views.xxxxxxxx.workers.dev`）
2. 浏览器应显示 `ok`（这是 GET 健康检查）
3. 用浏览器控制台或任意工具发送 POST 请求测试：

```bash
# 递增浏览量
curl -X POST https://views.xxxxxxxx.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"path":"/posts/hello-world/"}'
# → {"count":1}

# 批量读取
curl -X POST https://views.xxxxxxxx.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"paths":["/posts/hello-world/"]}'
# → [1]
```

### 第五步：绑定自定义域名（可选）

1. Worker 详情页 → **Settings** → **Domains & Routes**
2. 点击 **Add** → 选择 **Custom Domain**
3. 输入子域名（如 `views.iwexe.top`），点击 **Add Domain**

> 前提：该域名的 DNS 已托管在 Cloudflare。

绑定后使用 `https://views.iwexe.top` 作为 API 地址。

### 第六步：配置博客站点

编辑 `src/lib/config/site.ts`，填入 Worker 地址：

```ts
viewsApi: "https://views.xxxxxxxx.workers.dev"  // 或自定义域名
```

留空（`""`）则禁用浏览量功能。

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

在 D1 Console 中执行：

```sql
DELETE FROM page_views WHERE path = '/posts/some-post/';
```

### 导出数据

Dashboard 操作：D1 数据库详情页 → 右上角 **Export** 按钮 → 下载 SQL 文件。

### 导入数据

Dashboard 操作：D1 数据库详情页 → **Console** → 粘贴 SQL 语句执行。

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

### Q: 绑定 D1 时看不到数据库

确认 D1 数据库和 Worker 在同一个 Cloudflare 账号下。

### Q: 浏览量不增长

- 检查 `site.ts` 中 `viewsApi` 是否填写正确
- 浏览器 F12 控制台查看是否有 CORS 错误
- 确认 Worker → Settings → Variables → D1 Binding 中变量名为 `DB`（区分大小写）
- 确认数据库表已创建（D1 Console 中执行 `SELECT * FROM page_views;`）

### Q: 免费额度够用吗？

Cloudflare Workers 免费版：每天 100,000 次请求，每次请求 CPU 时间 10ms。
D1 免费版：每天 500 万次读取、10 万次写入，存储 5GB。
个人博客完全够用。

### Q: 更新 Worker 代码后需要重新绑定 D1 吗？

不需要。D1 绑定保存在 Worker 配置中，更新代码不影响绑定。
