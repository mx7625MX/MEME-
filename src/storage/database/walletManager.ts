import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "@/storage/database/db";
import {
  wallets,
  insertWalletSchema,
} from "./shared/schema";
import type { Wallet, NewWallet } from "./shared/schema";

export class WalletManager {
  async createWallet(data: NewWallet): Promise<Wallet> {
    const db = await getDb();
    const validated = insertWalletSchema.parse(data);
    const [wallet] = await db.insert(wallets).values(validated).returning();
    return wallet;
  }

  async getWallets(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Wallet, "chain" | "isActive">>;
  } = {}): Promise<Wallet[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];
    if (filters.chain !== undefined) {
      conditions.push(eq(wallets.chain, filters.chain));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(wallets.isActive, filters.isActive));
    }

    let results: Wallet[];

    if (conditions.length > 0) {
      results = await db.select().from(wallets).where(and(...conditions));
    } else {
      results = await db.select().from(wallets);
    }

    // Sort and paginate in memory
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results.slice(skip, skip + limit);
  }

  async getWalletById(id: string): Promise<Wallet | null> {
    const db = await getDb();
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet || null;
  }

  async getWalletByAddress(address: string): Promise<Wallet | null> {
    const db = await getDb();
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, address));
    return wallet || null;
  }

  async updateWallet(id: string, data: insertWalletSchema): Promise<Wallet | null> {
    const db = await getDb();
    const validated = updateWalletSchema.parse(data);
    const [wallet] = await db
      .update(wallets)
      .set({ ...validated, updatedAt: new Date().toISOString().toISOString().toISOString() })
      .where(eq(wallets.id, id))
      .returning();
    return wallet || null;
  }

  async updateWalletBalance(
    id: string,
    balance: string
  ): Promise<Wallet | null> {
    const db = await getDb();
    const [wallet] = await db
      .update(wallets)
      .set({ balance, updatedAt: new Date().toISOString().toISOString().toISOString() })
      .where(eq(wallets.id, id))
      .returning();
    return wallet || null;
  }

  async deleteWallet(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(wallets).where(eq(wallets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getWalletStats(): Promise<{
    total: number;
    active: number;
    byChain: Record<string, number>;
  }> {
    const db = await getDb();

    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where is_active = true)`,
      })
      .from(wallets);

    const chainStats = await db
      .select({
        chain: wallets.chain,
        count: sql<number>`count(*)`,
      })
      .from(wallets)
      .groupBy(wallets.chain);

    const byChain = chainStats.reduce((acc, item) => {
      acc[item.chain] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total: Number(stats.total),
      active: Number(stats.active),
      byChain,
    };
  }
}

export const walletManager = new WalletManager();
