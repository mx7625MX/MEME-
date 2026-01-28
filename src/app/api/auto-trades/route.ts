import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { autoTrades } from '@/storage/database/shared/schema';
import { insertAutoTradeSchema } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    
    let trades;
    if (walletId) {
      trades = await db.select().from(autoTrades).where(eq(autoTrades.walletId, walletId));
    } else {
      trades = await db.select().from(autoTrades);
    }
    
    return NextResponse.json({
      success: true,
      data: trades
    });
  } catch (error) {
    console.error('Get auto trades error:', error);
    return NextResponse.json(
      { success: false, error: '获取自动交易配置失败' },
      { status: 500 }
    );
  }
}

// 创建自动交易配置
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // 验证必填字段
    const { walletId, name, chain, tradeType, condition, amount } = body;
    
    if (!walletId || !name || !chain || !tradeType || !condition || !amount) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: walletId, name, chain, tradeType, condition, amount' },
        { status: 400 }
      );
    }

    const newAutoTrade = {
      walletId,
      name,
      chain,
      tokenAddress: body.tokenAddress || null,
      tokenSymbol: body.tokenSymbol || null,
      tradeType,
      condition,
      conditionValue: body.conditionValue || '0',
      amount: amount.toString(),
      slippage: body.slippage || 5,
      isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
      metadata: {
        description: body.description || '',
        ...body.metadata
      }
    };

    const validatedData = insertAutoTradeSchema.parse(newAutoTrade);
    const [trade] = await db.insert(autoTrades)
      .values(validatedData)
      .returning();

    return NextResponse.json({
      success: true,
      data: trade,
      message: '自动交易配置创建成功'
    });

  } catch (error) {
    console.error('Create auto trade error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '创建自动交易配置失败' 
      },
      { status: 500 }
    );
  }
}
