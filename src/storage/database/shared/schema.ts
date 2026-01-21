import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// 钱包表
// ============================================================================
export const wallets = pgTable(
  "wallets",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    chain: varchar("chain", { length: 20 }).notNull(), // solana, bsc, eth
    address: varchar("address", { length: 256 }).notNull().unique(),
    balance: decimal("balance", { precision: 30, scale: 18 }).notNull().default("0"),
    mnemonic: text("mnemonic"), // 加密存储
    privateKey: text("private_key"), // 加密存储
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    chainIdx: index("wallets_chain_idx").on(table.chain),
    addressIdx: index("wallets_address_idx").on(table.address),
  })
);

// ============================================================================
// 交易历史表
// ============================================================================
export const transactions = pgTable(
  "transactions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    walletId: varchar("wallet_id", { length: 36 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // buy, sell, launch, transfer
    chain: varchar("chain", { length: 20 }).notNull(),
    tokenAddress: varchar("token_address", { length: 256 }),
    tokenSymbol: varchar("token_symbol", { length: 32 }),
    amount: decimal("amount", { precision: 30, scale: 18 }).notNull(),
    price: decimal("price", { precision: 30, scale: 18 }),
    fee: decimal("fee", { precision: 30, scale: 18 }).default("0"),
    txHash: varchar("tx_hash", { length: 256 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, failed
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    walletIdx: index("transactions_wallet_idx").on(table.walletId),
    chainIdx: index("transactions_chain_idx").on(table.chain),
    typeIdx: index("transactions_type_idx").on(table.type),
    statusIdx: index("transactions_status_idx").on(table.status),
    createdAtIdx: index("transactions_created_at_idx").on(table.createdAt),
  })
);

// ============================================================================
// 代币信息表
// ============================================================================
export const tokens = pgTable(
  "tokens",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    chain: varchar("chain", { length: 20 }).notNull(),
    address: varchar("address", { length: 256 }).notNull().unique(),
    symbol: varchar("symbol", { length: 32 }).notNull(),
    name: varchar("name", { length: 128 }),
    decimals: integer("decimals").notNull().default(18),
    totalSupply: decimal("total_supply", { precision: 30, scale: 18 }),
    liquidity: decimal("liquidity", { precision: 30, scale: 18 }),
    marketCap: decimal("market_cap", { precision: 30, scale: 18 }),
    price: decimal("price", { precision: 30, scale: 18 }),
    priceChange24h: decimal("price_change_24h", { precision: 10, scale: 2 }),
    volume24h: decimal("volume_24h", { precision: 30, scale: 18 }),
    isHot: boolean("is_hot").default(false).notNull(),
    website: varchar("website", { length: 256 }),
    twitter: varchar("twitter", { length: 256 }),
    telegram: varchar("telegram", { length: 256 }),
    discord: varchar("discord", { length: 256 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    chainIdx: index("tokens_chain_idx").on(table.chain),
    symbolIdx: index("tokens_symbol_idx").on(table.symbol),
    isHotIdx: index("tokens_is_hot_idx").on(table.isHot),
  })
);

// ============================================================================
// 市场数据表（实时价格缓存）
// ============================================================================
export const marketData = pgTable(
  "market_data",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
    price: decimal("price", { precision: 30, scale: 18 }).notNull(),
    change24h: decimal("change_24h", { precision: 10, scale: 2 }),
    volume24h: decimal("volume_24h", { precision: 30, scale: 18 }),
    marketCap: decimal("market_cap", { precision: 30, scale: 18 }),
    isHot: boolean("is_hot").default(false).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    symbolIdx: index("market_data_symbol_idx").on(table.tokenSymbol),
    updatedAtIdx: index("market_data_updated_at_idx").on(table.updatedAt),
  })
);

// ============================================================================
// AI 情绪分析表
// ============================================================================
export const aiSentiments = pgTable(
  "ai_sentiments",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
    sentiment: varchar("sentiment", { length: 20 }).notNull(), // bullish, bearish, neutral
    score: decimal("score", { precision: 5, scale: 2 }).notNull(), // -1 to 1
    analysis: text("analysis"),
    source: varchar("source", { length: 64 }), // twitter, reddit, news, etc
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    symbolIdx: index("ai_sentiments_symbol_idx").on(table.tokenSymbol),
    sentimentIdx: index("ai_sentiments_sentiment_idx").on(table.sentiment),
    createdAtIdx: index("ai_sentiments_created_at_idx").on(table.createdAt),
  })
);

