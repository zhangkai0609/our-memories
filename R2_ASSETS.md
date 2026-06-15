# Cloudflare R2 资源存储方案

目标：

- Supabase 只保存文字、位置、房间号、评论点赞、图片 URL、录音 URL。
- Cloudflare R2 保存照片、录音等大文件。
- 前端强缓存图片/录音，降低 Supabase 流量。

## 架构

```text
App / Web
  -> Cloudflare Worker /upload
      -> Cloudflare R2 bucket: our-memories-assets
      -> 返回资源 URL
  -> Supabase memories 表
      -> image_urls: [资源 URL]
      -> content: 正文 + [[memory-audio:资源 URL]]
```

## 本地配置

复制 `.env.example` 为 `.env.local`，把 Worker 地址填进去：

```text
VITE_ASSET_UPLOAD_URL=https://your-worker.your-subdomain.workers.dev/upload
```

如果没有配置这个变量，App 会临时回退到旧的 base64 保存方式。

## Cloudflare 部署

首次登录：

```bash
npx wrangler login
```

创建 R2 桶：

```bash
npm run r2:create
```

部署 Worker：

```bash
npm run worker:deploy
```

部署成功后，把 Worker 的 `/upload` 地址写入 `.env.local`，再重新构建：

```bash
npm run build
npm run cap:sync
```

## Worker 接口

上传：

```text
POST /upload
multipart/form-data
- file
- roomCode
- kind: image | audio
```

读取：

```text
GET /assets/:key
```

## 旧数据迁移

旧数据里如果有 base64 图片/录音，需要等 Supabase 项目恢复可访问后再迁移：

1. 读取 `memories` 表。
2. 找出 `image_urls` 里的 base64 图片和 `content` 里的 base64 录音。
3. 上传到 Worker/R2。
4. 用返回 URL 更新 Supabase。

当前阶段先保证新上传资源走 R2。
