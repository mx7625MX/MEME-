import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { portfolios } from '@/storage/database/shared/schema';
import { eq, or, like } from 'drizzle-orm';

// DELETE /api/portfolios/clean - 清理所有 USDC 和 USDT 持仓
export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    
    // 查找所有 USDC 和 USDT 持仓
    const stableCoinPortfolios = await db
      .select()
      .from(portfolios)
      .where(
        or(
          like(portfolios.tokenSymbol, '%USDC%'),
          like(portfolios.tokenSymbol, '%USDT%')
        )
      );

    if (stableCoinPortfolios.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有找到需要清理的稳定币持仓',
        data: { deleted: 0 }
      });
    }

    // 删除这些持仓
    for (const portfolio of stableCoinPortfolios) {
      await db.delete(portfolios).where(eq(portfolios.id, portfolio.id));
    }

    return NextResponse.json({
      success: true,
      message: `已成功删除 ${stableCoinPortfolios.length} 个稳定币持仓`,
      data: {
        deleted: stableCoinPortfolios.length,
        details: stableCoinPortfolios.map(p => ({
          id: p.id,
          symbol: p.tokenSymbol,
          chain: p.chain,
          amount: p.amount
        }))
      }
    });
  } catch (error) {
    console.error('Error cleaning portfolios:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '清理持仓失败' 
      },
      { status: 500 }
    );
  }
}

// GET /api/portfolios/clean - 获取需要清理的稳定币持仓列表
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    
    // 查找所有 USDC 和 USDT 持仓
    const stableCoinPortfolios = await db
      .select()
      .from(portfolios)
      .where(
        or(
          like(portfolios.tokenSymbol, '%USDC%'),
          like(portfolios.tokenSymbol, '%USDT%')
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        count: stableCoinPortfolios.length,
        portfolios: stableCoinPortfolios.map(p => ({
          id: p.id,
          symbol: p.tokenSymbol,
          name: p.tokenName,
          chain: p.chain,
          amount: p.amount,
          totalValue: p.totalValue,
          walletId: p.walletId
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching stable coin portfolios:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取稳定币持仓失败' 
      },
      { status: 500 }
    );
  }
}
