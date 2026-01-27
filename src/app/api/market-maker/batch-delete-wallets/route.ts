import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { wallets } from '@/storage/database/shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

// POST /api/market-maker/batch-delete-wallets - 批量删除钱包
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const { walletIds } = body;
    
    if (!walletIds || !Array.isArray(walletIds) || walletIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供要删除的钱包ID列表' },
        { status: 400 }
      );
    }
    
    if (walletIds.length > 100) {
      return NextResponse.json(
        { success: false, error: '一次最多删除100个钱包' },
        { status: 400 }
      );
    }
    
    // 先查询这些钱包，获取要删除的信息
    const walletsToDelete = await db
      .select()
      .from(wallets)
      .where(inArray(wallets.id, walletIds));
    
    if (walletsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: '未找到要删除的钱包' },
        { status: 404 }
      );
    }
    
    // 执行删除操作
    const deletedWallets = await db
      .delete(wallets)
      .where(inArray(wallets.id, walletIds))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: {
        wallets: deletedWallets,
        count: deletedWallets.length,
        message: `成功删除 ${deletedWallets.length} 个钱包`
      }
    });
    
  } catch (error) {
    console.error('Batch delete wallets error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '批量删除钱包失败' },
      { status: 500 }
    );
  }
}
