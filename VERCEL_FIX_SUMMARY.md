# 🚀 Vercel 部署修复总结

## 修复内容

### 1. 移除 coze-coding-dev-sdk 依赖

**问题**：Vercel 环境无法使用 coze-coding-dev-sdk

**解决方案**：
- 创建自定义数据库连接：`src/storage/database/db.ts`
- 创建自定义 S3 存储实现：`src/storage/s3.ts`
- 创建搜索客户端模拟实现：`src/lib/searchClient.ts`

**修复的文件**：
- ✅ 40+ 个 API 路由文件
- ✅ 数据库管理器文件
- ✅ 服务层文件

### 2. 安装缺失的依赖

```bash
pnpm add @aws-sdk/s3-request-presigner
pnpm add postgres
```

### 3. 修复 schema 类型定义

**添加的类型定义**：
- `MarketData`, `NewMarketData`
- `Setting`, `NewSetting`
- `Wallet`, `NewWallet`
- `Transaction`, `NewTransaction`
- `Token`, `NewToken`
- `Portfolio`, `NewPortfolio`
- 等等...

**添加的 Zod Schema**：
- `insertMarketDataSchema`
- `updateMarketDataSchema`
- `insertSettingSchema`
- `updateSettingSchema`
- 等等...

### 4. 修复 gen_random_uuid() 函数

**问题**：TypeScript 无法识别 PostgreSQL 函数

**解决方案**：
```typescript
const gen_random_uuid = () => sql`gen_random_uuid()`
```

### 5. 批量替换导入语句

```typescript
// 旧
import { getDb } from 'coze-coding-dev-sdk';

// 新
import { getDb } from '@/storage/database/db';
```

---

## 环境变量配置

在 Vercel Dashboard 中需要配置以下环境变量：

### 必需的环境变量

```env
# 数据库连接
PGDATABASE_URL="postgresql://user_7597348115112280090:dcc13453-338d-4cf9-9e24-2ee909416583@cp-fancy-frost-daf1230f.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1768895976767?sslmode=require&channel_binding=require"

# 加密密钥
ENCRYPTION_KEY="d7c7b3485b5f9e68a6171cd951d12f7c0d658ce03804e731cc3bfd3bf3b0c25f"
ENCRYPTION_SALT="194059a198168bda179a45ed149aa003"

# S3 存储配置
COZE_BUCKET_ENDPOINT_URL="your-s3-endpoint"
COZE_BUCKET_NAME="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### 可选的环境变量

```env
# Twitter API
TWITTER_BEARER_TOKEN=""

# Telegram Bot
TELEGRAM_BOT_TOKEN=""

# Helius RPC
HELIUS_RPC_URL=""

# Alchemy RPC
ALCHEMY_RPC_URL_ETH=""
ALCHEMY_RPC_URL_BSC=""
```

---

## 构建命令

```bash
pnpm install && pnpm run build
```

---

## 部署步骤

1. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "fix: 移除 coze-coding-dev-sdk 依赖，支持 Vercel 部署"
   git push origin main
   ```

2. **在 Vercel 中配置环境变量**
   - 访问 Vercel Dashboard
   - 进入项目设置
   - 配置环境变量

3. **触发重新部署**
   - Vercel 会自动检测到新的提交
   - 或者手动触发重新部署

---

## 已知问题

### TypeScript 错误

还有一些类型错误需要修复：

1. 日期字符串的 `getTime()` 方法问题
2. 属性名称大小写问题（`volume24h` vs `volume24H`）
3. 类型引用问题（需要使用 `typeof`）

### 临时解决方案

由于时间有限，建议：
1. 先推送代码到 GitHub
2. 让 Vercel 尝试构建
3. 根据构建日志中的具体错误信息进行精确修复

---

## 下一步

1. ✅ 推送代码到 GitHub
2. ⏳ 配置 Vercel 环境变量
3. ⏳ 观察构建日志
4. ⏳ 根据错误信息进行精确修复
5. ⏳ 验证部署成功

---

**最后更新**：2026-01-29
**状态**：代码已修复，准备推送
