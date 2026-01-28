import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { portfolios } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// 更新持仓的自动闪电卖出配置
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

    // 更新自动闪电卖出配置
    const updateData: any = {
      updatedAt: new Date().toISOString().toISOString(),
    };

    if ('autoSellEnabled' in body) {
      updateData.autoSellEnabled = body.autoSellEnabled;
    }
    
    if ('autoSellType' in body) {
      updateData.autoSellType = body.autoSellType;
    }
    
    if ('whaleBuyThreshold' in body) {
      updateData.whaleBuyThreshold = body.whaleBuyThreshold;
    }
    
    if ('autoSellPercentage' in body) {
      updateData.autoSellPercentage = body.autoSellPercentage;
    }
    
    if ('profitTarget' in body) {
      updateData.profitTarget = body.profitTarget;
    }
    
    if ('stopLoss' in body) {
      updateData.stopLoss = body.stopLoss;
    }

    // 更新定时卖出配置
    if ('timedSellEnabled' in body) {
      updateData.timedSellEnabled = body.timedSellEnabled;
      // 如果启用定时卖出且未设置预定时间，则设置预定时间
      if (body.timedSellEnabled && !portfolio.timedSellScheduledAt) {
        const seconds = body.timedSellSeconds || portfolio.timedSellSeconds || 5;
        updateData.timedSellSeconds = seconds;
        updateData.timedSellScheduledAt = new Date(Date.now() + seconds * 1000);
      }
    }
    
    if ('timedSellSeconds' in body) {
      updateData.timedSellSeconds = body.timedSellSeconds;
      // 更新定时卖出的预定时间
      if (portfolio.timedSellEnabled) {
        updateData.timedSellScheduledAt = new Date(Date.now() + body.timedSellSeconds * 1000);
      }
    }

    // 如果重新启用了自动卖出，重置状态为 idle
    if (body.autoSellEnabled === true) {
      updateData.autoSellStatus = 'idle';
    }

    const [updatedPortfolio] = await db.update(portfolios)
      .set(updateData)
      .where(eq(portfolios.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedPortfolio,
      message: '自动闪电卖出配置已更新'
    });

  } catch (error) {
    console.error('Update auto-sell config error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '更新配置失败' 
      },
      { status: 500 }
    );
  }
}
