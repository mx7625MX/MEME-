import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';

let db: ReturnType<typeof drizzle> | null = null;

/**
 * 获取数据库连接实例
 * 使用环境变量 PGDATABASE_URL 连接到 PostgreSQL 数据库
 */
export async function getDb() {
  if (db) {
    return db;
  }

  const databaseUrl = process.env.PGDATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'PGDATABASE_URL 环境变量未设置。请在 Vercel Dashboard 中配置此环境变量。\n' +
      '配置路径：Settings → Environment Variables → 添加 PGDATABASE_URL'
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
      '请检查 PGDATABASE_URL 环境变量是否正确配置。'
    );
  }
}
