import { NextRequest, NextResponse } from "next/server";
import { walletManager } from "@/storage/database";
import { createWallet } from "@/lib/crypto/wallet";
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

// POST /api/wallets/create - 创建新钱包（生成）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, chain } = body;

    if (!name || !chain) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and chain are required",
        },
        { status: 400 }
      );
    }

    // Generate wallet
    const walletInfo = createWallet(chain);

    // Encrypt sensitive data
    const encryptedMnemonic = encrypt(walletInfo.mnemonic);
    const encryptedPrivateKey = encrypt(walletInfo.privateKey);

    // Save to database
    const wallet = await walletManager.createWallet({
      name,
      chain,
      address: walletInfo.address,
      balance: "0",
      mnemonic: encryptedMnemonic,
      privateKey: encryptedPrivateKey,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...wallet,
        // Return unencrypted address only (sensitive data stays encrypted)
      },
    });
  } catch (error: any) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create wallet",
      },
      { status: 500 }
    );
  }
}
