import { NextRequest, NextResponse } from "next/server";
import { marketDataManager } from "@/storage/database";

// GET /api/market - 获取市场数据
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenSymbol = searchParams.get("tokenSymbol") || undefined;
    const isHot = searchParams.get("isHot");
    const limit = parseInt(searchParams.get("limit") || "100");

    const data = await marketDataManager.getMarketData({
      tokenSymbol,
      isHot: isHot ? isHot === "true" : undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching market data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch market data",
      },
      { status: 500 }
    );
  }
}