// ============================================================================
// 自动交易配置表
// ============================================================================
export const autoTrades = pgTable(
  "auto_trades",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    walletId: varchar("wallet_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    chain: varchar("chain", { length: 20 }).notNull(),
    tokenAddress: varchar("token_address", { length: 256 }),
    tokenSymbol: varchar("token_symbol", { length: 32 }),
    tradeType: varchar("trade_type", { length: 20 }).notNull(), // buy, sell, snipe
    condition: varchar("condition", { length: 32 }).notNull(), // price_above, price_below, volume_above, sentiment_change
    conditionValue: decimal("condition_value", { precision: 30, scale: 18 }),
    amount: decimal("amount", { precision: 30, scale: 18 }).notNull(),
    slippage: integer("slippage").default(5), // 滑点容忍度 %
    isEnabled: boolean("is_enabled").default(true).notNull(),
    executedCount: integer("executed_count").default(0).notNull(),
    lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    walletIdx: index("auto_trades_wallet_idx").on(table.walletId),
    chainIdx: index("auto_trades_chain_idx").on(table.chain),
    enabledIdx: index("auto_trades_enabled_idx").on(table.isEnabled),
  })
);

// ============================================================================
// 持仓管理表
// ============================================================================
export const portfolios = pgTable(
  "portfolios",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    walletId: varchar("wallet_id", { length: 36 }).notNull(),
    chain: varchar("chain", { length: 20 }).notNull(),
    tokenAddress: varchar("token_address", { length: 256 }).notNull(),
    tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
    tokenName: varchar("token_name", { length: 128 }),
    amount: decimal("amount", { precision: 30, scale: 18 }).notNull(), // 当前持有数量
    buyPrice: decimal("buy_price", { precision: 30, scale: 18 }).notNull(), // 买入价格
    buyAmount: decimal("buy_amount", { precision: 30, scale: 18 }).notNull(), // 买入金额（原生代币）
    currentPrice: decimal("current_price", { precision: 30, scale: 18 }), // 当前价格
    profitTarget: decimal("profit_target", { precision: 10, scale: 2 }), // 利润目标（百分比）
    stopLoss: decimal("stop_loss", { precision: 10, scale: 2 }), // 止损百分比
    totalInvested: decimal("total_invested", { precision: 30, scale: 18 }).notNull().default("0"), // 总投入
    totalValue: decimal("total_value", { precision: 30, scale: 18 }), // 当前价值
    profitLoss: decimal("profit_loss", { precision: 30, scale: 18 }), // 盈亏金额
    profitLossPercent: decimal("profit_loss_percent", { precision: 10, scale: 2 }), // 盈亏百分比
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, sold, closed
    
    // 自动闪电卖出配置
    autoSellEnabled: boolean("auto_sell_enabled").default(false), // 是否启用自动闪电卖出
    autoSellType: varchar("auto_sell_type", { length: 20 }), // profit, whale, both
    whaleBuyThreshold: decimal("whale_buy_threshold", { precision: 30, scale: 18 }), // 大额买入阈值
    autoSellPercentage: decimal("auto_sell_percentage", { precision: 5, scale: 2 }).default("100"), // 自动卖出比例（0-100）
    autoSellStatus: varchar("auto_sell_status", { length: 20 }).default("idle"), // idle, triggered, completed
    lastAutoSellAt: timestamp("last_auto_sell_at", { withTimezone: true }), // 最后一次自动卖出时间
    
    // 定时卖出配置（针对无人买入的情况）
    timedSellEnabled: boolean("timed_sell_enabled").default(false), // 是否启用定时卖出
    timedSellSeconds: integer("timed_sell_seconds").default(5), // 定时秒数（1, 5, 10, 30, 60等）
    timedSellScheduledAt: timestamp("timed_sell_scheduled_at", { withTimezone: true }), // 定时卖出的预定执行时间
    timedSellExecutedAt: timestamp("timed_sell_executed_at", { withTimezone: true }), // 定时卖出的实际执行时间
    
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    soldAt: timestamp("sold_at", { withTimezone: true }),
  },
  (table) => ({
    walletIdx: index("portfolios_wallet_idx").on(table.walletId),
    chainIdx: index("portfolios_chain_idx").on(table.chain),
    tokenIdx: index("portfolios_token_idx").on(table.tokenAddress),
    statusIdx: index("portfolios_status_idx").on(table.status),
    autoSellEnabledIdx: index("portfolios_auto_sell_enabled_idx").on(table.autoSellEnabled),
    timedSellEnabledIdx: index("portfolios_timed_sell_enabled_idx").on(table.timedSellEnabled),
  })
);

