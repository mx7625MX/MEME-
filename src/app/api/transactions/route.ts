import { NextRequest, NextResponse } from "next/server";
import { transactionManager, walletManager } from "@/storage/database";

// GET /api/transactions - 获取交易历史
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletId = searchParams.get("walletId") || undefined;
    const chain = searchParams.get("chain") || undefined;
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");

    const transactions = await transactionManager.getTransactions({
      filters: {
        walletId,
        chain,
        type,
        status,
      } as any,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch transactions",
      },
      { status: 500 }
    );
  }
}

// POST /api/transactions - 创建新交易
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transaction = await transactionManager.createTransaction(body);

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create transaction",
      },
      { status: 500 }
    );
  }
}
