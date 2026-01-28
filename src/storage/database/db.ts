import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';

let db: ReturnType<typeof drizzle> | null = null;

/**
 * 获取数据库连接实例
 * 支持多种环境变量名称（按优先级）：
 * 1. PGDATABASE_URL - 自定义配置
 * 2. POSTGRES_URL - Vercel Postgres 默认
 * 3. DATABASE_URL - 通用配置
 */
export async function getDb() {
  if (db) {
    return db;
  }

  // 支持多种环境变量名称
  const databaseUrl =
    process.env.PGDATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      '数据库连接字符串未设置。请在 Vercel Dashboard 中配置以下环境变量之一：\n' +
      '  - PGDATABASE_URL（推荐）\n' +
      '  - POSTGRES_URL（Vercel Postgres 默认）\n' +
      '  - DATABASE_URL（通用配置）\n\n' +
      '配置路径：Settings → Environment Variables → 添加上述变量之一'
    );
  }

  try {
    // 创建 PostgreSQL 连接
    const client = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // 创建 Drizzle 实例
    db = drizzle(client, { schema });

    return db;
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw new Error(
      `无法连接到数据库: ${error instanceof Error ? error.message : '未知错误'}\n` +
      '请检查数据库连接字符串是否正确配置。'
    );
  }
}
