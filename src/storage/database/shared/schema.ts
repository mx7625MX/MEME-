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

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type UpdateSetting = z.infer<typeof updateSettingSchema>;
