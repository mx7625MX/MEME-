-- 添加自动交易配置表
CREATE TABLE IF NOT EXISTS auto_trades (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id VARCHAR(36) NOT NULL,
  name VARCHAR(128) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  token_address VARCHAR(256),
  token_symbol VARCHAR(32),
  trade_type VARCHAR(20) NOT NULL,
  "condition" VARCHAR(32) NOT NULL,
  condition_value DECIMAL(30, 18),
  amount DECIMAL(30, 18) NOT NULL,
  slippage INTEGER DEFAULT 5,
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  executed_count INTEGER DEFAULT 0 NOT NULL,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS auto_trades_wallet_idx ON auto_trades(wallet_id);
CREATE INDEX IF NOT EXISTS auto_trades_chain_idx ON auto_trades(chain);
CREATE INDEX IF NOT EXISTS auto_trades_enabled_idx ON auto_trades(is_enabled);

-- 添加流动性池表
CREATE TABLE IF NOT EXISTS liquidity_pools (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  chain VARCHAR(32) NOT NULL,
  token_address VARCHAR(128) NOT NULL,
  token_symbol VARCHAR(32) NOT NULL,
  pair_token_symbol VARCHAR(32) NOT NULL,
  pair_token_address VARCHAR(128) NOT NULL,
  dex VARCHAR(64) NOT NULL,
  pool_address VARCHAR(128) UNIQUE NOT NULL,
  token_amount DECIMAL(30, 18) NOT NULL,
  pair_token_amount DECIMAL(30, 18) NOT NULL,
  total_liquidity DECIMAL(30, 18) NOT NULL,
  lp_token_amount DECIMAL(30, 18) NOT NULL,
  initial_price DECIMAL(30, 18) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  locked BOOLEAN NOT NULL DEFAULT false,
  lock_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS liquidity_pools_chain_idx ON liquidity_pools(chain);
CREATE INDEX IF NOT EXISTS liquidity_pools_token_idx ON liquidity_pools(token_address);
CREATE INDEX IF NOT EXISTS liquidity_pools_dex_idx ON liquidity_pools(dex);
CREATE INDEX IF NOT EXISTS liquidity_pools_status_idx ON liquidity_pools(status);

-- 添加自动做市值策略表
CREATE TABLE IF NOT EXISTS market_maker_strategies (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  wallet_id VARCHAR(36) NOT NULL,
  token_address VARCHAR(128) NOT NULL,
  token_symbol VARCHAR(32) NOT NULL,
  platform VARCHAR(32) NOT NULL,
  strategy_type VARCHAR(32) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(32) NOT NULL DEFAULT 'idle',
  params JSONB NOT NULL DEFAULT '{
    "floorPricePercent": "95",
    "floorBuyAmount": "1000",
    "floorMaxBuy": "10000",
    "floorBought": "0",
    "snipeEnabled": false,
    "snipeDelay": 100,
    "snipeAmount": "500",
    "snipeThreshold": "0.5",
    "stabilizationEnabled": false,
    "stabilizationInterval": 10,
    "stabilizationAmount": "200",
    "stabilizationTargetGrowth": "5",
    "antiDumpEnabled": false,
    "dumpThreshold": "10000",
    "antiDumpAmount": "2000"
  }',
  total_buys INTEGER NOT NULL DEFAULT 0,
  total_buy_amount DECIMAL(30, 18) NOT NULL DEFAULT 0,
  total_spent DECIMAL(30, 18) NOT NULL DEFAULT 0,
  max_spend DECIMAL(30, 18) NOT NULL DEFAULT 100,
  stop_loss_percent DECIMAL(10, 2) NOT NULL DEFAULT 50,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  next_execute_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS mm_strategies_wallet_idx ON market_maker_strategies(wallet_id);
CREATE INDEX IF NOT EXISTS mm_strategies_token_idx ON market_maker_strategies(token_address);
CREATE INDEX IF NOT EXISTS mm_strategies_platform_idx ON market_maker_strategies(platform);
CREATE INDEX IF NOT EXISTS mm_strategies_status_idx ON market_maker_strategies(status);

-- 添加机器人检测日志表
CREATE TABLE IF NOT EXISTS bot_detection_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(128) NOT NULL,
  token_address VARCHAR(128) NOT NULL,
  platform VARCHAR(32) NOT NULL,
  detection_type VARCHAR(32) NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL,
  details JSONB NOT NULL DEFAULT '{
    "txHash": "",
    "amount": "0",
    "price": "0",
    "timestamp": "",
    "reason": "",
    "behavior": "",
    "previousActions": []
  }',
  action_taken VARCHAR(32) NOT NULL,
  strategy_id VARCHAR(36),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS bot_logs_wallet_idx ON bot_detection_logs(wallet_address);
CREATE INDEX IF NOT EXISTS bot_logs_token_idx ON bot_detection_logs(token_address);
CREATE INDEX IF NOT EXISTS bot_logs_platform_idx ON bot_detection_logs(platform);
CREATE INDEX IF NOT EXISTS bot_logs_detection_type_idx ON bot_detection_logs(detection_type);
CREATE INDEX IF NOT EXISTS bot_logs_strategy_idx ON bot_detection_logs(strategy_id);

-- 添加策略组表
CREATE TABLE IF NOT EXISTS market_maker_strategy_groups (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id VARCHAR(36),
  name VARCHAR(128),
  strategy_id VARCHAR(36),
  token_address VARCHAR(128),
  token_symbol VARCHAR(32),
  coordination_type VARCHAR(32),
  priority INTEGER DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  coordination_rules JSONB NOT NULL DEFAULT '{}',
  total_executed INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS mm_groups_group_idx ON market_maker_strategy_groups(group_id);
CREATE INDEX IF NOT EXISTS mm_groups_strategy_idx ON market_maker_strategy_groups(strategy_id);
CREATE INDEX IF NOT EXISTS mm_groups_token_idx ON market_maker_strategy_groups(token_address);
CREATE INDEX IF NOT EXISTS mm_groups_enabled_idx ON market_maker_strategy_groups(is_enabled);

-- 添加配置表
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(128) PRIMARY KEY,
  value TEXT NOT NULL,
  category VARCHAR(64),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
