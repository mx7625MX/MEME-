import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

/**
 * 数据库迁移 API
 * 自动创建所有数据库表结构
 */
export async function POST(request: NextRequest) {
  try {
    const databaseUrl =
      process.env.PGDATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: '数据库连接字符串未设置',
        },
        { status: 500 }
      );
    }

    // 创建连接
    const client = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const db = drizzle(client);

    // 创建扩展
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 创建所有表
    const tables = [
      // wallets 表
      `CREATE TABLE IF NOT EXISTS wallets (
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
      )`,

      // transactions 表
      `CREATE TABLE IF NOT EXISTS transactions (
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
      )`,

      // tokens 表
      `CREATE TABLE IF NOT EXISTS tokens (
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
      )`,

      // portfolios 表
      `CREATE TABLE IF NOT EXISTS portfolios (
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
      )`,

      // settings 表
      `CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(128) PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        category VARCHAR(64),
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,

      // market_data 表
      `CREATE TABLE IF NOT EXISTS market_data (
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
      )`,

      // ai_sentiments 表
      `CREATE TABLE IF NOT EXISTS ai_sentiments (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        token_symbol VARCHAR(32) NOT NULL,
        sentiment VARCHAR(20) NOT NULL,
        score NUMERIC(5, 2) NOT NULL,
        analysis TEXT,
        source VARCHAR(64),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,

      // privacy_configs 表
      `CREATE TABLE IF NOT EXISTS privacy_configs (
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
      )`,

      // hop_wallets 表
      `CREATE TABLE IF NOT EXISTS hop_wallets (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        address VARCHAR(256) NOT NULL UNIQUE,
        private_key TEXT NOT NULL,
        chain VARCHAR(20) NOT NULL,
        is_temporary BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMPTZ,
        used_count INTEGER DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL
      )`,

      // privacy_transfers 表
      `CREATE TABLE IF NOT EXISTS privacy_transfers (
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
      )`,

      // liquidity_pools 表
      `CREATE TABLE IF NOT EXISTS liquidity_pools (
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
      )`,

      // market_maker_strategies 表
      `CREATE TABLE IF NOT EXISTS market_maker_strategies (
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
      )`,

      // bot_detection_logs 表
      `CREATE TABLE IF NOT EXISTS bot_detection_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(256) NOT NULL,
        platform VARCHAR(64) NOT NULL,
        detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        confidence_score NUMERIC(5, 2) NOT NULL,
        detection_type VARCHAR(64) NOT NULL,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,

      // wallet_linkage 表
      `CREATE TABLE IF NOT EXISTS wallet_linkage (
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
      )`,

      // audit_logs 表
      `CREATE TABLE IF NOT EXISTS audit_logs (
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
      )`,
    ];

    // 创建索引
    const indexes = [
      `CREATE INDEX IF NOT EXISTS wallets_address_idx ON wallets(address)`,
      `CREATE INDEX IF NOT EXISTS wallets_chain_idx ON wallets(chain)`,
      `CREATE INDEX IF NOT EXISTS transactions_wallet_id_idx ON transactions(wallet_id)`,
      `CREATE INDEX IF NOT EXISTS transactions_chain_idx ON transactions(chain)`,
      `CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status)`,
      `CREATE INDEX IF NOT EXISTS tokens_chain_idx ON tokens(chain)`,
      `CREATE INDEX IF NOT EXISTS tokens_symbol_idx ON tokens(symbol)`,
      `CREATE INDEX IF NOT EXISTS tokens_address_idx ON tokens(address)`,
      `CREATE INDEX IF NOT EXISTS portfolios_wallet_id_idx ON portfolios(wallet_id)`,
      `CREATE INDEX IF NOT EXISTS portfolios_token_address_idx ON portfolios(token_address)`,
      `CREATE INDEX IF NOT EXISTS portfolios_status_idx ON portfolios(status)`,
      `CREATE INDEX IF NOT EXISTS market_data_symbol_idx ON market_data(token_symbol)`,
      `CREATE INDEX IF NOT EXISTS market_data_updated_at_idx ON market_data(updated_at)`,
      `CREATE INDEX IF NOT EXISTS ai_sentiments_created_at_idx ON ai_sentiments(created_at)`,
      `CREATE INDEX IF NOT EXISTS ai_sentiments_sentiment_idx ON ai_sentiments(sentiment)`,
      `CREATE INDEX IF NOT EXISTS ai_sentiments_symbol_idx ON ai_sentiments(token_symbol)`,
      `CREATE INDEX IF NOT EXISTS hop_wallets_address_idx ON hop_wallets(address)`,
      `CREATE INDEX IF NOT EXISTS hop_wallets_chain_idx ON hop_wallets(chain)`,
      `CREATE INDEX IF NOT EXISTS privacy_transfers_created_at_idx ON privacy_transfers(created_at)`,
      `CREATE INDEX IF NOT EXISTS privacy_transfers_from_wallet_id_idx ON privacy_transfers(from_wallet_id)`,
      `CREATE INDEX IF NOT EXISTS privacy_transfers_status_idx ON privacy_transfers(status)`,
      `CREATE INDEX IF NOT EXISTS privacy_transfers_transfer_id_idx ON privacy_transfers(transfer_id)`,
      `CREATE INDEX IF NOT EXISTS liquidity_pools_chain_idx ON liquidity_pools(chain)`,
      `CREATE INDEX IF NOT EXISTS liquidity_pools_dex_idx ON liquidity_pools(dex)`,
      `CREATE INDEX IF NOT EXISTS liquidity_pools_status_idx ON liquidity_pools(status)`,
      `CREATE INDEX IF NOT EXISTS liquidity_pools_token_idx ON liquidity_pools(token_address)`,
      `CREATE INDEX IF NOT EXISTS bot_detection_logs_wallet_address_idx ON bot_detection_logs(wallet_address)`,
      `CREATE INDEX IF NOT EXISTS bot_detection_logs_detected_at_idx ON bot_detection_logs(detected_at)`,
      `CREATE INDEX IF NOT EXISTS wallet_linkage_linked_address_idx ON wallet_linkage(linked_wallet_address)`,
      `CREATE INDEX IF NOT EXISTS wallet_linkage_wallet_id_idx ON wallet_linkage(wallet_id)`,
      `CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at)`,
    ];

    // 执行创建表
    for (const tableSQL of tables) {
      await client.query(tableSQL);
    }

    // 执行创建索引
    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }

    await client.end();

    return NextResponse.json({
      success: true,
      message: '数据库迁移完成，所有表已创建',
      data: {
        tablesCreated: tables.length,
        indexesCreated: indexes.length,
      },
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '迁移失败',
      },
      { status: 500 }
    );
  }
}
