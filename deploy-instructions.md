# 部署说明 - 当前状态和下一步

## ✅ 已完成的准备工作

1. **Vercel CLI 已安装**
   - 版本：50.6.2
   - 状态：已就绪

2. **Git 仓库已初始化**
   - 当前分支：main
   - 工作目录：干净（无未提交更改）

3. **项目文件已就绪**
   - package.json
   - next.config.ts
   - tsconfig.json
   - 所有源代码文件

---

## ⚠️ 需要用户完成的步骤

由于当前环境是沙箱，以下步骤需要你在**本地电脑或云平台**上完成：

### 步骤 1：注册账号（如果还没有）

1. **Vercel** - https://vercel.com
   - 免费账号
   - 用于部署应用

2. **GitHub** - https://github.com
   - 免费账号
   - 用于托管代码

3. **Supabase** - https://supabase.com
   - 免费账号
   - 用于数据库

### 步骤 2：将代码推送到 GitHub

在你的本地电脑上：

```bash
# 1. 克隆项目（如果有远程仓库）
git clone https://github.com/YOUR_USERNAME/meme-master-pro.git
cd meme-master-pro

# 如果没有远程仓库，创建一个新的
# 访问 https://github.com/new 创建仓库

# 2. 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/meme-master-pro.git

# 3. 推送代码
git push -u origin main
```

### 步骤 3：在本地电脑上部署到 Vercel

```bash
# 1. 安装 Vercel CLI（如果没有）
pnpm add -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署到 Vercel
cd /path/to/meme-master-pro
vercel

# 按照提示操作：
# - Set up and deploy? → Yes
# - Which scope? → 选择你的账号
# - Link to existing project? → No
# - What's your project's name? → meme-master-pro
# - In which directory is your code located? → ./
```

### 步骤 4：配置环境变量

在 Vercel Dashboard 中：

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. Settings > Environment Variables
4. 添加以下变量：

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
WALLET_PRIVATE_KEY="0x1234567890abcdef..."  # 你的钱包私钥
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
JITO_RPC_URL="https://mainnet.block-engine.jito.wtf/api/v1"
JITO_BUNDLE_URL="https://mainnet.block-engine.jito.wtf/api/v1/bundles"
```

### 步骤 5：部署到生产环境

```bash
# 在项目目录下
vercel --prod
```

### 步骤 6：初始化数据库

1. 访问 https://app.supabase.com
2. 创建新项目
3. 在 SQL Editor 中执行以下脚本：

```sql
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

-- 创建设置表
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
```

---

## 🎯 完成后的验证

部署完成后，访问你的应用：
```
https://meme-master-pro.vercel.app
```

检查：
- ✅ 页面可以正常访问
- ✅ 可以添加钱包
- ✅ 可以查看策略
- ✅ 可以执行操作

---

## 📝 下一步

部署成功后：

1. **配置 Jito**（可选，用于加速 Solana 交易）
   - 访问应用 > 设置
   - 输入 Jito Shred Key

2. **启用真实交易**
   - 修改代码，替换模拟调用
   - 参考 `JITO_INTEGRATION_STATUS.md`

3. **测试交易**
   - 创建测试钱包
   - 充入少量 SOL
   - 执行测试交易

---

## 🆘 需要帮助？

如果在部署过程中遇到问题：

1. 查看 Vercel 日志：`vercel logs`
2. 查看数据库连接：检查 Supabase 状态
3. 检查环境变量：确保所有变量都已配置

---

**预计完成时间：30 分钟**
