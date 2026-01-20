import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { autoTrades } from '@/storage/database/shared/schema';
import { updateAutoTradeSchema } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    
    const [trade] = await db.select().from(autoTrades).where(eq(autoTrades.id, id));
    
    if (!trade) {
      return NextResponse.json(
        { success: false, error: '自动交易配置不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: trade
    });
  } catch (error) {
    console.error('Get auto trade error:', error);
    return NextResponse.json(
      { success: false, error: '获取自动交易配置失败' },
      { status: 500 }
    );
  }
}

// 更新自动交易配置
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const body = await request.json();
    
    const validatedData = updateAutoTradeSchema.parse(body);
    
    const [trade] = await db.update(autoTrades)
      .set({ 
        ...validatedData, 
        updatedAt: new Date()
      })
      .where(eq(autoTrades.id, id))
      .returning();
    
    if (!trade) {
      return NextResponse.json(
        { success: false, error: '自动交易配置不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: trade,
      message: '自动交易配置更新成功'
    });
  } catch (error) {
    console.error('Update auto trade error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新自动交易配置失败' },
      { status: 500 }
    );
  }
}

// 删除自动交易配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    
    const [trade] = await db.delete(autoTrades)
      .where(eq(autoTrades.id, id))
      .returning();
    
    if (!trade) {
      return NextResponse.json(
        { success: false, error: '自动交易配置不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '自动交易配置删除成功'
    });
  } catch (error) {
    console.error('Delete auto trade error:', error);
    return NextResponse.json(
      { success: false, error: '删除自动交易配置失败' },
      { status: 500 }
    );
  }
}
