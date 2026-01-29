# 数据库迁移指南

## 问题：创建钱包失败

错误信息：
```
Failed query:insert into "wallets"(...) values (default, $1, $2, ...)
```

**原因**：数据库表结构未创建或与代码定义不一致。

---

## 🚨 快速解决

### 方案 1: 使用 Drizzle Kit 推送（推荐）

#### 本地推送

```bash
# 确保已安装依赖
pnpm install

# 推送 schema 到数据库
pnpm exec drizzle-kit push:pg --config=drizzle.config.ts
```

#### 在 Vercel 中推送

1. 拉取环境变量
   ```bash
   # 安装 Vercel CLI（如果未安装）
   npm i -g vercel

   # 登录
   vercel login

   # 拉取环境变量到本地
   vercel env pull .env.local
   ```

2. 运行迁移
   ```bash
   pnpm exec drizzle-kit push:pg --config=drizzle.config.ts
   ```

3. 推送更新
   ```bash
   vercel env push .env.local
   ```

---

### 方案 2: 使用 SQL 脚本（Vercel Postgres）

#### 步骤 1: 获取 SQL 脚本

从本文件的第 3 部分 "完整 SQL 脚本" 复制 SQL 代码。

#### 步骤 2: 在 Vercel Postgres 中执行

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 点击 `Storage` 标签
4. 点击您的 Postgres 数据库
5. 点击 `Query` 标签
6. 粘贴 SQL 脚本
7. 点击 `Run` 执行

---

### 方案 3: 使用 Vercel Postgres 控制台

1. 访问 Vercel Postgres 页面
2. 点击 `Console` 标签
3. 逐个执行以下命令验证表是否创建：

```sql
-- 检查 wallets 表
SELECT * FROM information_schema.tables WHERE table_name = 'wallets';

-- 检查表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'wallets';
```

---

## 📋 完整 SQL 脚本

将以下 SQL 脚本复制到 Vercel Postgres Query 控制台中执行：

