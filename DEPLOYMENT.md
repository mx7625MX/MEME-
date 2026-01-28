# Vercel 部署指南

本指南将帮助您将 Meme Master Pro 部署到 Vercel。

## 前置要求

- [ ] GitHub 账号（用于托管代码）
- [ ] Vercel 账号（免费部署）
- [ ] PostgreSQL 数据库（推荐 Supabase、Neon 或 Vercel Postgres）

## 部署步骤

### 步骤 1: 准备代码仓库

#### 1.1 初始化 Git 仓库（如果还没有）

```bash
cd /workspace/projects
git init
git add .
git commit -m "Initial commit: Meme Master Pro - Type-safe DeFi trading platform"
```

#### 1.2 创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 `+` > `New repository`
3. 填写仓库名称（例如：`meme-master-pro`）
4. 设置为 `Private`（推荐，保护敏感数据）
5. 点击 `Create repository`
6. 按照提示执行以下命令：

```bash
git remote add origin https://github.com/YOUR_USERNAME/meme-master-pro.git
git branch -M main
git push -u origin main
```

### 步骤 2: 设置 PostgreSQL 数据库

#### 选项 A: 使用 Vercel Postgres（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入您的项目（稍后创建）
3. 点击 `Storage` 标签
4. 点击 `Create Database`
5. 选择 `Postgres`
6. 点击 `Continue`，等待数据库创建完成
7. 记下 `POSTGRES_URL` 和 `POSTGRES_PRISMA_URL`

#### 选项 B: 使用 Supabase

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 在项目设置中获取连接字符串
4. 连接字符串格式：`postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres`

#### 选项 C: 使用 Neon

