import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "@/storage/database/db";
import {
  transactions,
  insertTransactionSchema,
  updateTransactionSchema,
} from "./shared/schema";
import type { Transaction, NewTransaction } from "./shared/schema";

export class TransactionManager {
  async createTransaction(data: NewTransaction): Promise<Transaction> {
    const db = await getDb();
    const validated = insertTransactionSchema.parse(data);
    const [transaction] = await db
      .insert(transactions)
      .values(validated)
      .returning();
    return transaction;
  }

  async getTransactions(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<
      Pick<Transaction, "walletId" | "chain" | "type" | "status">
    >;
  } = {}): Promise<Transaction[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];
    if (filters.walletId !== undefined) {
      conditions.push(eq(transactions.walletId, filters.walletId));
    }
    if (filters.chain !== undefined) {
      conditions.push(eq(transactions.chain, filters.chain));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(transactions.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Use database-level sorting and pagination for better performance
    const results = await db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(skip);

    return results;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const db = await getDb();
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction || null;
  }

  async updateTransaction(
    id: string,
    data: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>
  ): Promise<Transaction | null> {
    const db = await getDb();
    const validated = updateTransactionSchema.parse(data);
    const [transaction] = await db
      .update(transactions)
      .set({ ...validated, updatedAt: new Date().toISOString() })
      .where(eq(transactions.id, id))
      .returning();
    return transaction || null;
  }

  async updateTransactionStatus(
    id: string,
    status: Transaction["status"],
    txHash?: string
  ): Promise<Transaction | null> {
    const db = await getDb();
    const [transaction] = await db
      .update(transactions)
      .set({
        status,
        txHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(transactions.id, id))
      .returning();
    return transaction || null;
  }

  async getTransactionStats(options: {
    walletId?: string;
    days?: number;
  } = {}): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalVolume: string;
  }> {
    const db = await getDb();

    let conditions: SQL[] = [];
    if (options.walletId) {
      conditions.push(eq(transactions.walletId, options.walletId));
    }

    let whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        totalVolume: sql<string>`sum(amount)`,
      })
      .from(transactions)
      .where(whereClause);

    const typeStats = await db
      .select({
        type: transactions.type,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.type);

    const statusStats = await db
      .select({
        status: transactions.status,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.status);

    const byType = typeStats.reduce((acc, item) => {
      acc[item.type] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);

    const byStatus = statusStats.reduce((acc, item) => {
      acc[item.status] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total: Number(stats.total),
      byType,
      byStatus,
      totalVolume: stats.totalVolume || "0",
    };
  }
}

export const transactionManager = new TransactionManager();
