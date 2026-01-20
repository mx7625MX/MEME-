import { NextRequest, NextResponse } from "next/server";
import { walletManager, transactionManager, marketDataManager } from "@/storage/database";

// GET /api/stats - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const [walletStats, transactionStats, marketData] = await Promise.all([
      walletManager.getWalletStats(),
      transactionManager.getTransactionStats(),
      marketDataManager.getMarketData({ limit: 5 }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        wallets: walletStats,
        transactions: transactionStats,
        recentMarketData: marketData,
      },
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch stats",
      },
      { status: 500 }
    );
  }
}
