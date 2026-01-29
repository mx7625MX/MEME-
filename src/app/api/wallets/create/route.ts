import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/storage/database/db";
import { wallets } from "@/storage/database/shared/schema";
import { createWallet } from "@/lib/crypto/wallet";
import * as crypto from "crypto";

/**
 * 加密/解密工具类
 * 使用环境变量存储加密密钥，确保钱包安全
 */

// 从环境变量获取加密密钥，如果未设置则生成一个随机密钥（仅用于开发）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT || crypto.randomBytes(16).toString('hex');

/**
 * 加密函数 - 使用 AES-256-GCM 算法
 * @param text 要加密的文本
 * @returns 加密后的文本（格式：salt:iv:authTag:encryptedData）
 */
function encrypt(text: string): string {
  try {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // 格式：salt:iv:authTag:encryptedData
    return `${ENCRYPTION_SALT}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt wallet data");
  }
}

/**
 * 解密函数
 * @param encryptedText 加密的文本
 * @returns 解密后的文本
 */
function decrypt(encryptedText: string): string {
  try {
    const algorithm = "aes-256-gcm";
    const parts = encryptedText.split(":");

    if (parts.length !== 4) {
      throw new Error("Invalid encrypted data format");
    }

    const [salt, ivHex, authTagHex, encryptedData] = parts;
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt wallet data");
  }
}

// POST /api/wallets/create - 创建新钱包（生成）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, chain } = body;

    // 验证必需参数
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (!chain || typeof chain !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: "Chain is required and must be a string",
        },
        { status: 400 }
      );
    }

    console.log('Creating wallet:', { name, chain });

    // Generate wallet
    const walletInfo = createWallet(chain);
    console.log('Wallet generated:', { address: walletInfo.address });

    // Encrypt sensitive data
    const encryptedMnemonic = encrypt(walletInfo.mnemonic);
    const encryptedPrivateKey = encrypt(walletInfo.privateKey);

    console.log('Data encrypted');

    // 直接插入到数据库，绕过 Schema 验证
    const db = await getDb();
    const [wallet] = await db.insert(wallets).values({
      name,
      chain,
      address: walletInfo.address,
      balance: "0",
      mnemonic: encryptedMnemonic,
      privateKey: encryptedPrivateKey,
      isActive: true,
      metadata: {},
    }).returning();

    console.log('Wallet saved to database:', wallet.id);

    // 清除钱包列表缓存
    try {
      const { cache } = await import('@/lib/cache');
      cache.delete('wallets_list');
      console.log('Wallet cache cleared');
    } catch (err) {
      console.warn('Failed to clear cache:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: wallet.id,
        name: wallet.name,
        chain: wallet.chain,
        address: wallet.address,
        balance: wallet.balance,
        isActive: wallet.isActive,
        createdAt: wallet.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create wallet",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