// ============================================================================
// 配置表
// ============================================================================
export const settings = pgTable(
  "settings",
  {
    key: varchar("key", { length: 128 }).primaryKey(),
    value: text("value").notNull(),
    category: varchar("category", { length: 64 }),
    description: text("description"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

// ============================================================================
// 流动性池表
// ============================================================================
export const liquidityPools = pgTable(
  "liquidity_pools",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    chain: varchar("chain", { length: 32 }).notNull(), // solana, eth, bsc
    tokenAddress: varchar("token_address", { length: 128 }).notNull(), // 发行的代币地址
    tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
    pairTokenSymbol: varchar("pair_token_symbol", { length: 32 }).notNull(), // SOL, ETH, BNB 等
    pairTokenAddress: varchar("pair_token_address", { length: 128 }).notNull(),
    dex: varchar("dex", { length: 64 }).notNull(), // raydium, uniswap, pancakeswap 等
    poolAddress: varchar("pool_address", { length: 128 }).unique().notNull(),
    tokenAmount: decimal("token_amount", { precision: 30, scale: 18 }).notNull(),
    pairTokenAmount: decimal("pair_token_amount", { precision: 30, scale: 18 }).notNull(),
    totalLiquidity: decimal("total_liquidity", { precision: 30, scale: 18 }).notNull(),
    lpTokenAmount: decimal("lp_token_amount", { precision: 30, scale: 18 }).notNull(),
    initialPrice: decimal("initial_price", { precision: 30, scale: 18 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"), // active, closed, migrated
    locked: boolean("locked").notNull().default(false), // 是否锁定流动性
    lockEndTime: timestamp("lock_end_time", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  },
  (table) => ({
    chainIdx: index("liquidity_pools_chain_idx").on(table.chain),
    tokenIdx: index("liquidity_pools_token_idx").on(table.tokenAddress),
    dexIdx: index("liquidity_pools_dex_idx").on(table.dex),
    statusIdx: index("liquidity_pools_status_idx").on(table.status),
  })
);

// ============================================================================
// 自动做市值策略表（用于 Bonding Curve 内盘阶段）
// ============================================================================
export const marketMakerStrategies = pgTable(
  "market_maker_strategies",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(), // 策略名称
    walletId: varchar("wallet_id", { length: 36 }).notNull().references(() => wallets.id), // 执行策略的钱包
    tokenAddress: varchar("token_address", { length: 128 }).notNull(), // 目标代币地址
    tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(), // 代币符号
    platform: varchar("platform", { length: 32 }).notNull(), // pump.fun, four.meme
    strategyType: varchar("strategy_type", { length: 32 }).notNull(), // price_floor, bot_snipe, price_stabilization, anti_dump
    isEnabled: boolean("is_enabled").notNull().default(true), // 是否启用
    status: varchar("status", { length: 32 }).notNull().default("idle"), // idle, running, paused, stopped
    // 策略参数
    params: jsonb("params").notNull().$type<Record<string, any>>().default({
      // 托底买入参数
      floorPricePercent: "95", // 价格下限（相对于当前市价的百分比）
      floorBuyAmount: "1000", // 每次托底买入数量
      floorMaxBuy: "10000", // 最大托底买入总量
      floorBought: "0", // 已买入数量

      // 机器人狙击参数
      snipeEnabled: false, // 是否启用狙击
      snipeDelay: 100, // 狙击延迟（毫秒）
      snipeAmount: "500", // 每次狙击买入数量
      snipeThreshold: "0.5", // 大额买入阈值（自动触发狙击，单位：SOL）

      // 价格稳定参数
      stabilizationEnabled: false, // 是否启用价格稳定
      stabilizationInterval: 10, // 买入间隔（秒）
      stabilizationAmount: "200", // 每次买入数量
      stabilizationTargetGrowth: "5", // 目标增长率（每分钟）

      // 防砸盘参数
      antiDumpEnabled: false, // 是否启用防砸盘
      dumpThreshold: "10000", // 大额卖出阈值
      antiDumpAmount: "2000", // 反制买入数量
    }),
    // 执行统计
    totalBuys: integer("total_buys").notNull().default(0), // 总买入次数
    totalBuyAmount: decimal("total_buy_amount", { precision: 30, scale: 18 }).notNull().default("0"), // 总买入数量
    totalSpent: decimal("total_spent", { precision: 30, scale: 18 }).notNull().default("0"), // 总花费
    // 风险控制
    maxSpend: decimal("max_spend", { precision: 30, scale: 18 }).notNull().default("100"), // 最大花费限制
    stopLossPercent: decimal("stop_loss_percent", { precision: 10, scale: 2 }).notNull().default("50"), // 止损百分比
    // 时间控制
    startAt: timestamp("start_at", { withTimezone: true }), // 开始时间
    endAt: timestamp("end_at", { withTimezone: true }), // 结束时间
    lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }), // 最后执行时间
    nextExecuteAt: timestamp("next_execute_at", { withTimezone: true }), // 下次执行时间
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  },
  (table) => ({
    walletIdx: index("mm_strategies_wallet_idx").on(table.walletId),
    tokenIdx: index("mm_strategies_token_idx").on(table.tokenAddress),
    platformIdx: index("mm_strategies_platform_idx").on(table.platform),
    statusIdx: index("mm_strategies_status_idx").on(table.status),
  })
);

// ============================================================================
// 机器人检测日志表
// ============================================================================
export const botDetectionLogs = pgTable(
  "bot_detection_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    walletAddress: varchar("wallet_address", { length: 128 }).notNull(), // 机器人钱包地址
    tokenAddress: varchar("token_address", { length: 128 }).notNull(), // 相关代币地址
    platform: varchar("platform", { length: 32 }).notNull(), // pump.fun, four.meme
    detectionType: varchar("detection_type", { length: 32 }).notNull(), // rapid_buy, large_buy, dump, pattern
    confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 检测置信度 (0-100)
    details: jsonb("details").notNull().$type<Record<string, any>>().default({
      // 交易详情
      txHash: "",
      amount: "0",
      price: "0",
      timestamp: "",
      // 检测详情
      reason: "",
      behavior: "", // sniping, scalping, dumping
      previousActions: [], // 历史行为记录
    }),
    actionTaken: varchar("action_taken", { length: 32 }).notNull(), // none, snipe_counter, blacklist, notify
    strategyId: varchar("strategy_id", { length: 36 }), // 关联的策略 ID
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    walletIdx: index("bot_logs_wallet_idx").on(table.walletAddress),
    tokenIdx: index("bot_logs_token_idx").on(table.tokenAddress),
    platformIdx: index("bot_logs_platform_idx").on(table.platform),
    detectionTypeIdx: index("bot_logs_detection_type_idx").on(table.detectionType),
    strategyIdx: index("bot_logs_strategy_idx").on(table.strategyId),
  })
);

