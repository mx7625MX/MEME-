import { NextRequest, NextResponse } from "next/server";
import { walletManager } from "@/storage/database";
import { EthereumWallet, SolanaWallet } from "@/lib/crypto/wallet";
import * as crypto from "crypto";

/**
 * 加密/解密工具类
 * 使用环境变量存储加密密钥，确保钱包安全
 *
 * ⚠️ 重要警告：
 * - 必须在 Vercel Dashboard 中设置 ENCRYPTION_KEY 和 ENCRYPTION_SALT
 * - 如果未设置，将使用随机密钥（仅用于开发环境）
 * - 生产环境中，每次函数重启后随机密钥会变化，导致之前加密的数据无法解密
 * - 这是严重的安全和功能问题，必须设置固定密钥
 */

// 从环境变量获取加密密钥
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT;

// 检查是否在生产环境且未设置加密密钥
if (process.env.NODE_ENV === 'production' && (!ENCRYPTION_KEY || !ENCRYPTION_SALT)) {
  console.error('⚠️ 严重警告: 生产环境未设置 ENCRYPTION_KEY 或 ENCRYPTION_SALT');
  console.error('⚠️ 这将导致钱包数据无法加密/解密');
  console.error('⚠️ 请在 Vercel Dashboard 中设置环境变量');
  console.error('⚠️ Settings → Environment Variables');
}

// 生成随机密钥（仅用于开发环境）
let devEncryptionKey: string | null = null;
let devEncryptionSalt: string | null = null;

if (!ENCRYPTION_KEY || !ENCRYPTION_SALT) {
  console.warn('⚠️ 警告: 未设置 ENCRYPTION_KEY 或 ENCRYPTION_SALT，使用随机密钥（仅用于开发环境）');
  devEncryptionKey = crypto.randomBytes(32).toString('hex');
  devEncryptionSalt = crypto.randomBytes(16).toString('hex');
  console.warn('⚠️ 生产环境必须设置固定的 ENCRYPTION_KEY 和 ENCRYPTION_SALT');
}

/**
 * 加密函数 - 使用 AES-256-GCM 算法
 * @param text 要加密的文本
 * @returns 加密后的文本（格式：salt:iv:authTag:encryptedData）
 */
function encrypt(text: string): string {
  try {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(ENCRYPTION_KEY || devEncryptionKey!, ENCRYPTION_SALT || devEncryptionSalt!, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // 格式：salt:iv:authTag:encryptedData
    return `${ENCRYPTION_SALT || devEncryptionSalt!}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
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
    const key = crypto.scryptSync(ENCRYPTION_KEY || devEncryptionKey!, salt, 32);
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

// POST /api/wallets/import - 导入钱包（支持助记词或私钥）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, chain, mnemonic, privateKey, importType } = body;

    if (!name || !chain) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and chain are required",
        },
        { status: 400 }
      );
    }

    if (!importType || (!mnemonic && !privateKey)) {
      return NextResponse.json(
        {
          success: false,
          error: "Import type and either mnemonic or private key are required",
        },
        { status: 400 }
      );
    }

    let walletInfo;

    // 根据导入类型恢复钱包
    if (importType === "mnemonic") {
      if (!mnemonic || mnemonic.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "Mnemonic is required for mnemonic import",
          },
          { status: 400 }
        );
      }

      // 验证助记词格式
      const wordList = mnemonic.trim().split(/\s+/);
      if (wordList.length !== 12 && wordList.length !== 24) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid mnemonic: must be 12 or 24 words",
          },
          { status: 400 }
        );
      }

      // 从助记词恢复钱包
      switch (chain) {
        case "eth":
        case "bsc":
          walletInfo = EthereumWallet.fromMnemonic(mnemonic);
          break;
        case "solana":
          walletInfo = SolanaWallet.fromMnemonic(mnemonic);
          break;
        default:
          return NextResponse.json(
            {
              success: false,
              error: `Unsupported chain: ${chain}`,
            },
            { status: 400 }
          );
      }
    } else if (importType === "privateKey") {
      if (!privateKey || privateKey.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "Private key is required for private key import",
          },
          { status: 400 }
        );
      }

      // 从私钥恢复钱包
      switch (chain) {
        case "eth":
        case "bsc":
          walletInfo = EthereumWallet.fromPrivateKey(privateKey);
          break;
        case "solana":
          walletInfo = SolanaWallet.fromPrivateKey(privateKey);
          break;
        default:
          return NextResponse.json(
            {
              success: false,
              error: `Unsupported chain: ${chain}`,
            },
            { status: 400 }
          );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid import type: must be 'mnemonic' or 'privateKey'",
        },
        { status: 400 }
      );
    }

    // 检查地址是否已存在
    const existingWallets = await walletManager.getWallets();
    const isDuplicate = existingWallets.some(
      (w: any) => w.address.toLowerCase() === walletInfo.address.toLowerCase()
    );

    if (isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet with this address already exists",
        },
        { status: 409 }
      );
    }

    // 加密敏感数据
    const encryptedMnemonic = walletInfo.mnemonic ? encrypt(walletInfo.mnemonic) : "";
    const encryptedPrivateKey = encrypt(walletInfo.privateKey);

    // 保存到数据库
    const wallet = await walletManager.createWallet({
      name,
      chain,
      address: walletInfo.address,
      balance: "0",
      mnemonic: encryptedMnemonic,
      privateKey: encryptedPrivateKey,
      isActive: true,
    });

    // 返回数据时过滤掉敏感信息
    const { mnemonic: _, privateKey: __, ...safeWallet } = wallet;

    return NextResponse.json({
      success: true,
      data: safeWallet,
    });
  } catch (error: any) {
    // 错误日志中不包含敏感信息
    console.error("Error importing wallet:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to import wallet",
      },
      { status: 500 }
    );
  }
}