```sql
-- ============================================
-- Meme Master Pro 数据库表结构
-- ============================================

-- 启用 UUID 扩展（如果未启用）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- wallets 表
-- ============================================
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

-- ============================================
-- transactions 表
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  token_address VARCHAR(256),
  token_symbol VARCHAR(32),
  amount NUMERIC(30, 18) NOT NULL,
  price NUMERIC(30, 18),
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash VARCHAR(256),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS transactions_wallet_id_idx ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS transactions_chain_idx ON transactions(chain);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);

-- ============================================
-- tokens 表
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  symbol VARCHAR(32) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  address VARCHAR(256),
  price NUMERIC(30, 18),
  price_change_24h NUMERIC(10, 4),
  volume_24h NUMERIC(30, 18),
  market_cap NUMERIC(30, 18),
  is_hot BOOLEAN DEFAULT false NOT NULL,
  has_liquidity BOOLEAN DEFAULT false NOT NULL,
  liquidity_pool_address VARCHAR(256),
  initial_price NUMERIC(30, 18),
  current_price NUMERIC(30, 18),
  description TEXT,
  image_url VARCHAR(512),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS tokens_chain_idx ON tokens(chain);
CREATE INDEX IF NOT EXISTS tokens_symbol_idx ON tokens(symbol);
CREATE INDEX IF NOT EXISTS tokens_address_idx ON tokens(address);

-- ============================================
-- portfolios 表
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id VARCHAR(36) NOT NULL,
  token_address VARCHAR(256) NOT NULL,
  token_symbol VARCHAR(32) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  amount NUMERIC(30, 18) NOT NULL,
  average_buy_price NUMERIC(30, 18) NOT NULL,
  current_price NUMERIC(30, 18),
  unrealized_pnl NUMERIC(30, 18) DEFAULT '0',
  status VARCHAR(20) DEFAULT 'holding',
  auto_sell_enabled BOOLEAN DEFAULT false NOT NULL,
  auto_sell_price_threshold NUMERIC(30, 18),
  auto_sell_percentage NUMERIC(5, 2) DEFAULT 100,
  auto_sell_status VARCHAR(20) DEFAULT 'idle',
  stop_loss_price NUMERIC(30, 18),
  take_profit_price NUMERIC(30, 18),
  entry_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  sold_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS portfolios_wallet_id_idx ON portfolios(wallet_id);
CREATE INDEX IF NOT EXISTS portfolios_token_address_idx ON portfolios(token_address);
CREATE INDEX IF NOT EXISTS portfolios_status_idx ON portfolios(status);

-- ============================================
-- settings 表
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(128) PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(64),
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- market_data 表
-- ============================================
CREATE TABLE IF NOT EXISTS market_data (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol VARCHAR(32) NOT NULL,
  price NUMERIC(30, 18),
  change_24h NUMERIC(10, 4),
  volume_24h NUMERIC(30, 18),
  market_cap NUMERIC(30, 18),
  is_hot BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS market_data_symbol_idx ON market_data(token_symbol);
CREATE INDEX IF NOT EXISTS market_data_updated_at_idx ON market_data(updated_at);

-- ============================================
-- ai_sentiments 表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_sentiments (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol VARCHAR(32) NOT NULL,
  sentiment VARCHAR(20) NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  analysis TEXT,
  source VARCHAR(64),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS ai_sentiments_created_at_idx ON ai_sentiments(created_at);
CREATE INDEX IF NOT EXISTS ai_sentiments_sentiment_idx ON ai_sentiments(sentiment);
CREATE INDEX IF NOT EXISTS ai_sentiments_symbol_idx ON ai_sentiments(token_symbol);

-- ============================================
-- privacy_configs 表
-- ============================================
CREATE TABLE IF NOT EXISTS privacy_configs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id VARCHAR(36) NOT NULL,
  privacy_level VARCHAR(20) NOT NULL,
  enable_auto_privacy BOOLEAN DEFAULT true NOT NULL,
  max_hops INTEGER DEFAULT 5 NOT NULL,
  split_count INTEGER DEFAULT 1 NOT NULL,
  min_delay_ms INTEGER DEFAULT 1000 NOT NULL,
  max_delay_ms INTEGER DEFAULT 5000 NOT NULL,
  use_random_path BOOLEAN DEFAULT true NOT NULL,
  avoid_known_tracking BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- ============================================
-- hop_wallets 表
-- ============================================
CREATE TABLE IF NOT EXISTS hop_wallets (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  address VARCHAR(256) NOT NULL UNIQUE,
  private_key TEXT NOT NULL,
  chain VARCHAR(20) NOT NULL,
  is_temporary BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  used_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS hop_wallets_address_idx ON hop_wallets(address);
CREATE INDEX IF NOT EXISTS hop_wallets_chain_idx ON hop_wallets(chain);

-- ============================================
-- privacy_transfers 表
-- ============================================
CREATE TABLE IF NOT EXISTS privacy_transfers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id VARCHAR(256) NOT NULL UNIQUE,
  from_wallet_id VARCHAR(36) NOT NULL,
  to_address VARCHAR(256) NOT NULL,
  amount VARCHAR(256) NOT NULL,
  token_symbol VARCHAR(32) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  privacy_score INTEGER DEFAULT 0 NOT NULL,
  hop_count INTEGER DEFAULT 0 NOT NULL,
  split_count INTEGER DEFAULT 1 NOT NULL,
  total_fee VARCHAR(256) DEFAULT '0' NOT NULL,
  hop_details JSONB,
  tracking_analysis JSONB,
  start_time TIMESTAMPTZ NOT NULL,
  completed_time TIMESTAMPTZ,
  error_message VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS privacy_transfers_created_at_idx ON privacy_transfers(created_at);
CREATE INDEX IF NOT EXISTS privacy_transfers_from_wallet_id_idx ON privacy_transfers(from_wallet_id);
CREATE INDEX IF NOT EXISTS privacy_transfers_status_idx ON privacy_transfers(status);
CREATE INDEX IF NOT EXISTS privacy_transfers_transfer_id_idx ON privacy_transfers(transfer_id);

-- ============================================
-- liquidity_pools 表
-- ============================================
CREATE TABLE IF NOT EXISTS liquidity_pools (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  chain VARCHAR(32) NOT NULL,
  token_address VARCHAR(128) NOT NULL,
  token_symbol VARCHAR(32) NOT NULL,
  pair_token_symbol VARCHAR(32) NOT NULL,
  pair_token_address VARCHAR(128) NOT NULL,
  dex VARCHAR(64) NOT NULL,
  pool_address VARCHAR(128) NOT NULL,
  token_amount NUMERIC(30, 18) NOT NULL,
  pair_token_amount NUMERIC(30, 18) NOT NULL,
  total_liquidity NUMERIC(30, 18) NOT NULL,
  lp_token_amount NUMERIC(30, 18) NOT NULL,
  initial_price NUMERIC(30, 18) NOT NULL,
  status VARCHAR(32) DEFAULT 'active' NOT NULL,
  locked BOOLEAN DEFAULT false NOT NULL,
  lock_end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS liquidity_pools_chain_idx ON liquidity_pools(chain);
CREATE INDEX IF NOT EXISTS liquidity_pools_dex_idx ON liquidity_pools(dex);
CREATE INDEX IF NOT EXISTS liquidity_pools_status_idx ON liquidity_pools(status);
CREATE INDEX IF NOT EXISTS liquidity_pools_token_idx ON liquidity_pools(token_address);

-- ============================================
-- market_maker_strategies 表
-- ============================================
CREATE TABLE IF NOT EXISTS market_maker_strategies (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  wallet_id VARCHAR(36) NOT NULL,
  token_address VARCHAR(128) NOT NULL,
  token_symbol VARCHAR(32) NOT NULL,
  platform VARCHAR(32) NOT NULL,
  strategy_type VARCHAR(32) NOT NULL,
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  status VARCHAR(32) DEFAULT 'idle' NOT NULL,
  params JSONB DEFAULT '{}' NOT NULL,
  total_buys INTEGER DEFAULT 0 NOT NULL,
  total_buy_amount NUMERIC(30, 18) DEFAULT '0' NOT NULL,
  total_spent NUMERIC(30, 18) DEFAULT '100' NOT NULL,
  max_spend NUMERIC(30, 18) DEFAULT '100' NOT NULL,
  stop_loss_percent NUMERIC(10, 2) DEFAULT '50' NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- ============================================
-- bot_detection_logs 表
-- ============================================
CREATE TABLE IF NOT EXISTS bot_detection_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(256) NOT NULL,
  platform VARCHAR(64) NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  confidence_score NUMERIC(5, 2) NOT NULL,
  detection_type VARCHAR(64) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS bot_detection_logs_wallet_address_idx ON bot_detection_logs(wallet_address);
CREATE INDEX IF NOT EXISTS bot_detection_logs_detected_at_idx ON bot_detection_logs(detected_at);

-- ============================================
-- wallet_linkage 表
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_linkage (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id VARCHAR(36) NOT NULL,
  linked_wallet_address VARCHAR(256) NOT NULL,
  linkage_type VARCHAR(20) NOT NULL,
  confidence INTEGER DEFAULT 0 NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  transaction_count INTEGER DEFAULT 1 NOT NULL,
  total_amount VARCHAR(256) DEFAULT '0' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS wallet_linkage_linked_address_idx ON wallet_linkage(linked_wallet_address);
CREATE INDEX IF NOT EXISTS wallet_linkage_wallet_id_idx ON wallet_linkage(wallet_id);

-- ============================================
-- audit_logs 表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36),
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64),
  entity_id VARCHAR(256),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- ============================================
-- 完成
-- ============================================
-- 所有表已创建完成
```

