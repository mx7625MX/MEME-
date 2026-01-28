# Vercel 部署快速入门

## 5 分钟快速部署

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/meme-master-pro.git
git push -u origin main
```

### 2. 在 Vercel 导入项目

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择 `meme-master-pro` 仓库
3. 点击 `Import`

### 3. 配置环境变量

在 Vercel Dashboard 的 `Environment Variables` 中添加：

```
PGDATABASE_URL=postgresql://postgres:password@host:5432/db
ENCRYPTION_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
ENCRYPTION_SALT=0123456789abcdef0123456789abcdef
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. 创建数据库表

在 Vercel Dashboard 的数据库管理界面中，运行迁移脚本：

```bash
pnpm exec drizzle-kit push:pg --config=drizzle.config.ts
```

### 5. 部署

点击 `Deploy` 按钮，等待 2-5 分钟。

### 6. 访问应用

部署成功后，访问 `https://your-app.vercel.app`

## 完整部署指南

查看 [DEPLOYMENT.md](../DEPLOYMENT.md) 获取详细步骤。

## 环境变量清单

### 必需

- `PGDATABASE_URL` - PostgreSQL 连接字符串
- `ENCRYPTION_KEY` - 加密密钥
- `ENCRYPTION_SALT` - 加密盐值
- `NEXT_PUBLIC_APP_URL` - 应用 URL

### 推荐

- `WALLET_PRIVATE_KEY` - 主钱包私钥
- `SOLANA_RPC_URL` - Solana RPC 节点
- `ETH_RPC_URL` - Ethereum RPC 节点

## 数据库设置

推荐使用以下云数据库服务：

- [Vercel Postgres](https://vercel.com/storage/postgres) - 与 Vercel 集成最好
- [Supabase](https://supabase.com) - 免费额度大
- [Neon](https://neon.tech) - Serverless PostgreSQL

## 常见问题

**Q: 部署失败？**
A: 检查环境变量是否正确设置，特别是 `PGDATABASE_URL`。

**Q: 数据库连接失败？**
A: 确认数据库允许 Vercel IP 访问，或使用 Vercel Postgres/Supabase/Neon。

**Q: 需要付费吗？**
A: Vercel 免费计划足够小型项目使用。数据库也有免费计划。

---

**需要帮助？** 查看 [DEPLOYMENT.md](../DEPLOYMENT.md) 获取详细指南。