// ============================================================================
// 策略组表（多策略协同管理）
// ============================================================================
export const marketMakerStrategyGroups = pgTable(
  "market_maker_strategy_groups",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    groupId: varchar("group_id", { length: 36 }), // 策略组ID（如果记录属于某个组）
    name: varchar("name", { length: 128 }), // 组名称或单个策略名称
    strategyId: varchar("strategy_id", { length: 36 }).references(() => marketMakerStrategies.id), // 关联的策略ID
    tokenAddress: varchar("token_address", { length: 128 }), // 目标代币地址
    tokenSymbol: varchar("token_symbol", { length: 32 }), // 代币符号
    coordinationType: varchar("coordination_type", { length: 32 }), // 协同类型：parallel, sequential, priority
    priority: integer("priority").default(0), // 优先级（用于顺序执行）
    isEnabled: boolean("is_enabled").notNull().default(true), // 是否启用
    coordinationRules: jsonb("coordination_rules").notNull().$type<Record<string, any>>().default({}), // 协同规则
    totalExecuted: integer("total_executed").notNull().default(0), // 总执行次数
    lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }), // 最后执行时间
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  },
  (table) => ({
    groupIdIdx: index("mm_groups_group_idx").on(table.groupId),
    strategyIdx: index("mm_groups_strategy_idx").on(table.strategyId),
    tokenIdx: index("mm_groups_token_idx").on(table.tokenAddress),
    isEnabledIdx: index("mm_groups_enabled_idx").on(table.isEnabled),
  })
);

// ============================================================================
// 审计日志表
// ============================================================================
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    event: varchar("event", { length: 128 }).notNull(),
    details: jsonb("details").notNull(),
    severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventIdx: index("audit_logs_event_idx").on(table.event),
    severityIdx: index("audit_logs_severity_idx").on(table.severity),
    timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
  })
);

