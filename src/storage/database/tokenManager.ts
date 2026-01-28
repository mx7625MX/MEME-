import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "@/storage/database/db";
import {
  tokens,
  insertTokenSchema,
  updateTokenSchema,
} from "./shared/schema";
import type { Token, NewToken } from "./shared/schema";

export class TokenManager {
  async createToken(data: NewToken): Promise<Token> {
    const db = await getDb();
    const validated = insertTokenSchema.parse(data);
    const [token] = await db.insert(tokens).values(validated).returning();
    return token;
  }

  async getTokens(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Token, "chain" | "isHot">>;
    sortBy?: "price" | "volume24h" | "marketCap" | "createdAt";
  } = {}): Promise<Token[]> {
    const { skip = 0, limit = 100, filters = {}, sortBy = "createdAt" } = options;
    const db = await getDb();

    const conditions: SQL[] = [];
    if (filters.chain !== undefined) {
      conditions.push(eq(tokens.chain, filters.chain));
    }
    if (filters.isHot !== undefined) {
      conditions.push(eq(tokens.isHot, filters.isHot));
    }

    let results: Token[];

    if (conditions.length > 0) {
      results = await db.select().from(tokens).where(and(...conditions));
    } else {
      results = await db.select().from(tokens);
    }

    // Sort by specified field
    switch (sortBy) {
      case "price":
        results.sort((a, b) => parseFloat(b.price || '0') - parseFloat(a.price || '0'));
        break;
      case "volume24h":
        results.sort((a, b) => parseFloat(b.volume24h || '0') - parseFloat(a.volume24h || '0'));
        break;
      case "marketCap":
        results.sort((a, b) => parseFloat(b.marketCap || '0') - parseFloat(a.marketCap || '0'));
        break;
      default:
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Apply pagination
    return results.slice(skip, skip + limit);
  }

  async getTokenById(id: string): Promise<Token | null> {
    const db = await getDb();
    const [token] = await db.select().from(tokens).where(eq(tokens.id, id));
    return token || null;
  }

  async getTokenByAddress(
    chain: string,
    address: string
  ): Promise<Token | null> {
    const db = await getDb();
    const [token] = await db
      .select()
      .from(tokens)
      .where(and(eq(tokens.chain, chain), eq(tokens.address, address)));
    return token || null;
  }

  async getTokenBySymbol(symbol: string): Promise<Token | null> {
    const db = await getDb();
    const [token] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.symbol, symbol));
    return token || null;
  }

  async updateToken(id: string, data: insertTokenSchema): Promise<Token | null> {
    const db = await getDb();
    const validated = updateTokenSchema.parse(data);
    const [token] = await db
      .update(tokens)
      .set({ ...validated, updatedAt: new Date().toISOString() })
      .where(eq(tokens.id, id))
      .returning();
    return token || null;
  }

  async updateTokenPrice(
    id: string,
    price: string,
    priceChange24h?: string
  ): Promise<Token | null> {
    const db = await getDb();
    const [token] = await db
      .update(tokens)
      .set({
        price,
        priceChange24h,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tokens.id, id))
      .returning();
    return token || null;
  }

  async setHotTokens(tokenIds: string[], isHot: boolean): Promise<void> {
    const db = await getDb();
    for (const id of tokenIds) {
      await db
        .update(tokens)
        .set({ isHot, updatedAt: new Date().toISOString() })
        .where(eq(tokens.id, id));
    }
  }

  async getHotTokens(limit: number = 10): Promise<Token[]> {
    const db = await getDb();
    return db
      .select()
      .from(tokens)
      .where(eq(tokens.isHot, true))
      .orderBy(desc(tokens.volume24h))
      .limit(limit);
  }
}

export const tokenManager = new TokenManager();
