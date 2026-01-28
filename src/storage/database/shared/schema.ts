import { pgTable, index, varchar, numeric, text, jsonb, timestamp, boolean, unique, integer, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 使用 sql 标签包装 PostgreSQL 函数
const gen_random_uuid = () => sql`gen_random_uuid()`



export const aiSentiments = pgTable("ai_sentiments", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
	sentiment: varchar({ length: 20 }).notNull(),
	score: numeric({ precision: 5, scale:  2 }).notNull(),
	analysis: text(),
	source: varchar({ length: 64 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ai_sentiments_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ai_sentiments_sentiment_idx").using("btree", table.sentiment.asc().nullsLast().op("text_ops")),
	index("ai_sentiments_symbol_idx").using("btree", table.tokenSymbol.asc().nullsLast().op("text_ops")),
]);

export const marketData = pgTable("market_data", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
	price: numeric({ precision: 30, scale:  18 }).notNull(),
	change24H: numeric("change_24h", { precision: 10, scale:  2 }),
	volume24H: numeric("volume_24h", { precision: 30, scale:  18 }),
	marketCap: numeric("market_cap", { precision: 30, scale:  18 }),
	isHot: boolean("is_hot").default(false).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("market_data_symbol_idx").using("btree", table.tokenSymbol.asc().nullsLast().op("text_ops")),
	index("market_data_updated_at_idx").using("btree", table.updatedAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const settings = pgTable("settings", {
	key: varchar({ length: 128 }).primaryKey().notNull(),
	value: text().notNull(),
	category: varchar({ length: 64 }),
	description: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 128 }).notNull(),
	chain: varchar({ length: 20 }).notNull(),
	address: varchar({ length: 256 }).notNull(),
	balance: numeric({ precision: 30, scale:  18 }).default('0').notNull(),
	mnemonic: text(),
	privateKey: text("private_key"),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("wallets_address_idx").using("btree", table.address.asc().nullsLast().op("text_ops")),
	index("wallets_chain_idx").using("btree", table.chain.asc().nullsLast().op("text_ops")),
	unique("wallets_address_unique").on(table.address),
]);

export const transactions = pgTable("transactions", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	walletId: varchar("wallet_id", { length: 36 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	chain: varchar({ length: 20 }).notNull(),
	tokenAddress: varchar("token_address", { length: 256 }),
	tokenSymbol: varchar("token_symbol", { length: 32 }),
	amount: numeric({ precision: 30, scale:  18 }).notNull(),
	price: numeric({ precision: 30, scale:  18 }),
	fee: numeric({ precision: 30, scale:  18 }).default('0'),
	txHash: varchar("tx_hash", { length: 256 }),
	status: varchar({ length: 20 }).default('pending').notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("transactions_chain_idx").using("btree", table.chain.asc().nullsLast().op("text_ops")),
	index("transactions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("transactions_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("transactions_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("transactions_wallet_idx").using("btree", table.walletId.asc().nullsLast().op("text_ops")),
]);

export const portfolios = pgTable("portfolios", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	walletId: varchar("wallet_id", { length: 36 }).notNull(),
	chain: varchar({ length: 20 }).notNull(),
	tokenAddress: varchar("token_address", { length: 256 }).notNull(),
	tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
	tokenName: varchar("token_name", { length: 128 }),
	amount: numeric({ precision: 30, scale:  18 }).notNull(),
	buyPrice: numeric("buy_price", { precision: 30, scale:  18 }).notNull(),
	buyAmount: numeric("buy_amount", { precision: 30, scale:  18 }).notNull(),
	currentPrice: numeric("current_price", { precision: 30, scale:  18 }),
	profitTarget: numeric("profit_target", { precision: 10, scale:  2 }),
	stopLoss: numeric("stop_loss", { precision: 10, scale:  2 }),
	totalInvested: numeric("total_invested", { precision: 30, scale:  18 }).default('0').notNull(),
	totalValue: numeric("total_value", { precision: 30, scale:  18 }),
	profitLoss: numeric("profit_loss", { precision: 30, scale:  18 }),
	profitLossPercent: numeric("profit_loss_percent", { precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	soldAt: timestamp("sold_at", { withTimezone: true, mode: 'string' }),
	autoSellType: varchar("auto_sell_type", { length: 20 }),
	lastAutoSellAt: timestamp("last_auto_sell_at", { withTimezone: true, mode: 'string' }),
	whaleBuyThreshold: numeric("whale_buy_threshold", { precision: 30, scale:  18 }),
	autoSellPercentage: numeric("auto_sell_percentage", { precision: 5, scale:  2 }).default('100'),
	autoSellEnabled: boolean("auto_sell_enabled").default(false),
	autoSellStatus: varchar("auto_sell_status", { length: 20 }).default('idle'),
	timedSellEnabled: boolean("timed_sell_enabled").default(false),
	timedSellExecutedAt: timestamp("timed_sell_executed_at", { withTimezone: true, mode: 'string' }),
	timedSellScheduledAt: timestamp("timed_sell_scheduled_at", { withTimezone: true, mode: 'string' }),
	timedSellSeconds: integer("timed_sell_seconds").default(5),
}, (table) => [
	index("portfolios_auto_sell_enabled_idx").using("btree", table.autoSellEnabled.asc().nullsLast().op("bool_ops")),
	index("portfolios_chain_idx").using("btree", table.chain.asc().nullsLast().op("text_ops")),
	index("portfolios_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("portfolios_timed_sell_enabled_idx").using("btree", table.timedSellEnabled.asc().nullsLast().op("bool_ops")),
	index("portfolios_token_idx").using("btree", table.tokenAddress.asc().nullsLast().op("text_ops")),
	index("portfolios_wallet_idx").using("btree", table.walletId.asc().nullsLast().op("text_ops")),
]);

export const privacyTransfers = pgTable("privacy_transfers", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	transferId: varchar("transfer_id", { length: 256 }).notNull(),
	fromWalletId: varchar("from_wallet_id", { length: 36 }).notNull(),
	toAddress: varchar("to_address", { length: 256 }).notNull(),
	amount: varchar({ length: 256 }).notNull(),
	tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
	chain: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('PENDING').notNull(),
	privacyScore: integer("privacy_score").default(0).notNull(),
	hopCount: integer("hop_count").default(0).notNull(),
	splitCount: integer("split_count").default(1).notNull(),
	totalFee: varchar("total_fee", { length: 256 }).default('0').notNull(),
	hopDetails: jsonb("hop_details"),
	trackingAnalysis: jsonb("tracking_analysis"),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	completedTime: timestamp("completed_time", { withTimezone: true, mode: 'string' }),
	errorMessage: varchar("error_message", { length: 512 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("privacy_transfers_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("privacy_transfers_from_wallet_id_idx").using("btree", table.fromWalletId.asc().nullsLast().op("text_ops")),
	index("privacy_transfers_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("privacy_transfers_transfer_id_idx").using("btree", table.transferId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.fromWalletId],
			foreignColumns: [wallets.id],
			name: "privacy_transfers_from_wallet_id_fkey"
		}),
	unique("privacy_transfers_transfer_id_key").on(table.transferId),
]);

export const marketMakerStrategies = pgTable("market_maker_strategies", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 128 }).notNull(),
	walletId: varchar("wallet_id", { length: 36 }).notNull(),
	tokenAddress: varchar("token_address", { length: 128 }).notNull(),
	tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
	platform: varchar({ length: 32 }).notNull(),
	strategyType: varchar("strategy_type", { length: 32 }).notNull(),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	status: varchar({ length: 32 }).default('idle').notNull(),
	params: jsonb().default({}).notNull(),
	totalBuys: integer("total_buys").default(0).notNull(),
	totalBuyAmount: numeric("total_buy_amount", { precision: 30, scale:  18 }).default('0').notNull(),
	totalSpent: numeric("total_spent", { precision: 30, scale:  18 }).default('0').notNull(),
	maxSpend: numeric("max_spend", { precision: 30, scale:  18 }).default('100').notNull(),
	stopLossPercent: numeric("stop_loss_percent", { precision: 10, scale:  2 }).default('50').notNull(),
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }),
	endAt: timestamp("end_at", { withTimezone: true, mode: 'string' }),
	lastExecutedAt: timestamp("last_executed_at", { withTimezone: true, mode: 'string' }),
	nextExecuteAt: timestamp("next_execute_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb().default({}),
});

export const botDetectionLogs = pgTable("bot_detection_logs", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	walletAddress: varchar("wallet_address", { length: 128 }).notNull(),
	tokenAddress: varchar("token_address", { length: 128 }).notNull(),
	platform: varchar({ length: 32 }).notNull(),
	detectionType: varchar("detection_type", { length: 32 }).notNull(),
	confidence: numeric({ precision: 5, scale:  2 }).notNull(),
	details: jsonb().default({}).notNull(),
	actionTaken: varchar("action_taken", { length: 32 }).default('none').notNull(),
	strategyId: varchar("strategy_id", { length: 36 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const autoTrades = pgTable("auto_trades", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	walletId: varchar("wallet_id", { length: 36 }).notNull(),
	name: varchar({ length: 128 }).notNull(),
	chain: varchar({ length: 20 }).notNull(),
	tokenAddress: varchar("token_address", { length: 256 }),
	tokenSymbol: varchar("token_symbol", { length: 32 }),
	tradeType: varchar("trade_type", { length: 20 }).notNull(),
	condition: varchar({ length: 32 }).notNull(),
	conditionValue: numeric("condition_value", { precision: 30, scale:  18 }),
	amount: numeric({ precision: 30, scale:  18 }).notNull(),
	slippage: integer().default(5),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	executedCount: integer("executed_count").default(0).notNull(),
	lastExecutedAt: timestamp("last_executed_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("auto_trades_chain_idx").using("btree", table.chain.asc().nullsLast().op("text_ops")),
	index("auto_trades_enabled_idx").using("btree", table.isEnabled.asc().nullsLast().op("bool_ops")),
	index("auto_trades_wallet_idx").using("btree", table.walletId.asc().nullsLast().op("text_ops")),
]);

export const tokens = pgTable("tokens", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	chain: varchar({ length: 20 }).notNull(),
	address: varchar({ length: 256 }).notNull(),
	symbol: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 128 }),
	decimals: integer().default(18).notNull(),
	totalSupply: numeric("total_supply", { precision: 30, scale:  18 }),
	liquidity: numeric({ precision: 30, scale:  18 }),
	marketCap: numeric("market_cap", { precision: 30, scale:  18 }),
	price: numeric({ precision: 30, scale:  18 }),
	priceChange24H: numeric("price_change_24h", { precision: 10, scale:  2 }),
	volume24H: numeric("volume_24h", { precision: 30, scale:  18 }),
	isHot: boolean("is_hot").default(false).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	website: varchar({ length: 256 }),
	twitter: varchar({ length: 256 }),
	telegram: varchar({ length: 256 }),
	discord: varchar({ length: 256 }),
	description: text(),
}, (table) => [
	index("tokens_chain_idx").using("btree", table.chain.asc().nullsLast().op("text_ops")),
	index("tokens_is_hot_idx").using("btree", table.isHot.asc().nullsLast().op("bool_ops")),
	index("tokens_symbol_idx").using("btree", table.symbol.asc().nullsLast().op("text_ops")),
	unique("tokens_address_unique").on(table.address),
]);

export const marketMakerStrategyGroups = pgTable("market_maker_strategy_groups", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	groupId: varchar("group_id", { length: 36 }),
	name: varchar({ length: 128 }),
	strategyId: varchar("strategy_id", { length: 36 }),
	tokenAddress: varchar("token_address", { length: 128 }),
	tokenSymbol: varchar("token_symbol", { length: 32 }),
	coordinationType: varchar("coordination_type", { length: 32 }),
	priority: integer().default(0),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	coordinationRules: jsonb("coordination_rules").default({}),
	totalExecuted: integer("total_executed").default(0),
	lastExecutedAt: timestamp("last_executed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb().default({}),
});

export const liquidityPools = pgTable("liquidity_pools", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	chain: varchar({ length: 32 }).notNull(),
	tokenAddress: varchar("token_address", { length: 128 }).notNull(),
	tokenSymbol: varchar("token_symbol", { length: 32 }).notNull(),
	pairTokenSymbol: varchar("pair_token_symbol", { length: 32 }).notNull(),
	pairTokenAddress: varchar("pair_token_address", { length: 128 }).notNull(),
	dex: varchar({ length: 64 }).notNull(),
	poolAddress: varchar("pool_address", { length: 128 }).notNull(),
	tokenAmount: numeric("token_amount", { precision: 30, scale:  18 }).notNull(),
	pairTokenAmount: numeric("pair_token_amount", { precision: 30, scale:  18 }).notNull(),
	totalLiquidity: numeric("total_liquidity", { precision: 30, scale:  18 }).notNull(),
	lpTokenAmount: numeric("lp_token_amount", { precision: 30, scale:  18 }).notNull(),
	initialPrice: numeric("initial_price", { precision: 30, scale:  18 }).notNull(),
	status: varchar({ length: 32 }).default('active').notNull(),
	locked: boolean().default(false).notNull(),
	lockEndTime: timestamp("lock_end_time", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb().default({}),
}, (table) => [
	index("liquidity_pools_chain_idx").using("btree", table.chain.asc().nullsLast().op("text_ops")),
	index("liquidity_pools_dex_idx").using("btree", table.dex.asc().nullsLast().op("text_ops")),
	index("liquidity_pools_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("liquidity_pools_token_idx").using("btree", table.tokenAddress.asc().nullsLast().op("text_ops")),
	unique("liquidity_pools_pool_address_key").on(table.poolAddress),
]);

export const privacyEventLogs = pgTable("privacy_event_logs", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	walletId: varchar("wallet_id", { length: 36 }),
	transferId: varchar("transfer_id", { length: 256 }),
	eventData: jsonb("event_data"),
	severity: varchar({ length: 20 }).default('INFO').notNull(),
	ipAddress: varchar("ip_address", { length: 64 }),
	userAgent: varchar("user_agent", { length: 512 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("privacy_event_logs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("privacy_event_logs_event_type_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("privacy_event_logs_transfer_id_idx").using("btree", table.transferId.asc().nullsLast().op("text_ops")),
	index("privacy_event_logs_wallet_id_idx").using("btree", table.walletId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [wallets.id],
			name: "privacy_event_logs_wallet_id_fkey"
		}),
]);

export const walletPrivacyScores = pgTable("wallet_privacy_scores", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	walletId: varchar("wallet_id", { length: 36 }).notNull(),
	privacyScore: integer("privacy_score").default(0).notNull(),
	riskLevel: varchar("risk_level", { length: 20 }).default('LOW').notNull(),
	trackingRiskScore: integer("tracking_risk_score").default(0).notNull(),
	hasDirectLinks: boolean("has_direct_links").default(false).notNull(),
	suspiciousPatterns: boolean("suspicious_patterns").default(false).notNull(),
	crossChainLinks: jsonb("cross_chain_links"),
	warnings: jsonb(),
	recommendations: jsonb(),
	analyzedAt: timestamp("analyzed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("wallet_privacy_scores_analyzed_at_idx").using("btree", table.analyzedAt.asc().nullsLast().op("timestamptz_ops")),
	index("wallet_privacy_scores_wallet_id_idx").using("btree", table.walletId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [wallets.id],
			name: "wallet_privacy_scores_wallet_id_fkey"
		}),
]);

export const privacyConfigs = pgTable("privacy_configs", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	walletId: varchar("wallet_id", { length: 36 }).notNull(),
	privacyLevel: varchar("privacy_level", { length: 20 }).default('MEDIUM').notNull(),
	enableAutoPrivacy: boolean("enable_auto_privacy").default(false).notNull(),
	maxHops: integer("max_hops").default(2).notNull(),
	splitCount: integer("split_count").default(2).notNull(),
	minDelayMs: integer("min_delay_ms").default(1000).notNull(),
	maxDelayMs: integer("max_delay_ms").default(5000).notNull(),
	useRandomPath: boolean("use_random_path").default(true).notNull(),
	avoidKnownTracking: boolean("avoid_known_tracking").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("privacy_configs_wallet_id_idx").using("btree", table.walletId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [wallets.id],
			name: "privacy_configs_wallet_id_fkey"
		}),
]);

export const hopWallets = pgTable("hop_wallets", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	address: varchar({ length: 256 }).notNull(),
	privateKey: text("private_key").notNull(),
	chain: varchar({ length: 20 }).notNull(),
	isTemporary: boolean("is_temporary").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	usedCount: integer("used_count").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	index("hop_wallets_address_idx").using("btree", table.address.asc().nullsLast().op("text_ops")),
	index("hop_wallets_chain_idx").using("btree", table.chain.asc().nullsLast().op("text_ops")),
	unique("hop_wallets_address_key").on(table.address),
]);

export const walletLinkage = pgTable("wallet_linkage", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	walletId: varchar("wallet_id", { length: 36 }).notNull(),
	linkedWalletAddress: varchar("linked_wallet_address", { length: 256 }).notNull(),
	linkageType: varchar("linkage_type", { length: 20 }).notNull(),
	confidence: integer().default(0).notNull(),
	firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	transactionCount: integer("transaction_count").default(1).notNull(),
	totalAmount: varchar("total_amount", { length: 256 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("wallet_linkage_linked_address_idx").using("btree", table.linkedWalletAddress.asc().nullsLast().op("text_ops")),
	index("wallet_linkage_wallet_id_idx").using("btree", table.walletId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [wallets.id],
			name: "wallet_linkage_wallet_id_fkey"
		}),
]);

// ==================== Type Definitions ====================

// AiSentiment types
export type AiSentiment = typeof aiSentiments.$inferSelect;
export type NewAiSentiment = typeof aiSentiments.$inferInsert;

// MarketData types
export type MarketData = typeof marketData.$inferSelect;
export type NewMarketData = typeof marketData.$inferInsert;

// Settings types
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

// Wallet types
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;

// Transaction types
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

// Portfolio types
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;

// PrivacyTransfer types
export type PrivacyTransfer = typeof privacyTransfers.$inferSelect;
export type NewPrivacyTransfer = typeof privacyTransfers.$inferInsert;

// MarketMakerStrategy types
export type MarketMakerStrategy = typeof marketMakerStrategies.$inferSelect;
export type NewMarketMakerStrategy = typeof marketMakerStrategies.$inferInsert;

// BotDetectionLog types
export type BotDetectionLog = typeof botDetectionLogs.$inferSelect;
export type NewBotDetectionLog = typeof botDetectionLogs.$inferInsert;

// AutoTrade types
export type AutoTrade = typeof autoTrades.$inferSelect;
export type NewAutoTrade = typeof autoTrades.$inferInsert;

// Token types
export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;

// MarketMakerStrategyGroup types
export type MarketMakerStrategyGroup = typeof marketMakerStrategyGroups.$inferSelect;
export type NewMarketMakerStrategyGroup = typeof marketMakerStrategyGroups.$inferInsert;

// LiquidityPool types
export type LiquidityPool = typeof liquidityPools.$inferSelect;
export type NewLiquidityPool = typeof liquidityPools.$inferInsert;

// PrivacyEventLog types
export type PrivacyEventLog = typeof privacyEventLogs.$inferSelect;
export type NewPrivacyEventLog = typeof privacyEventLogs.$inferInsert;

// WalletPrivacyScore types
export type WalletPrivacyScore = typeof walletPrivacyScores.$inferSelect;
export type NewWalletPrivacyScore = typeof walletPrivacyScores.$inferInsert;

// PrivacyConfig types
export type PrivacyConfig = typeof privacyConfigs.$inferSelect;
export type NewPrivacyConfig = typeof privacyConfigs.$inferInsert;

// HopWallet types
export type HopWallet = typeof hopWallets.$inferSelect;
export type NewHopWallet = typeof hopWallets.$inferInsert;

// WalletLinkage types
export type WalletLinkage = typeof walletLinkage.$inferSelect;
export type NewWalletLinkage = typeof walletLinkage.$inferInsert;

// ==================== Zod Schemas ====================

import { z } from 'zod';

// AiSentiment schemas
export const insertAiSentimentSchema = z.object({
  tokenSymbol: z.string().max(32),
  sentiment: z.string().max(20),
  score: z.string(),
  analysis: z.string().optional(),
  source: z.string().max(64).optional(),
  metadata: z.any().optional(),
});

// MarketData schemas
export const insertMarketDataSchema = z.object({
  tokenSymbol: z.string().max(32),
  price: z.string(),
  change24H: z.string().optional(),
  volume24H: z.string().optional(),
  marketCap: z.string().optional(),
  isHot: z.boolean().default(false),
  metadata: z.any().optional(),
});

export const updateMarketDataSchema = insertMarketDataSchema.partial();

// Settings schemas
export const insertSettingSchema = z.object({
  key: z.string().max(128),
  value: z.string(),
  category: z.string().max(64).optional(),
  description: z.string().optional(),
});

export const updateSettingSchema = insertSettingSchema.partial();

// Wallet schemas
export const insertWalletSchema = z.object({
  name: z.string().max(128),
  chain: z.string().max(20),
  address: z.string().max(256),
  balance: z.string().default('0'),
  mnemonic: z.string().optional(),
  privateKey: z.string().optional(),
  isActive: z.boolean().default(true),
  metadata: z.any().optional(),
});

export const updateWalletSchema = insertWalletSchema.partial();

// Transaction schemas
export const insertTransactionSchema = z.object({
  walletId: z.string().max(36),
  type: z.string().max(20),
  chain: z.string().max(20),
  tokenAddress: z.string().max(256).optional(),
  tokenSymbol: z.string().max(32).optional(),
  amount: z.string(),
  price: z.string().optional(),
  fee: z.string().default('0'),
  txHash: z.string().max(256).optional(),
  status: z.string().default('pending'),
  metadata: z.any().optional(),
});

export const updateTransactionSchema = insertTransactionSchema.partial();

// Portfolio schemas
export const insertPortfolioSchema = z.object({
  walletId: z.string().max(36),
  chain: z.string().max(20),
  tokenAddress: z.string().max(256),
  tokenSymbol: z.string().max(32),
  tokenName: z.string().max(128).optional(),
  amount: z.string(),
  buyPrice: z.string(),
  buyAmount: z.string(),
  currentPrice: z.string().optional(),
  profitTarget: z.string().optional(),
  stopLoss: z.string().optional(),
  totalInvested: z.string().default('0'),
  totalValue: z.string().optional(),
  profitLoss: z.string().optional(),
  profitLossPercent: z.string().optional(),
  status: z.string().default('active'),
  metadata: z.any().optional(),
  soldAt: z.string().optional(),
  autoSellType: z.string().optional(),
  lastAutoSellAt: z.string().optional(),
  whaleBuyThreshold: z.string().optional(),
  autoSellPercentage: z.string().default('100'),
  autoSellEnabled: z.boolean().default(false),
  autoSellStatus: z.string().default('idle'),
  timedSellEnabled: z.boolean().default(false),
  timedSellExecutedAt: z.string().optional(),
  timedSellScheduledAt: z.string().optional(),
  timedSellSeconds: z.number().default(5),
});

export const updatePortfolioSchema = insertPortfolioSchema.partial();

// Token schemas
export const insertTokenSchema = z.object({
  chain: z.string().max(20),
  address: z.string().max(256),
  symbol: z.string().max(32),
  name: z.string().max(128).optional(),
  decimals: z.number().default(18),
  totalSupply: z.string().optional(),
  liquidity: z.string().optional(),
  marketCap: z.string().optional(),
  price: z.string().optional(),
  priceChange24H: z.string().optional(),
  volume24H: z.string().optional(),
  isHot: z.boolean().default(false),
  metadata: z.any().optional(),
  website: z.string().max(256).optional(),
  twitter: z.string().max(256).optional(),
  telegram: z.string().max(256).optional(),
  discord: z.string().max(256).optional(),
  description: z.string().optional(),
});

export const updateTokenSchema = insertTokenSchema.partial();

// LiquidityPool schemas
export const insertLiquidityPoolSchema = z.object({
  chain: z.string().max(32),
  tokenAddress: z.string().max(128),
  tokenSymbol: z.string().max(32),
  pairTokenSymbol: z.string().max(32),
  pairTokenAddress: z.string().max(128),
  dex: z.string().max(64),
  poolAddress: z.string().max(128),
  tokenAmount: z.string(),
  pairTokenAmount: z.string(),
  totalLiquidity: z.string(),
  lpTokenAmount: z.string(),
  initialPrice: z.string(),
  status: z.string().default('active'),
  locked: z.boolean().default(false),
  lockEndTime: z.string().optional(),
  metadata: z.any().optional(),
});

export const updateLiquidityPoolSchema = insertLiquidityPoolSchema.partial();

// MarketMakerStrategy schemas
export const insertMarketMakerStrategySchema = z.object({
  name: z.string().max(128),
  walletId: z.string().max(36),
  tokenAddress: z.string().max(128),
  tokenSymbol: z.string().max(32),
  platform: z.string().max(32),
  strategyType: z.string().max(32),
  isEnabled: z.boolean().default(true),
  status: z.string().default('idle'),
  params: z.any().default({}),
  totalBuys: z.number().default(0),
  totalBuyAmount: z.string().default('0'),
  totalSpent: z.string().default('0'),
  maxSpend: z.string().default('100'),
  stopLossPercent: z.string().default('50'),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  lastExecutedAt: z.string().optional(),
  nextExecuteAt: z.string().optional(),
  metadata: z.any().optional(),
});

export const updateMarketMakerStrategySchema = insertMarketMakerStrategySchema.partial();

// MarketMakerStrategyGroup schemas
export const insertMarketMakerStrategyGroupSchema = z.object({
  groupId: z.string().max(36).optional(),
  name: z.string().max(128).optional(),
  strategyId: z.string().max(36).optional(),
  tokenAddress: z.string().max(128).optional(),
  tokenSymbol: z.string().max(32).optional(),
  coordinationType: z.string().max(32).optional(),
  priority: z.number().default(0),
  isEnabled: z.boolean().default(true),
  coordinationRules: z.any().default({}),
  totalExecuted: z.number().default(0),
  lastExecutedAt: z.string().optional(),
  metadata: z.any().optional(),
});

export const updateMarketMakerStrategyGroupSchema = insertMarketMakerStrategyGroupSchema.partial();

// AutoTrade schemas
export const insertAutoTradeSchema = z.object({
  walletId: z.string().max(36),
  name: z.string().max(128),
  chain: z.string().max(20),
  tokenAddress: z.string().max(256).optional(),
  tokenSymbol: z.string().max(32).optional(),
  tradeType: z.string().max(20),
  condition: z.string().max(32),
  conditionValue: z.string().optional(),
  amount: z.string(),
  slippage: z.number().default(5),
  isEnabled: z.boolean().default(true),
  executedCount: z.number().default(0),
  lastExecutedAt: z.string().optional(),
  metadata: z.any().optional(),
});

export const updateAutoTradeSchema = insertAutoTradeSchema.partial();

// PrivacyConfig schemas
export const insertPrivacyConfigSchema = z.object({
  walletId: z.string().max(36),
  privacyLevel: z.string().default('MEDIUM'),
  enableAutoPrivacy: z.boolean().default(false),
  maxHops: z.number().default(2),
  splitCount: z.number().default(2),
  minDelayMs: z.number().default(1000),
  maxDelayMs: z.number().default(5000),
  useRandomPath: z.boolean().default(true),
  avoidKnownTracking: z.boolean().default(true),
});

export const updatePrivacyConfigSchema = insertPrivacyConfigSchema.partial();

// HopWallet schemas
export const insertHopWalletSchema = z.object({
  address: z.string().max(256),
  privateKey: z.string(),
  chain: z.string().max(20),
  isTemporary: z.boolean().default(true),
  createdAt: z.string().optional(),
  expiresAt: z.string().optional(),
  usedCount: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const updateHopWalletSchema = insertHopWalletSchema.partial();


// BotDetectionLog schemas
export const insertBotDetectionLogSchema = z.object({
  walletAddress: z.string().max(128),
  tokenAddress: z.string().max(128),
  platform: z.string().max(32),
  detectionType: z.string().max(32),
  confidence: z.string(),
  details: z.any().default({}),
  actionTaken: z.string().max(32).default('none'),
  strategyId: z.string().max(36).optional(),
});

export const updateBotDetectionLogSchema = insertBotDetectionLogSchema.partial();
