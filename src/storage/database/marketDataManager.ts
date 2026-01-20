import { eq, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  marketData,
  insertMarketDataSchema,
  updateMarketDataSchema,
} from "./shared/schema";
import type { MarketData, InsertMarketData, UpdateMarketData } from "./shared/schema";

export class MarketDataManager {
  async createMarketData(input: InsertMarketData): Promise<MarketData> {
    const db = await getDb();
    const validated = insertMarketDataSchema.parse(input);
    const [created] = await db.insert(marketData).values(validated).returning();
    return created;
  }

  async upsertMarketData(
    tokenSymbol: string,
    data: InsertMarketData
  ): Promise<MarketData> {
    const db = await getDb();
    const validated = insertMarketDataSchema.parse({ tokenSymbol, ...data });

    const [existing] = await db
      .select()
      .from(marketData)
      .where(eq(marketData.tokenSymbol, tokenSymbol))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(marketData)
        .set({ ...validated, updatedAt: new Date() })
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

    let query = db.select().from(marketData);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return query.limit(limit).offset(skip).orderBy(desc(marketData.updatedAt));
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
    data: UpdateMarketData
  ): Promise<MarketData | null> {
    const db = await getDb();
    const validated = updateMarketDataSchema.parse(data);
    const [updated] = await db
      .update(marketData)
      .set({ ...validated, updatedAt: new Date() })
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
      .orderBy(desc(marketData.volume24h))
      .limit(limit);
  }

  async getTopGainers(limit: number = 10): Promise<MarketData[]> {
    const db = await getDb();
    return db
      .select()
      .from(marketData)
      .orderBy(desc(marketData.change24h))
      .limit(limit);
  }

  async getTopLosers(limit: number = 10): Promise<MarketData[]> {
    const db = await getDb();
    return db
      .select()
      .from(marketData)
      .orderBy(marketData.change24h)
      .limit(limit);
  }
}

export const marketDataManager = new MarketDataManager();
