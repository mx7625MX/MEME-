import { NextRequest, NextResponse } from "next/server";
import { walletManager } from "@/storage/database";
import { EthereumWallet, SolanaWallet } from "@/lib/crypto/wallet";
import * as crypto from "crypto";

// Simple encryption (for demo - use proper encryption in production)
function encrypt(text: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync("demo-secret-key", "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
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
