# Vercel 环境变量配置指南

## 🚨 重要提示

部署到 Vercel 前必须配置以下环境变量，否则应用无法正常工作！

## 必需的环境变量

### 1. 数据库连接（三选一）

Vercel 支持以下三种环境变量名称，按优先级排序：

```bash
# 选项 1（推荐）: PGDATABASE_URL
PGDATABASE_URL=postgresql://user:password@host:port/database

# 选项 2（Vercel Postgres 默认）: POSTGRES_URL
POSTGRES_URL=postgresql://user:password@host:port/database

# 选项 3（通用）: DATABASE_URL
DATABASE_URL=postgresql://user:password@host:port/database
```

**获取方式**：
- Vercel Postgres: 在 Vercel Dashboard → Storage → PostgreSQL → .env.local
- 自定义 PostgreSQL: 使用你的数据库连接字符串

### 2. 加密密钥（生产环境必需）

```bash
# 加密密钥（32 字符的十六进制字符串）
ENCRYPTION_KEY=your-32-char-hex-key-here

# 加密盐（16 字符的十六进制字符串）
ENCRYPTION_SALT=your-16-char-hex-salt-here
```

**⚠️ 重要**：
- **必须**在生产环境设置这两个变量
- 如果未设置，每次函数重启后随机密钥会变化
- 导致之前加密的钱包数据无法解密
- 这是严重的安全和功能问题

**生成方法**：

```bash
# 生成 ENCRYPTION_KEY（32 字节 = 64 个十六进制字符）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成 ENCRYPTION_SALT（16 字节 = 32 个十六进制字符）
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**示例**：
```bash
ENCRYPTION_KEY=1a2b3c4d5e6f78901a2b3c4d5e6f78901a2b3c4d5e6f78901a2b3c4d5e6f7890
ENCRYPTION_SALT=1a2b3c4d5e6f78901a2b3c4d5e6f7890
```

## 可选的环境变量

### 对象存储（上传代币图片）

```bash
# Coze 对象存储配置
COZE_BUCKET_ENDPOINT_URL=https://your-bucket-endpoint-url
COZE_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### 社交媒体 API（影响者分析）

```bash
# Twitter API
TWITTER_BEARER_TOKEN=your-twitter-bearer-token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# 豆包 API
DOUBAO_API_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/chat/completions
DOUBAO_API_KEY=your-doubao-api-key
```

### 区块链 RPC（可选）

```bash
# Ethereum RPC
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key

# BSC RPC
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# Solana RPC
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 功能开关

```bash
# 是否启用真实交易（默认: false）
ENABLE_REAL_TRANSACTIONS=false

# API 基础 URL（可选）
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

## 在 Vercel Dashboard 中配置环境变量

### 步骤

1. **访问 Vercel Dashboard**
   - 登录 https://vercel.com
   - 选择你的项目: Meme Master Pro

2. **进入环境变量设置**
   - 点击项目 → Settings
   - 左侧菜单选择 Environment Variables

3. **添加环境变量**
   - 点击 "Add New" 按钮
   - 输入变量名和值
   - 选择环境：Production, Preview, Development（建议全选）
   - 点击 "Save"

4. **必需添加的变量**：
   - ✅ `PGDATABASE_URL` 或 `POSTGRES_URL` 或 `DATABASE_URL`
   - ✅ `ENCRYPTION_KEY`（生产环境必需）
   - ✅ `ENCRYPTION_SALT`（生产环境必需）

5. **重新部署**
   - 添加环境变量后，需要重新部署
   - 进入 Deployments → 点击最新部署 → 点击 "Redeploy"

### 使用 CLI 配置

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 登录
vercel login

# 添加环境变量
vercel env add PGDATABASE_URL production
vercel env add ENCRYPTION_KEY production
vercel env add ENCRYPTION_SALT production

