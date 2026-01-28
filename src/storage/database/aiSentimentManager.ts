import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "@/storage/database/db";
import {
  aiSentiments,
  insertAiSentimentSchema,
} from "./shared/schema";
import type { AiSentiment, NewAiSentiment } from "./shared/schema";

export class AiSentimentManager {
  async createSentiment(data: NewAiSentiment): Promise<AiSentiment> {
    const db = await getDb();
    const validated = insertAiSentimentSchema.parse(data);
    const [sentiment] = await db
      .insert(aiSentiments)
      .values(validated)
      .returning();
    return sentiment;
  }

  async getSentiments(options: {
    skip?: number;
    limit?: number;
    tokenSymbol?: string;
    sentiment?: string;
    source?: string;
  } = {}): Promise<AiSentiment[]> {
    const { skip = 0, limit = 100, tokenSymbol, sentiment, source } = options;
    const db = await getDb();

    const conditions: SQL[] = [];
    if (tokenSymbol !== undefined) {
      conditions.push(eq(aiSentiments.tokenSymbol, tokenSymbol));
    }
    if (sentiment !== undefined) {
      conditions.push(eq(aiSentiments.sentiment, sentiment));
    }
    if (source !== undefined) {
      conditions.push(eq(aiSentiments.source, source));
    }

    let results: AiSentiment[];

    if (conditions.length > 0) {
      results = await db.select().from(aiSentiments).where(and(...conditions));
    } else {
      results = await db.select().from(aiSentiments);
    }

    // 在内存中排序和分页
    results.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return results.slice(skip, skip + limit);
  }

  async getLatestSentiment(tokenSymbol: string): Promise<AiSentiment | null> {
    const db = await getDb();
    const [sentiment] = await db
      .select()
      .from(aiSentiments)
      .where(eq(aiSentiments.tokenSymbol, tokenSymbol))
      .orderBy(desc(aiSentiments.createdAt))
      .limit(1);
    return sentiment || null;
  }

  async getSentimentHistory(
    tokenSymbol: string,
    limit: number = 100
  ): Promise<AiSentiment[]> {
    const db = await getDb();
    return db
      .select()
      .from(aiSentiments)
      .where(eq(aiSentiments.tokenSymbol, tokenSymbol))
      .orderBy(desc(aiSentiments.createdAt))
      .limit(limit);
  }

  async getSentimentStats(options: {
    tokenSymbol?: string;
    days?: number;
  } = {}): Promise<{
    bullish: number;
    bearish: number;
    neutral: number;
    avgScore: string;
  }> {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (options.tokenSymbol) {
      conditions.push(eq(aiSentiments.tokenSymbol, options.tokenSymbol));
    }

    let whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const stats = await db
      .select({
        sentiment: aiSentiments.sentiment,
        count: sql<number>`count(*)`,
      })
      .from(aiSentiments)
      .where(whereClause)
      .groupBy(aiSentiments.sentiment);

    const [avgResult] = await db
      .select({
        avgScore: sql<string>`avg(score)`,
      })
      .from(aiSentiments)
      .where(whereClause);

    const bullish = stats.find((s) => s.sentiment === "bullish")?.count || 0;
    const bearish = stats.find((s) => s.sentiment === "bearish")?.count || 0;
    const neutral = stats.find((s) => s.sentiment === "neutral")?.count || 0;

    return {
      bullish,
      bearish,
      neutral,
      avgScore: avgResult?.avgScore || "0",
    };
  }
}

export const aiSentimentManager = new AiSentimentManager();
