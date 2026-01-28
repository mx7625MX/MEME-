import { getDb } from '@/storage/database/db';
import { settings } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/encryption';

/**
 * 内部使用：获取完整的解密 Jito 密钥（仅服务端使用，不暴露给前端）
 * 
 * ⚠️ 重要：此函数只能在后端 API 内部使用，严禁将结果返回给前端
 */
export async function getDecryptedJitoKey(): Promise<string | null> {
  try {
    const db = await getDb();
    const [jitoConfig] = await db.select().from(settings).where(eq(settings.key, 'jito_shred_key'));
    
    if (!jitoConfig || !jitoConfig.value) {
      return null;
    }
    
    return decrypt(jitoConfig.value);
  } catch (error) {
    console.error('Error decrypting Jito key:', error);
    return null;
  }
}

/**
 * 内部使用：验证 Jito 配置是否存在
 */
export async function isJitoConfigured(): Promise<boolean> {
  try {
    const db = await getDb();
    const [jitoConfig] = await db.select().from(settings).where(eq(settings.key, 'jito_shred_key'));
    return !!jitoConfig;
  } catch (error) {
    console.error('Error checking Jito config:', error);
    return false;
  }
}