1. 访问 [Neon](https://neon.tech)
2. 创建新项目
3. 获取连接字符串

### 步骤 3: 运行数据库迁移

在部署前，需要创建数据库表结构。

#### 3.1 使用 Drizzle Kit 推送 Schema

```bash
# 在本地开发环境
pnpm exec drizzle-kit push:pg --config=drizzle.config.ts
```

#### 3.2 或者使用 SQL 脚本

在 Vercel Dashboard 的数据库管理界面中，执行以下 SQL 脚本（参考 `src/storage/database/shared/schema.ts`）：

```sql
-- 创建所有表（根据 schema.ts 中的定义）
-- 示例：创建 wallets 表
CREATE TABLE IF NOT EXISTS wallets (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  address VARCHAR(256) NOT NULL UNIQUE,
  balance NUMERIC(30, 18) DEFAULT '0' NOT NULL,
  mnemonic TEXT,
  private_key TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS wallets_address_idx ON wallets(address);
CREATE INDEX IF NOT EXISTS wallets_chain_idx ON wallets(chain);

-- 重复上述步骤创建所有表...
```

### 步骤 4: 在 Vercel 中创建项目

#### 4.1 导入项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 `Add New` > `Project`
3. 选择 `Continue with GitHub`
4. 授权 Vercel 访问您的 GitHub 账号
5. 选择刚创建的 `meme-master-pro` 仓库
6. 点击 `Import`

#### 4.2 配置项目设置

在项目配置页面：

**Framework Preset**: Next.js
**Root Directory**: `./`（留空）
**Build Command**: `pnpm install && npx next build`
**Output Directory**: `.next`

点击 `Continue`

### 步骤 5: 配置环境变量

在 Vercel Dashboard 的 `Environment Variables` 部分配置以下变量：

#### 必需的环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `PGDATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://postgres:pass@host:5432/db` |
| `ENCRYPTION_KEY` | 加密密钥（64位十六进制） | `abcdef1234...` |
| `ENCRYPTION_SALT` | 加密盐值（32位十六进制） | `0123456789abcdef...` |
| `WALLET_PRIVATE_KEY` | 主钱包私钥 | `0x1234...` |
| `NEXT_PUBLIC_APP_URL` | 应用 URL | `https://your-app.vercel.app` |

#### 可选的环境变量

| 变量名 | 说明 |
|--------|------|
| `SOLANA_RPC_URL` | Solana RPC 节点 URL |
| `ETH_RPC_URL` | Ethereum RPC 节点 URL |
| `BSC_RPC_URL` | BSC RPC 节点 URL |
| `S3_ACCESS_KEY` | 对象存储访问密钥 |
| `S3_SECRET_KEY` | 对象存储密钥 |
| `S3_ENDPOINT` | 对象存储端点 |
| `S3_BUCKET` | 对象存储桶名 |

#### 生成加密密钥

```bash
# 生成 ENCRYPTION_KEY（64位十六进制）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成 ENCRYPTION_SALT（32位十六进制）
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 步骤 6: 部署

点击 `Deploy` 按钮，等待部署完成。

部署过程通常需要 2-5 分钟，包括：
- 安装依赖
- 构建应用
- 部署到 Vercel 的边缘网络

### 步骤 7: 验证部署

#### 7.1 检查部署状态

1. 在 Vercel Dashboard 查看部署状态
2. 确认所有步骤都成功完成

#### 7.2 测试应用

1. 访问部署的 URL（例如：`https://meme-master-pro.vercel.app`）
2. 测试基本功能：
   - 首页是否正常加载
   - API 路由是否响应
   - 数据库连接是否正常

#### 7.3 查看 API 响应

```bash
# 测试市场数据 API
curl https://meme-master-pro.vercel.app/api/market

# 测试钱包列表 API
curl https://meme-master-pro.vercel.app/api/wallets
```

### 步骤 8: 配置自定义域名（可选）

1. 在 Vercel Dashboard 中，点击 `Settings` > `Domains`
2. 点击 `Add`，输入您的域名（例如：`app.mmemaster.com`）
3. 按照提示配置 DNS 记录
4. 等待 SSL 证书自动颁发

## 部署检查清单

### 部署前检查

- [ ] 代码已推送到 GitHub
- [ ] `.gitignore` 正确配置（不要提交 `.env` 文件）
- [ ] 数据库已创建
- [ ] 数据库表结构已创建
- [ ] 所有必需的环境变量已配置
- [ ] TypeScript 编译无错误（`pnpm exec tsc --noEmit`）
- [ ] 本地测试通过

### 部署后检查

- [ ] 部署成功，无错误
- [ ] 首页可以正常访问
- [ ] API 路由响应正常
- [ ] 数据库连接正常
- [ ] 静态资源加载正常
- [ ] Console 中无 JavaScript 错误

## 常见问题

### Q1: 部署失败，提示 "PGDATABASE_URL not set"

**解决方法**：在 Vercel Dashboard 的 Environment Variables 中添加 `PGDATABASE_URL`。

### Q2: 部署成功，但 API 返回 500 错误

**解决方法**：
1. 检查 Vercel Dashboard 的 Function Logs
2. 确认数据库连接字符串正确
3. 确认数据库表结构已创建

### Q3: 无法访问数据库

**解决方法**：
1. 确认数据库已启动
2. 检查防火墙设置（允许 Vercel IP 访问）
3. 使用 Supabase/Neon/Vercel Postgres 等云数据库

### Q4: 构建失败，提示 "Out of memory"

**解决方法**：在 `vercel.json` 中增加内存限制（需要付费计划）。

### Q5: 热更新不生效

**解决方法**：Vercel 部署后需要重新构建，不会像本地开发环境那样热更新。

## 性能优化

### 1. 启用 Edge Functions

```json
// vercel.json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 60
    }
  }
}
```

### 2. 配置 CDN 区域

选择离用户最近的区域：
- 香港 (`hkg1`) - 适合中国大陆用户
- 新加坡 (`sin1`) - 适合东南亚用户
- 东京 (`tyo1`) - 适合日本用户

### 3. 启用 Image Optimization

Vercel 自动优化图片，无需额外配置。

### 4. 启用缓存

```typescript
// API 路由中设置缓存头
export async function GET() {
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  });
}
```

## 监控和日志

### Vercel Analytics

1. 在 Vercel Dashboard 中安装 Analytics
2. 查看访问量、页面加载时间等指标

### 查看日志

```bash
# 使用 Vercel CLI
vercel logs

# 查看特定函数的日志
vercel logs --filter=api/market
```

## 回滚部署

如果新部署出现问题，可以快速回滚到之前版本：

1. 进入 Vercel Dashboard
2. 点击 `Deployments`
3. 找到之前的成功部署
4. 点击 `...` > `Promote to Production`

## 成本

### Vercel 免费计划

- 每月 100GB 带宽
- 无限函数调用
- 6,000 分钟执行时间
- 100 个构建/月

### 付费计划

如果超出免费额度，可以考虑：
- **Pro Plan** ($20/月)：无限构建，更多带宽
- **Enterprise**：自定义配置

### 数据库成本

- **Vercel Postgres**: 免费计划 512MB
- **Supabase**: 免费计划 500MB
- **Neon**: 免费计划 0.5GB

## 安全建议

1. **环境变量**: 不要将敏感信息提交到 Git
2. **私有仓库**: 设置 GitHub 仓库为 Private
3. **API 密钥**: 定期轮换 API 密钥
4. **数据库**: 使用强密码，限制访问 IP
5. **HTTPS**: Vercel 自动提供 SSL 证书
6. **速率限制**: 在 API 路由中实现速率限制

## 下一步

部署完成后，可以考虑：

1. **设置 CI/CD**: 配置自动部署
2. **添加测试**: 集成单元测试和 E2E 测试
3. **配置监控**: 设置错误追踪（如 Sentry）
4. **优化 SEO**: 添加元数据和 sitemap
5. **多区域部署**: 在多个区域部署以提高性能

## 支持

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [项目 Issues](https://github.com/YOUR_USERNAME/meme-master-pro/issues)

---

**祝部署顺利！🚀**