# 重新部署
vercel --prod
```

## 环境变量检查

部署后，可以通过以下 API 检查环境变量配置：

```bash
# 健康检查（显示环境信息）
curl https://meme-master-pro.vercel.app/api/health

# 响应示例
{
  "status": "ok",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "environment": "production"
}
```

## 常见问题

### Q1: 部署后创建钱包失败，提示"数据库连接失败"

**原因**: 数据库连接字符串未配置

**解决方案**:
1. 在 Vercel Dashboard → Settings → Environment Variables
2. 添加 `PGDATABASE_URL` 或 `POSTGRES_URL` 或 `DATABASE_URL`
3. 重新部署

### Q2: 创建的钱包无法导入/解密

**原因**: 加密密钥未配置或每次重启后变化

**解决方案**:
1. 在 Vercel Dashboard → Settings → Environment Variables
2. 添加 `ENCRYPTION_KEY` 和 `ENCRYPTION_SALT`
3. 使用固定的密钥（不要使用随机生成的）
4. 重新部署

### Q3: 代币图片上传失败

**原因**: 对象存储配置未设置

**解决方案**:
1. 在 Vercel Dashboard → Settings → Environment Variables
2. 添加 `COZE_BUCKET_ENDPOINT_URL`, `COZE_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
3. 重新部署

### Q4: 环境变量在不同环境（Production/Preview/Development）中不同

**解决方案**:
1. 在 Vercel Dashboard 中为每个环境单独配置
2. 使用 `vercel env add` 命令时指定环境
3. 或者使用 `.env.production`, `.env.preview`, `.env.development` 文件

### Q5: 如何测试环境变量是否正确配置？

**解决方案**:
```bash
# 测试数据库连接
curl -X POST https://meme-master-pro.vercel.app/api/init/migrate

# 测试创建钱包
curl -X POST https://meme-master-pro.vercel.app/api/wallets/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Wallet","chain":"eth"}'

# 查看日志
# Vercel Dashboard → 项目 → Functions → 查看函数日志
```

## 安全建议

### 1. 保护敏感信息

- ✅ 永远不要将 `.env` 文件提交到 Git
- ✅ 永远不要在代码中硬编码密钥
- ✅ 定期轮换密钥（加密密钥、API 密钥）
- ✅ 使用强密码和长随机密钥

### 2. 最小权限原则

- 数据库用户只授予必要的权限
- API 密钥使用最小权限
- 定期审查访问日志

### 3. 监控和审计

- 定期检查 Vercel 日志
- 监控异常活动
- 设置告警通知

## 环境变量模板

创建一个 `.env.example` 文件作为模板：

```bash
# 数据库连接（三选一）
PGDATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_URL=
DATABASE_URL=

# 加密密钥（生产环境必需）
ENCRYPTION_KEY=
ENCRYPTION_SALT=

# 对象存储
COZE_BUCKET_ENDPOINT_URL=
COZE_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# 社交媒体 API
TWITTER_BEARER_TOKEN=
TELEGRAM_BOT_TOKEN=
DOUBAO_API_ENDPOINT=
DOUBAO_API_KEY=

# 区块链 RPC
ETH_RPC_URL=
BSC_RPC_URL=
SOLANA_RPC_URL=

# 功能开关
ENABLE_REAL_TRANSACTIONS=false
NEXT_PUBLIC_API_URL=
```

## 部署检查清单

- [ ] 数据库连接字符串已配置
- [ ] 加密密钥已配置（ENCRYPTION_KEY, ENCRYPTION_SALT）
- [ ] 对象存储已配置（如果需要上传图片）
- [ ] 社交媒体 API 已配置（如果需要影响者分析）
- [ ] 环境变量已选择 Production 环境
- [ ] 已重新部署应用
- [ ] 测试健康检查 API
- [ ] 测试创建钱包 API
- [ ] 测试发射代币 API
- [ ] 检查 Vercel 日志是否有错误

## 参考链接

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**重要提醒**: 部署到生产环境前，请务必配置所有必需的环境变量！
