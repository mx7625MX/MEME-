import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { portfolios } from '@/storage/database/shared/schema';
import { updatePortfolioSchema } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';

// 更新持仓信息（如利润目标、止损等）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const body = await request.json();

    // 验证持仓是否存在
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: '持仓不存在' },
        { status: 404 }
      );
    }

    // 更新持仓
    const updatedData: any = {
      updatedAt: new Date()
    };

    if (body.profitTarget !== undefined) {
      updatedData.profitTarget = body.profitTarget;
    }
    if (body.stopLoss !== undefined) {
      updatedData.stopLoss = body.stopLoss;
    }
    if (body.currentPrice !== undefined) {
      updatedData.currentPrice = body.currentPrice;
      // 重新计算盈亏
      const currentPrice = parseFloat(body.currentPrice);
      const buyPrice = parseFloat(portfolio.buyPrice);
      const amount = parseFloat(portfolio.amount);
      updatedData.totalValue = (currentPrice * amount).toString();
      updatedData.profitLoss = ((currentPrice - buyPrice) * amount).toString();
      updatedData.profitLossPercent = ((currentPrice - buyPrice) / buyPrice * 100).toFixed(2);
    }

    const [updated] = await db
      .update(portfolios)
      .set(updatedData)
      .where(eq(portfolios.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新持仓失败' },
      { status: 500 }
    );
  }
}

// 删除持仓
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;

    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: '持仓不存在' },
        { status: 404 }
      );
    }

    await db.delete(portfolios).where(eq(portfolios.id, id));

    return NextResponse.json({
      success: true,
      message: '持仓已删除'
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除持仓失败' },
      { status: 500 }
    );
  }
}
