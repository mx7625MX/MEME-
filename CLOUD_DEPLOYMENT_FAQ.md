# 云平台部署 FAQ

## 1. 真正的数据交互 vs 沙箱测试

### ✅ 云平台部署可以实现真正的数据交互

在沙箱中，我们使用的是模拟数据（如随机生成的钱包地址、模拟交易）。但在云平台上部署后，可以实现：

#### 真实的区块链交互
```typescript
// 沙箱模拟
const mockAddress = `0x${Array.from({ length: 40 }, () =>
  Math.floor(Math.random() * 16).toString(16)
).join('')}`;

// 云平台真实交互（以 EVM 链为例）
import { ethers } from 'ethers';

// 连接真实区块链网络
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

// 创建真实钱包
const wallet = ethers.Wallet.createRandom();

// 发送真实交易
const tx = await wallet.sendTransaction({
  to: '0xRecipientAddress',
  value: ethers.parseEther('1.0')
});
```

#### 真实的数据存储
- PostgreSQL 存储真实的钱包数据、交易记录
- 对象存储存储用户上传的图片、文件
- 向量数据库存储知识库内容

#### 真实的 API 调用
- 集成大语言模型进行真实的 AI 分析
- 调用区块链 RPC 节点获取实时数据
- 对接真实的市场数据源

---

## 2. 数据安全保障方案

### 🔒 多层次安全架构

#### 2.1 前端安全

**永远不要在前端存储私钥！**

```tsx
// ❌ 错误：前端存储私钥
const wallet = new ethers.Wallet('0x123456...private_key');
localStorage.setItem('privateKey', privateKey);

// ✅ 正确：后端管理私钥
// 前端只发起请求，不接触私钥
const response = await fetch('/api/transactions/send', {
  method: 'POST',
  body: JSON.stringify({ to: '0x...', amount: '1.0' })
});
```

**安全措施：**
- 所有 API 请求必须通过 HTTPS
- 实现身份验证（JWT、Session）
- 敏感操作需要二次确认
- 前端只显示脱敏数据（如 `0x1234...5678`）

#### 2.2 后端安全

**私钥管理：**

```typescript
// ✅ 环境变量存储私钥（推荐）
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

// ✅ 更安全：使用密钥管理服务（生产环境推荐）
// AWS KMS, Azure Key Vault, HashiCorp Vault
const kms = new AWS.KMS();
const encryptedKey = await kms.decrypt({
  CiphertextBlob: Buffer.from(process.env.ENCRYPTED_PRIVATE_KEY, 'base64')
}).promise();
const privateKey = encryptedKey.Plaintext.toString();
```

**数据库加密：**

```sql
-- PostgreSQL 字段级加密
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  address TEXT NOT NULL,
  encrypted_private_key BYTEA,  -- 加密存储
  balance NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
```

```typescript
// 使用 pgcrypto 加密
import crypto from 'crypto';

function encrypt(text: string, key: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}
```

#### 2.3 云平台安全配置

**Vercel 安全设置：**
```json
{
  "build": {
    "env": {
      "DATABASE_URL": "@database-url",
      "PRIVATE_KEY": "@private-key",
      "API_KEY": "@api-key"
    }
  }
}
```

**Supabase 安全设置：**
- Row Level Security (RLS)：确保用户只能访问自己的数据
- PostgreSQL 加密：默认启用 TLS 加密
- 自动备份：每天备份，保留 7 天
- 物理隔离：数据库运行在隔离的 VPC 中

#### 2.4 区块链安全

**签名流程：**
```typescript
// 服务器端签名（最安全）
async function signTransaction(from: string, to: string, amount: string) {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);

  // 验证请求合法性
  if (!isValidRequest(from, to, amount)) {
    throw new Error('Invalid transaction');
  }

  // 构建交易
  const tx = {
    to,
    value: ethers.parseEther(amount),
    gasLimit: 21000
  };

  // 签名交易
  const signedTx = await wallet.signTransaction(tx);

  // 广播交易
  const txHash = await provider.sendTransaction(signedTx);

  return txHash;
}
```

**安全检查清单：**
- ✅ 私钥永不出现在前端代码
- ✅ 私钥存储在环境变量或密钥管理服务
- ✅ 所有交易都需要后端签名
- ✅ 敏感操作需要二次确认
- ✅ 数据库字段加密存储
- ✅ API 实现速率限制
- ✅ 日志记录但不记录敏感信息

---

## 3. 云平台的更新部署机制

### 🚀 Vercel 自动化部署（推荐）

#### 3.1 Git 集成部署

**工作流程：**
1. 在本地修改代码
2. 提交到 Git 仓库（GitHub/GitLab/Bitbucket）
3. Vercel 自动检测到推送
4. 自动构建新版本
5. 部署到生产环境
6. 零停机切换流量

```bash
# 开发流程
git add .
git commit -m "feat: 添加新功能"
git push origin main

# Vercel 自动开始部署
# ✅ 构建中...
# ✅ 部署中...
# ✅ 部署完成！
```

#### 3.2 零停机部署

