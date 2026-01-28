import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  marketData,
  insertMarketDataSchema,
  updateMarketDataSchema,
} from "./shared/schema";
import type { MarketData, NewMarketData, insertMarketDataSchema } from "./shared/schema";

export class MarketDataManager {
  async createMarketData(input: NewMarketData): Promise<MarketData> {
    const db = await getDb();
    const validated = insertMarketDataSchema.parse(input);
    const [created] = await db.insert(marketData).values(validated).returning();
    return created;
  }

  async upsertMarketData(
    tokenSymbol: string,
    data: NewMarketData
  ): Promise<MarketData> {
    const db = await getDb();
    const validated = insertMarketDataSchema.parse({ ...data, tokenSymbol });

    const [existing] = await db
      .select()
      .from(marketData)
      .where(eq(marketData.tokenSymbol, tokenSymbol))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(marketData)
        .set({ ...validated, updatedAt: new Date().toISOString().toISOString().toISOString() })
        .where(eq(marketData.tokenSymbol, tokenSymbol))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(marketData).values(validated).returning();
      return created;
    }
  }

  async getMarketData(options: {
    skip?: number;
    limit?: number;
    tokenSymbol?: string;
    isHot?: boolean;
  } = {}): Promise<MarketData[]> {
    const { skip = 0, limit = 100, tokenSymbol, isHot } = options;
    const db = await getDb();

    const conditions: SQL[] = [];
    if (tokenSymbol !== undefined) {
      conditions.push(eq(marketData.tokenSymbol, tokenSymbol));
    }
    if (isHot !== undefined) {
      conditions.push(eq(marketData.isHot, isHot));
    }

    let results: MarketData[];

    if (conditions.length > 0) {
      results = await db.select().from(marketData).where(and(...conditions));
    } else {
      results = await db.select().from(marketData);
    }

    // 在内存中排序和分页
    results.sort((a, b) => {
      const aTime = a.updatedAt?.getTime() || 0;
      const bTime = b.updatedAt?.getTime() || 0;
      return bTime - aTime;
    });
    return results.slice(skip, skip + limit);
  }

  async getMarketDataBySymbol(tokenSymbol: string): Promise<MarketData | null> {
    const db = await getDb();
    const [data] = await db
      .select()
      .from(marketData)
      .where(eq(marketData.tokenSymbol, tokenSymbol));
    return data || null;
  }

  async updateMarketData(
    tokenSymbol: string,
    data: insertMarketDataSchema
  ): Promise<MarketData | null> {
    const db = await getDb();
    const validated = updateMarketDataSchema.parse(data);
    const [updated] = await db
      .update(marketData)
      .set({ ...validated, updatedAt: new Date().toISOString().toISOString().toISOString() })
      .where(eq(marketData.tokenSymbol, tokenSymbol))
      .returning();
    return updated || null;
  }

  async getHotTokens(limit: number = 10): Promise<MarketData[]> {
    const db = await getDb();
    return db
      .select()
      .from(marketData)
      .where(eq(marketData.isHot, true))
      .orderBy(desc(marketData.volume24H))
      .limit(limit);
  }

  async getTopGainers(limit: number = 10): Promise<MarketData[]> {
    const db = await getDb();
    return db
      .select()
      .from(marketData)
      .orderBy(desc(marketData.change24H))
      .limit(limit);
  }

  async getTopLosers(limit: number = 10): Promise<MarketData[]> {
    const db = await getDb();
    return db
      .select()
      .from(marketData)
      .orderBy(marketData.change24H)
      .limit(limit);
  }
}

export const marketDataManager = new MarketDataManager();
