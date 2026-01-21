import { NextRequest, NextResponse } from "next/server";
import { walletManager } from "@/storage/database";

// GET /api/wallets - 获取钱包列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get("chain") || undefined;
    const isActive = searchParams.get("isActive");

    const wallets = await walletManager.getWallets({
      filters: {
        chain: chain as any,
        isActive: isActive ? isActive === "true" : undefined,
      },
    });

    // 过滤掉敏感数据（助记词和私钥）
    const safeWallets = wallets.map(({ mnemonic, privateKey, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: safeWallets,
    });
  } catch (error: any) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch wallets",
      },
      { status: 500 }
    );
  }
}

// POST /api/wallets - 创建新钱包
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const wallet = await walletManager.createWallet(body);

    return NextResponse.json({
      success: true,
      data: wallet,
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
