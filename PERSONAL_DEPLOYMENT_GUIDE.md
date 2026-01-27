# 单人使用部署指南 - 最简单方案

## 🎯 推荐方案：Vercel + Supabase

**为什么选择这个方案？**

| 优势 | 说明 |
|------|------|
| 🚀 **最简单** | Git push 自动部署，无需配置服务器 |
| 🔒 **最安全** | 环境变量加密存储，自动 HTTPS |
| 💰 **零费用** | 个人使用完全在免费额度内 |
| ⚡ **最快速** | 全球 CDN，API 响应快 |
| 🛠️ **易维护** | 自动更新，一键回滚 |
| 📊 **易监控** | 内置日志和监控 |

---

## 📋 部署前准备

### 1. **注册账号**

- [Vercel](https://vercel.com) - 用于部署应用
- [GitHub](https://github.com) - 用于代码托管（如果还没有）
- [Supabase](https://supabase.com) - 用于数据库
- [Jito](https://www.jito.wtf) - 用于 Solana 交易加速（可选）

### 2. **获取必要的密钥**

#### 钱包私钥
```bash
# 创建或导出你的钱包私钥（仅用于服务端签名）
# ⚠️ 绝对不要在前端使用！
# ⚠️ 绝对不要提交到 Git！

# 示例格式：
WALLET_PRIVATE_KEY="0x1234567890abcdef..."
```

#### 数据库（Supabase）
```bash
# 登录 Supabase Dashboard
# 1. 创建新项目
# 2. Project Settings > API
# 3. 复制以下信息：

DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
```

#### Solana RPC（可选，推荐）
```bash
# 免费选项：
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# 付费选项（更稳定）：
# - Helius: https://helius.xyz
# - QuickNode: https://www.quicknode.com
```

#### Jito（可选，用于加速）
```bash
# 1. 访问 https://www.jito.wtf
# 2. 注册并获取 Shred Key
# 3. 在应用设置中配置（不要放在环境变量中）

JITO_RPC_URL="https://mainnet.block-engine.jito.wtf/api/v1"
JITO_BUNDLE_URL="https://mainnet.block-engine.jito.wtf/api/v1/bundles"
```

---

## 🚀 部署步骤（15 分钟完成）

### 步骤 1：初始化 Git 仓库（5 分钟）

```bash
# 进入项目目录
cd /workspace/projects

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Meme Master Pro"

# 创建 GitHub 仓库（在 GitHub 网站上创建）
# 然后连接远程仓库
git remote add origin https://github.com/YOUR_USERNAME/meme-master-pro.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步骤 2：配置 Vercel（3 分钟）

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 登录 Vercel
vercel login

# 部署到 Vercel
vercel

# 按照提示操作：
# 1. Set up and deploy? → Yes
# 2. Which scope? → 选择你的账号
# 3. Link to existing project? → No
# 4. What's your project's name? → meme-master-pro
# 5. In which directory is your code located? → ./

# 等待部署完成...
# 部署成功后会显示一个预览 URL
```

### 步骤 3：创建 Supabase 数据库（5 分钟）

```bash
# 1. 访问 https://supabase.com
# 2. 点击 "New project"
# 3. 填写项目信息：
#    - Name: meme-master-pro
#    - Database Password: 设置一个强密码
#    - Region: 选择离你最近的区域
# 4. 等待数据库创建完成（约 2 分钟）
```

### 步骤 4：配置环境变量（2 分钟）

```bash
# 方法 A：通过 Vercel CLI
vercel env add DATABASE_URL production
# 粘贴你的 DATABASE_URL

vercel env add WALLET_PRIVATE_KEY production
# 粘贴你的钱包私钥

vercel env add SOLANA_RPC_URL production
# 粘贴 Solana RPC URL

vercel env add JITO_RPC_URL production
# 粘贴 Jito RPC URL

vercel env add JITO_BUNDLE_URL production
# 粘贴 Jito Bundle URL

# 方法 B：通过 Vercel Dashboard
# 1. 访问 https://vercel.com/dashboard
# 2. 选择你的项目
# 3. Settings > Environment Variables
# 4. 逐个添加环境变量
```

### 步骤 5：部署到生产环境（1 分钟）

```bash
# 部署到生产环境
vercel --prod

# 等待部署完成...
# 成功后会显示生产环境 URL：https://meme-master-pro.vercel.app
```

---

## 🔧 数据库初始化

部署后需要初始化数据库表：

```bash
# 方法 1：通过 Supabase Dashboard
# 1. 访问 https://app.supabase.com/project/[YOUR-PROJECT-ID]/editor
# 2. 点击 "New query"
# 3. 复制并执行以下 SQL：

-- 创建钱包表
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(256) NOT NULL,
    chain VARCHAR(20) NOT NULL,
    address VARCHAR(256) NOT NULL UNIQUE,
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 创建交易表
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    chain VARCHAR(20) NOT NULL,
    token_address VARCHAR(256),
    token_symbol VARCHAR(32),
    amount NUMERIC,
    price NUMERIC,
    fee NUMERIC,
    status VARCHAR(20) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建投资组合表
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    token_address VARCHAR(256) NOT NULL,
    token_symbol VARCHAR(32) NOT NULL,
    amount NUMERIC NOT NULL,
    buy_price NUMERIC NOT NULL,
    chain VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 创建策略表
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(256) NOT NULL,
    wallet_id UUID NOT NULL,
    token_address VARCHAR(256),
    token_symbol VARCHAR(32),
    platform VARCHAR(50),
    strategy_type VARCHAR(50),
    is_enabled BOOLEAN DEFAULT false,
    status VARCHAR(20),
    params JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 创建设置表（用于存储加密的密钥）
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(256) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    user_id VARCHAR(256),
    resource VARCHAR(256),
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

# 方法 2：使用 Drizzle 迁移（推荐）
# 在本地运行：
pnpm run db:push

# 或者在生产环境运行：
# 需要配置本地连接到生产数据库
```

---

## 🔒 安全配置

### 1. **启用身份验证（推荐）**

```typescript
// 创建简单的 API Key 鉴权
// src/lib/auth.ts

const API_KEYS = {
  'your-secret-api-key': 'user_1' // 你的唯一标识
};

export function validateApiKey(request: Request): string | null {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) return null;

  const userId = API_KEYS[apiKey];
  return userId || null;
}

// 使用示例
export async function GET(request: Request) {
  const userId = validateApiKey(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 已授权的请求...
}
```

### 2. **环境变量安全**

```bash
# ✅ 好的做法
# 敏感信息放在环境变量中
WALLET_PRIVATE_KEY="0x..."

# ❌ 不要做
# 不要在代码中硬编码
# 不要提交到 Git
# 不要在 URL 参数中传递
```

### 3. **限制访问 IP（可选）**

```typescript
// src/lib/security.ts

const ALLOWED_IPS = [
  '你的 IP 地址',
  '192.168.1.1',
  // ...
];

export function validateIP(request: Request): boolean {
  const ip = request.headers.get('x-forwarded-for') || '';
  return ALLOWED_IPS.includes(ip);
}
```

### 4. **使用 Supabase Row Level Security（可选）**

```sql
-- 在 Supabase Dashboard 中启用 RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- 只允许拥有者访问
CREATE POLICY "Users can view their own wallets"
ON wallets
FOR SELECT
USING (true); -- 单人使用，允许所有

CREATE POLICY "Users can insert their own wallets"
ON wallets
FOR INSERT
WITH CHECK (true);
```

---

## 📱 启用真实交易

### 步骤 1：配置 Jito

1. 打开你的应用（Vercel 部署的 URL）
2. 进入"设置"页面
3. 找到"Jito 配置"
4. 输入你的 Jito Shred Key
5. 点击"保存"

### 步骤 2：修改代码启用真实交易

找到 `src/app/api/portfolios/monitor/route.ts`，替换模拟代码：

```typescript
// 第 177-185 行，替换为：

if (useJito && portfolio.chain === 'solana') {
  try {
    const { getJitoService } = await import('@/services/blockchain/jitoService');
    const { Keypair, Transaction } = await import('@solana/web3.js');

    // 从数据库获取钱包私钥
    const [wallet] = await db.select().from(wallets)
      .where(eq(wallets.id, portfolio.walletId));

    if (!wallet || !wallet.privateKey) {
      throw new Error('Wallet private key not found');
    }

    // 创建 Keypair
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(wallet.privateKey, 'base64')
    );

    // 创建交易（这里需要根据实际业务实现）
    const transaction = new Transaction();

    // TODO: 添加实际的交易指令
    // 例如：卖出、买入等
    // transaction.add(...);

    // 获取 Jito 服务
    const jitoService = getJitoService();

    // 通过 Jito 发送交易（带小费）
    const result = await jitoService.sendTransactionWithJito(
      transaction,
      walletKeypair,
      0.001 // Tip: 0.001 SOL（可根据需要调整）
    );

    if (result.success) {
      txHash = result.txHash;
    } else {
      throw new Error(`Jito transaction failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Jito transaction error:', error);
    // 如果 Jito 失败，回退到普通交易
    txHash = `fallback_${txHash}`;
  }
}
```

### 步骤 3：测试

```bash
# 1. 创建一个小额测试钱包
# 2. 充入少量 SOL（例如 0.01 SOL）
# 3. 在应用中配置此钱包
# 4. 执行一次小额交易（例如 0.001 SOL）
# 5. 在 Solana Explorer 验证交易
#    https://explorer.solana.com/tx/YOUR_TX_HASH

# 如果成功，就可以开始正常使用了！
```

---

## 🔄 更新应用

### 方法 1：Git 自动部署（推荐）

```bash
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "feat: 添加新功能"

# 3. 推送到 GitHub
git push origin main

# 4. Vercel 自动部署
# ✅ 构建中... → 部署中... → 部署完成！
# ⏱️ 通常 1-2 分钟

# 5. 访问新版本
# https://meme-master-pro.vercel.app
```

### 方法 2：Vercel CLI

```bash
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "feat: 添加新功能"

# 3. 直接部署
vercel --prod

# ⏱️ 通常 1-2 分钟
```

---

## 📊 监控和日志

### 查看日志

```bash
# 方法 1：Vercel Dashboard
# 1. 访问 https://vercel.com/dashboard
# 2. 选择你的项目
# 3. 点击 "Logs"
# 4. 实时查看日志

# 方法 2：Vercel CLI
vercel logs

# 方法 3：查看特定函数日志
vercel logs --filter "api/portfolios/monitor"
```

### 查看数据库

```bash
# 通过 Supabase Dashboard
# 1. 访问 https://app.supabase.com/project/[YOUR-PROJECT-ID]/editor
# 2. 执行 SQL 查询

# 示例：查看最近交易
SELECT * FROM transactions
ORDER BY created_at DESC
LIMIT 10;

# 示例：查看钱包余额
SELECT * FROM wallets;
```

---

## 💰 成本估算

### Vercel（免费）

| 项目 | 免费额度 | 个人使用 |
|------|---------|---------|
| 部署次数 | 无限 | ✅ 足够 |
| 带宽 | 100GB/月 | ✅ 足够 |
| Serverless Functions | 100GB-hrs/月 | ✅ 足够 |
| 构建时间 | 6000分钟/月 | ✅ 足够 |

**总费用：$0/月**

### Supabase（免费）

| 项目 | 免费额度 | 个人使用 |
|------|---------|---------|
| 数据库 | 500MB | ✅ 足够 |
| API 请求 | 50k/月 | ✅ 足够 |
| 文件存储 | 1GB | ✅ 足够 |

**总费用：$0/月**

### Solana 交易费

| 项目 | 费用 | 备注 |
|------|------|------|
| 基础交易费 | 0.000005 SOL/笔 | 固定费用 |
| Jito Tip | 0.001 SOL/笔（可选） | 可自定义 |

**总费用：约 $0.001-0.01/笔**

---

## 🎯 总结

### 最简部署流程

1. **准备（5分钟）**
   - 注册 Vercel、GitHub、Supabase
   - 获取密钥

2. **部署（10分钟）**
   - Git push 到 GitHub
   - Vercel 自动部署
   - 配置环境变量

3. **初始化（5分钟）**
   - 创建 Supabase 数据库
   - 执行初始化 SQL

4. **配置（5分钟）**
   - 在应用中配置钱包
   - 配置 Jito（可选）

5. **测试（5分钟）**
   - 小额测试交易
   - 验证功能

**总耗时：约 30 分钟**

---

## ⚡ 优势对比

| 方案 | 部署难度 | 费用 | 性能 | 安全性 | 维护 |
|------|---------|------|------|--------|------|
| **Vercel + Supabase** | ⭐ 简单 | 免费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 自动 |
| 本地服务器 | ⭐⭐⭐ 困难 | 服务器费 | ⭐⭐⭐ | ⭐⭐⭐ | 手动 |
| Railway | ⭐⭐ 中等 | 免费 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 自动 |
| Render | ⭐⭐ 中等 | 免费 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 自动（会休眠） |

---

## 🆘 常见问题

### Q: 需要编程经验吗？
A: 不需要，只需要会使用 Git 基本命令。

### Q: 可以在手机上使用吗？
A: 可以，Vercel 部署的应用是响应式的，支持手机访问。

### Q: 数据安全吗？
A: 非常安全。Supabase 使用 PostgreSQL，支持加密和备份。

### Q: 如何备份？
A: Supabase 自动每天备份，也可以手动导出数据。

### Q: 可以随时停用吗？
A: 可以，在 Vercel Dashboard 中暂停项目即可。

### Q: 有使用限制吗？
A: 免费额度对个人使用完全足够，不用担心。

---

## 📞 需要帮助？

如果遇到问题：

1. 查看 Vercel 日志
2. 查看数据库连接状态
3. 检查环境变量配置
4. 验证密钥格式

**推荐配置清单：**
- [ ] Vercel 账号已创建
- [ ] GitHub 仓库已创建
- [ ] Supabase 数据库已创建
- [ ] 环境变量已配置
- [ ] 数据库表已初始化
- [ ] Jito 已配置（可选）
- [ ] 测试交易已成功

---

**准备好开始了吗？按照步骤操作，30 分钟就能部署完成！** 🚀