// ============================================================================
// Zod Schemas for Validation
// ============================================================================
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Wallet schemas
export const insertWalletSchema = createCoercedInsertSchema(wallets).pick({
  name: true,
  chain: true,
  address: true,
  balance: true,
  mnemonic: true,
  privateKey: true,
  isActive: true,
  metadata: true,
});

export const updateWalletSchema = createCoercedInsertSchema(wallets)
  .pick({
    name: true,
    balance: true,
    isActive: true,
    metadata: true,
  })
  .partial();

// Transaction schemas
export const insertTransactionSchema = createCoercedInsertSchema(transactions).pick({
  walletId: true,
  type: true,
  chain: true,
  tokenAddress: true,
  tokenSymbol: true,
  amount: true,
  price: true,
  fee: true,
  txHash: true,
  status: true,
  metadata: true,
});

export const updateTransactionSchema = createCoercedInsertSchema(transactions)
  .pick({
    status: true,
    fee: true,
    txHash: true,
    metadata: true,
  })
  .partial();

// Token schemas
export const insertTokenSchema = createCoercedInsertSchema(tokens).pick({
  chain: true,
  address: true,
  symbol: true,
  name: true,
  decimals: true,
  totalSupply: true,
  liquidity: true,
  marketCap: true,
  price: true,
  priceChange24h: true,
  volume24h: true,
  isHot: true,
  website: true,
  twitter: true,
  telegram: true,
  discord: true,
  metadata: true,
});

export const updateTokenSchema = createCoercedInsertSchema(tokens)
  .pick({
    price: true,
    priceChange24h: true,
    volume24h: true,
    liquidity: true,
    marketCap: true,
    isHot: true,
    metadata: true,
  })
  .partial();

// Market Data schemas
export const insertMarketDataSchema = createCoercedInsertSchema(marketData).pick({
  tokenSymbol: true,
  price: true,
  change24h: true,
  volume24h: true,
  marketCap: true,
  isHot: true,
  metadata: true,
});

export const updateMarketDataSchema = createCoercedInsertSchema(marketData)
  .pick({
    price: true,
    change24h: true,
    volume24h: true,
    marketCap: true,
    isHot: true,
    metadata: true,
  })
  .partial();

// AI Sentiment schemas
export const insertAiSentimentSchema = createCoercedInsertSchema(aiSentiments).pick({
  tokenSymbol: true,
  sentiment: true,
  score: true,
  analysis: true,
  source: true,
  metadata: true,
});

// Auto Trade schemas
export const insertAutoTradeSchema = createCoercedInsertSchema(autoTrades).pick({
  walletId: true,
  name: true,
  chain: true,
  tokenAddress: true,
  tokenSymbol: true,
  tradeType: true,
  condition: true,
  conditionValue: true,
  amount: true,
  slippage: true,
  isEnabled: true,
  metadata: true,
});

export const updateAutoTradeSchema = createCoercedInsertSchema(autoTrades)
  .pick({
    name: true,
    condition: true,
    conditionValue: true,
    amount: true,
    slippage: true,
    isEnabled: true,
    metadata: true,
  })
  .partial();

// Portfolio schemas
export const insertPortfolioSchema = createCoercedInsertSchema(portfolios).pick({
  walletId: true,
  chain: true,
  tokenAddress: true,
  tokenSymbol: true,
  tokenName: true,
  amount: true,
  buyPrice: true,
  buyAmount: true,
  currentPrice: true,
  profitTarget: true,
  stopLoss: true,
  totalInvested: true,
  totalValue: true,
  profitLoss: true,
  profitLossPercent: true,
  status: true,
  autoSellEnabled: true,
  autoSellType: true,
  whaleBuyThreshold: true,
  autoSellPercentage: true,
  autoSellStatus: true,
  timedSellEnabled: true,
  timedSellSeconds: true,
  timedSellScheduledAt: true,
  timedSellExecutedAt: true,
  metadata: true,
});

export const updatePortfolioSchema = createCoercedInsertSchema(portfolios)
  .pick({
    amount: true,
    currentPrice: true,
    profitTarget: true,
    stopLoss: true,
    totalValue: true,
    profitLoss: true,
    profitLossPercent: true,
    status: true,
    autoSellEnabled: true,
    autoSellType: true,
    whaleBuyThreshold: true,
    autoSellPercentage: true,
    autoSellStatus: true,
    timedSellEnabled: true,
    timedSellSeconds: true,
    timedSellScheduledAt: true,
    timedSellExecutedAt: true,
    metadata: true,
  })
  .partial();