---

## ✅ 验证迁移

### 方法 1: 检查表是否存在

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

应该看到以下表：
- wallets
- transactions
- tokens
- portfolios
- settings
- market_data
- ai_sentiments
- privacy_configs
- hop_wallets
- privacy_transfers
- liquidity_pools
- market_maker_strategies
- bot_detection_logs
- wallet_linkage
- audit_logs

### 方法 2: 检查 wallets 表结构

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'wallets'
ORDER BY ordinal_position;
```

预期输出：
```
column_name   | data_type              | is_nullable | column_default
--------------|------------------------|-------------|---------------
id            | character varying(36)  | NO          | gen_random_uuid()
name          | character varying(128) | NO          | 
chain         | character varying(20)  | NO          | 
address       | character varying(256) | NO          | 
balance       | numeric(30,18)         | NO          | '0'
mnemonic      | text                   | YES         | 
private_key   | text                   | YES         | 
is_active     | boolean                | NO          | true
metadata      | jsonb                  | YES         | '{}'
created_at    | timestamp with time zone | NO        | NOW()
updated_at    | timestamp with time zone | YES        |
```

### 方法 3: 测试插入

```sql
INSERT INTO wallets (name, chain, address, balance, is_active)
VALUES ('Test Wallet', 'solana', 'TestAddress123', '0', true)
RETURNING id, name, chain, address;
```

如果成功插入，说明表结构正确。

---

## 🔧 常见问题

### Q1: 提示 "relation does not exist"

**原因**: 表未创建

**解决**: 运行完整的 SQL 脚本创建所有表

### Q2: 提示 "column does not exist"

**原因**: 表结构不完整或字段名错误

**解决**: 删除表后重新创建

```sql
DROP TABLE IF EXISTS wallets CASCADE;
```

然后重新运行 SQL 脚本

### Q3: 提示 "unique constraint violation"

**原因**: 尝试插入重复的 address

**解决**: 检查 address 是否已存在

```sql
SELECT * FROM wallets WHERE address = 'your-address';
```

### Q4: 提示 "permission denied"

**原因**: 数据库用户权限不足

**解决**: 确认数据库用户具有 CREATE TABLE 权限

---

## 🎯 执行步骤总结

### 最简单的方法（推荐）:

1. **在 Vercel Dashboard 中**
   - 访问 Storage > Postgres > Query
   - 复制上面的完整 SQL 脚本
   - 粘贴并点击 Run

2. **验证**
   - 执行验证 SQL 检查表是否创建

3. **测试**
   - 在应用中尝试创建钱包
   - 应该可以成功创建

---

**迁移完成后，立即可以创建钱包！** 🚀
