import { NextRequest, NextResponse } from "next/server";
import { walletManager } from "@/storage/database";

// GET /api/wallets/[id] - 获取单个钱包
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wallet = await walletManager.getWalletById(id);

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: wallet,
    });
  } catch (error: any) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch wallet",
      },
      { status: 500 }
    );
  }
}

// PUT /api/wallets/[id] - 更新钱包
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const wallet = await walletManager.updateWallet(id, body);

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: wallet,
    });
  } catch (error: any) {
    console.error("Error updating wallet:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update wallet",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/wallets/[id] - 删除钱包
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await walletManager.deleteWallet(id);

    return NextResponse.json({
      success,
      message: success ? "Wallet deleted successfully" : "Wallet not found",
    });
  } catch (error: any) {
    console.error("Error deleting wallet:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete wallet",
      },
      { status: 500 }
    );
  }
}
