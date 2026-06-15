// Cloudflare Worker：浏览量统计 API
// 用于 Dashboard 直接粘贴部署（纯 JS 版本）

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function cleanPath(path) {
  try {
    const parsed = new URL(path, 'http://dummy.com');
    return parsed.pathname.replace(/\/$/) || '/';
  } catch {
    return path.split('?')[0].split('#')[0].replace(/\/$/) || '/';
  }
}

async function getCount(db, key) {
  const row = await db
    .prepare('SELECT count FROM page_views WHERE path = ?')
    .bind(key)
    .first();
  return row?.count ?? 0;
}

async function incrementCount(db, key) {
  await db
    .prepare(
      `INSERT INTO page_views (path, count) VALUES (?1, 1)
       ON CONFLICT(path) DO UPDATE SET count = count + 1`
    )
    .bind(key)
    .run();
  return getCount(db, key);
}

async function handleRequest(request, env) {
  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // 健康检查
  if (request.method === 'GET') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  // 批量读取模式
  if (body.paths) {
    if (!Array.isArray(body.paths) || body.paths.length > 100) {
      return Response.json({ error: 'Invalid paths' }, { status: 400, headers: CORS_HEADERS });
    }
    const keys = body.paths.map(cleanPath);
    const results = await Promise.all(keys.map((k) => getCount(env.DB, k)));
    return Response.json(results, { headers: CORS_HEADERS });
  }

  // 单路径递增模式
  const key = cleanPath(body.path || '');
  if (!key) {
    return Response.json({ error: 'Missing path' }, { status: 400, headers: CORS_HEADERS });
  }
  const count = await incrementCount(env.DB, key);
  return Response.json({ count }, { headers: CORS_HEADERS });
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (err) {
      console.error('Worker error:', err);
      return Response.json(
        { error: 'Internal Server Error' },
        { status: 500, headers: CORS_HEADERS }
      );
    }
  },
};