```
旧版本 (v1)          新版本 (v2)
    │                    │
    ├─ 用户 A            ├─ 用户 A（已切换）
    ├─ 用户 B            ├─ 用户 B（已切换）
    ├─ 用户 C            ├─ 用户 C（已切换）
    └─ 用户 D            └─ 用户 D（已切换）

    ↓ 流量切换

    [v1 仍然运行]        [v2 接收新流量]
         ↓                    ↓
    [等待旧连接完成]    [新用户访问 v2]
         ↓                    ↓
    [v1 下线]            [v2 处理所有流量]
```

#### 3.3 一键回滚

如果新版本有问题，可以立即回滚：

```bash
# 通过 Vercel Dashboard
1. 进入项目页面
2. 点击 "Deployments"
3. 找到历史版本
4. 点击 "Promote to Production" 或 "Rollback"
```

#### 3.4 预览环境

每次推送新分支都会创建预览环境：

```bash
# 创建功能分支
git checkout -b feature/new-ui
git push origin feature/new-ui

# Vercel 自动创建预览 URL
# https://feature-new-ui-yourproject.vercel.app

# 团队成员可以预览新功能
# 测试通过后合并到主分支
```

### 🔄 其他云平台的更新机制

#### Railway（推荐后端服务）

```yaml
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**更新流程：**
1. Git push 触发自动部署
2. 自动停止旧版本
3. 启动新版本
4. 健康检查通过后接收流量

#### Render

```yaml
# render.yaml
services:
  - type: web
    name: meme-master-pro
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: postgresql-instance
          property: connectionString
```

### 📦 数据迁移策略

当需要更新数据库结构时：

```typescript
// 创建迁移脚本
// src/storage/database/migrations/20240127_add_description.ts

import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export async function up(db) {
  await db.execute(sql`
    ALTER TABLE tokens ADD COLUMN description TEXT;
  `);
}

export async function down(db) {
  await db.execute(sql`
    ALTER TABLE tokens DROP COLUMN description;
  `);
}
```

**部署流程：**
1. 在开发环境测试迁移
2. 备份生产数据库
3. 部署新版本（包含迁移脚本）
4. 自动执行数据库迁移
5. 验证数据完整性

### 🎯 推荐部署方案

**前端 + API Routes：Vercel**
- ✅ Next.js 原生支持
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 零配置部署
- ✅ 免费额度充足

**数据库：Supabase**
- ✅ PostgreSQL 托管
- ✅ 实时订阅
- ✅ 身份验证
- ✅ 存储服务
- ✅ 免费层 500MB

**密钥管理：Vercel Environment Variables**
- ✅ 加密存储
- ✅ 版本控制
- ✅ 环境隔离（开发/生产）

---

## 4. 部署到真实环境的步骤

### 第一步：准备环境变量

```bash
# .env.local（开发环境）
DATABASE_URL=postgresql://localhost:5432/meme_dev
PRIVATE_KEY=dev_private_key_only

# .env.production（生产环境 - 通过 Vercel Dashboard 配置）
DATABASE_URL=postgresql://user:pass@host:5432/meme_prod
PRIVATE_KEY=prod_private_key_very_secure
```

### 第二步：配置区块链连接

```typescript
// src/lib/blockchain.ts
import { ethers } from 'ethers';

export function getProvider() {
  const network = process.env.CHAIN_NETWORK || 'mainnet';
  const rpcUrl = process.env.RPC_URL;

  if (!rpcUrl) {
    throw new Error('RPC_URL not configured');
  }

  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getSigner() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not configured');
  }

  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}
```

### 第三步：实现真实交易

```typescript
// src/app/api/transactions/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSigner } from '@/lib/blockchain';

export async function POST(request: NextRequest) {
  try {
    const { to, amount } = await request.json();

    // 验证参数
    if (!to || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // 获取签名者（服务端私钥）
    const signer = getSigner();

    // 发送真实交易
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount)
    });

    // 等待交易确认
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      data: {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      }
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 第四步：部署到 Vercel

```bash
# 1. 安装 Vercel CLI
pnpm add -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 配置环境变量
vercel env add DATABASE_URL production
vercel env add PRIVATE_KEY production
vercel env add RPC_URL production

# 5. 部署到生产环境
vercel --prod
```

---

## 5. 总结

### ✅ 真正的数据交互
- 可以连接真实的区块链网络
- 可以存储真实的交易数据
- 可以调用真实的 API 服务

### ✅ 数据安全保障
- 私钥存储在环境变量或密钥管理服务
- 后端签名，前端不接触私钥
- 数据库字段级加密
- HTTPS 加密传输
- 二次确认敏感操作

### ✅ 灵活的更新机制
- Git 集成自动部署
- 零停机更新
- 一键回滚
- 预览环境测试
- 数据库迁移支持

**推荐方案：Vercel + Supabase**
- 前端和 API 部署在 Vercel
- 数据库使用 Supabase PostgreSQL
- 密钥通过 Vercel Environment Variables 管理
- 更新只需 git push

这样你就可以：
1. 实现真正的区块链交互
2. 保证交易和数据安全
3. 随时更新功能，无需中断服务
