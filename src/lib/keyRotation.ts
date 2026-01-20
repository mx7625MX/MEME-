import crypto from 'crypto';
import { encrypt, decrypt } from './encryption';

// 密钥轮换历史记录
interface KeyRotation {
  oldKey: string;
  newKey: string;
  rotatedAt: Date;
}

let rotationHistory: KeyRotation[] = [];

/**
 * 生成新的加密密钥
 */
export function generateNewEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 使用旧密钥解密数据，然后用新密钥重新加密
 */
export function rotateEncryption(
  encryptedData: string,
  oldEncryptionKey: string,
  newEncryptionKey: string
): string {
  // 1. 使用旧密钥解密
  const decrypted = decryptWithKey(encryptedData, oldEncryptionKey);
  
  // 2. 使用新密钥加密
  const reencrypted = encryptWithKey(decrypted, newEncryptionKey);
  
  return reencrypted;
}

/**
 * 使用指定密钥加密
 */
function encryptWithKey(text: string, encryptionKey: string): string {
  const salt = crypto.randomBytes(64);
  const iv = crypto.randomBytes(16);
  
  const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha512');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

/**
 * 使用指定密钥解密
 */
function decryptWithKey(encryptedData: string, encryptionKey: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  
  const salt = buffer.subarray(0, 64);
  const iv = buffer.subarray(64, 80);
  const tag = buffer.subarray(80, 96);
  const encrypted = buffer.subarray(96);
  
  const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha512');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

/**
 * 执行密钥轮换（批量处理所有加密数据）
 * 
 * ⚠️ 警告：这是一个危险操作，仅在有备份的情况下执行
 */
export async function performKeyRotation(
  oldKey: string,
  newKey: string,
  encryptedRecords: Array<{ id: string; value: string }>
): Promise<Array<{ id: string; success: boolean; error?: string }>> {
  const results = [];
  
  for (const record of encryptedRecords) {
    try {
      const reencrypted = rotateEncryption(record.value, oldKey, newKey);
      results.push({
        id: record.id,
        success: true,
        newValue: reencrypted
      });
    } catch (error) {
      results.push({
        id: record.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // 记录轮换历史
  rotationHistory.push({
    oldKey,
    newKey,
    rotatedAt: new Date()
  });
  
  return results;
}

/**
 * 获取轮换历史
 */
export function getRotationHistory(): KeyRotation[] {
  return rotationHistory;
}

/**
 * 验证加密密钥是否正确
 */
export function validateEncryptionKey(key: string, sampleEncryptedData: string): boolean {
  try {
    decryptWithKey(sampleEncryptedData, key);
    return true;
  } catch (error) {
    return false;
  }
}