// Settings schemas
export const insertSettingSchema = createCoercedInsertSchema(settings).pick({
  key: true,
  value: true,
  category: true,
  description: true,
});

export const updateSettingSchema = createCoercedInsertSchema(settings)
  .pick({
    value: true,
    category: true,
    description: true,
  })
  .partial();

// Liquidity Pool schemas
export const insertLiquidityPoolSchema = createCoercedInsertSchema(liquidityPools).pick({
  chain: true,
  tokenAddress: true,
  tokenSymbol: true,
  pairTokenSymbol: true,
  pairTokenAddress: true,
  dex: true,
  poolAddress: true,
  tokenAmount: true,
  pairTokenAmount: true,
  totalLiquidity: true,
  lpTokenAmount: true,
  initialPrice: true,
  status: true,
  locked: true,
  lockEndTime: true,
  metadata: true,
});

export const updateLiquidityPoolSchema = createCoercedInsertSchema(liquidityPools)
  .pick({
    tokenAmount: true,
    pairTokenAmount: true,
    totalLiquidity: true,
    lpTokenAmount: true,
    status: true,
    locked: true,
    lockEndTime: true,
    updatedAt: true,
    metadata: true,
  })
  .partial();

// Market Maker Strategy schemas
export const insertMarketMakerStrategySchema = createCoercedInsertSchema(marketMakerStrategies).pick({
  name: true,
  walletId: true,
  tokenAddress: true,
  tokenSymbol: true,
  platform: true,
  strategyType: true,
  isEnabled: true,
  params: true,
  maxSpend: true,
  stopLossPercent: true,
  startAt: true,
  endAt: true,
});

export const updateMarketMakerStrategySchema = createCoercedInsertSchema(marketMakerStrategies)
  .pick({
    name: true,
    isEnabled: true,
    status: true,
    params: true,
    maxSpend: true,
    stopLossPercent: true,
    startAt: true,
    endAt: true,
    lastExecutedAt: true,
    nextExecuteAt: true,
    metadata: true,
  })
  .partial();

// Bot Detection Log schemas
export const insertBotDetectionLogSchema = createCoercedInsertSchema(botDetectionLogs).pick({
  walletAddress: true,
  tokenAddress: true,
  platform: true,
  detectionType: true,
  confidence: true,
  details: true,
  actionTaken: true,
  strategyId: true,
});

// Audit Logs schemas
export const insertAuditLogSchema = createCoercedInsertSchema(auditLogs).pick({
  event: true,
  details: true,
  severity: true,
});

// Strategy Group schemas
export const insertMarketMakerStrategyGroupSchema = createCoercedInsertSchema(marketMakerStrategyGroups).pick({
  groupId: true,
  name: true,
  strategyId: true,
  tokenAddress: true,
  tokenSymbol: true,
  coordinationType: true,
  priority: true,
  isEnabled: true,
  coordinationRules: true,
  metadata: true,
});

// ============================================================================
// TypeScript Types
// ============================================================================
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type UpdateWallet = z.infer<typeof updateWalletSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type UpdateToken = z.infer<typeof updateTokenSchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
export type UpdateMarketData = z.infer<typeof updateMarketDataSchema>;

export type AiSentiment = typeof aiSentiments.$inferSelect;
export type InsertAiSentiment = z.infer<typeof insertAiSentimentSchema>;

export type AutoTrade = typeof autoTrades.$inferSelect;
export type InsertAutoTrade = z.infer<typeof insertAutoTradeSchema>;
export type UpdateAutoTrade = z.infer<typeof updateAutoTradeSchema>;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type UpdatePortfolio = z.infer<typeof updatePortfolioSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type UpdateSetting = z.infer<typeof updateSettingSchema>;

export type LiquidityPool = typeof liquidityPools.$inferSelect;
export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;
export type UpdateLiquidityPool = z.infer<typeof updateLiquidityPoolSchema>;

export type MarketMakerStrategy = typeof marketMakerStrategies.$inferSelect;
export type InsertMarketMakerStrategy = z.infer<typeof insertMarketMakerStrategySchema>;
export type UpdateMarketMakerStrategy = z.infer<typeof updateMarketMakerStrategySchema>;

export type BotDetectionLog = typeof botDetectionLogs.$inferSelect;
export type InsertBotDetectionLog = z.infer<typeof insertBotDetectionLogSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
