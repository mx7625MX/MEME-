import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  tokens,
  insertTokenSchema,
  updateTokenSchema,
} from "./shared/schema";
import type { Token, InsertToken, UpdateToken } from "./shared/schema";

export class TokenManager {
  async createToken(data: InsertToken): Promise<Token> {
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

    let query = db.select().from(tokens);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort by specified field
    switch (sortBy) {
      case "price":
        query = query.orderBy(desc(tokens.price));
        break;
      case "volume24h":
        query = query.orderBy(desc(tokens.volume24h));
        break;
      case "marketCap":
        query = query.orderBy(desc(tokens.marketCap));
        break;
      default:
        query = query.orderBy(desc(tokens.createdAt));
    }

    return query.limit(limit).offset(skip);
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

  async updateToken(id: string, data: UpdateToken): Promise<Token | null> {
    const db = await getDb();
    const validated = updateTokenSchema.parse(data);
    const [token] = await db
      .update(tokens)
      .set({ ...validated, updatedAt: new Date() })
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
        updatedAt: new Date(),
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
        .set({ isHot, updatedAt: new Date() })
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
