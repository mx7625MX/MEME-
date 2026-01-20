import { NextRequest, NextResponse } from "next/server";
import { marketDataManager } from "@/storage/database";

// GET /api/market/hot - 获取热门代币
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const hotTokens = await marketDataManager.getHotTokens(limit);

    return NextResponse.json({
      success: true,
      data: hotTokens,
    });
  } catch (error: any) {
    console.error("Error fetching hot tokens:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch hot tokens",
      },
      { status: 500 }
    );
  }
}
