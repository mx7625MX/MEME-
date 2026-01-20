import { eq } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  settings,
  insertSettingSchema,
  updateSettingSchema,
} from "./shared/schema";
import type { Setting, InsertSetting, UpdateSetting } from "./shared/schema";

export class SettingsManager {
  async setSetting(data: InsertSetting): Promise<Setting> {
    const db = await getDb();
    const validated = insertSettingSchema.parse(data);
    
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, validated.key))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({
          value: validated.value,
          category: validated.category,
          description: validated.description,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, validated.key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values(validated).returning();
      return created;
    }
  }

  async getSetting(key: string): Promise<Setting | null> {
    const db = await getDb();
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || null;
  }

  async getSettingValue(key: string, defaultValue: string = ""): Promise<string> {
    const setting = await this.getSetting(key);
    return setting?.value ?? defaultValue;
  }

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    const db = await getDb();
    return db.select().from(settings).where(eq(settings.category, category));
  }

  async getAllSettings(): Promise<Setting[]> {
    const db = await getDb();
    return db.select().from(settings);
  }

  async updateSetting(key: string, data: UpdateSetting): Promise<Setting | null> {
    const db = await getDb();
    const validated = updateSettingSchema.parse(data);
    const [updated] = await db
      .update(settings)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(settings.key, key))
      .returning();
    return updated || null;
  }

  async deleteSetting(key: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(settings).where(eq(settings.key, key));
    return (result.rowCount ?? 0) > 0;
  }
}

export const settingsManager = new SettingsManager();
