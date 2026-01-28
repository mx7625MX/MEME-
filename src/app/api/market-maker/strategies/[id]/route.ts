import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { marketMakerStrategies } from '@/storage/database/shared/schema';
import { updateMarketMakerStrategySchema } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// PATCH /api/market-maker/strategies/[id] - 更新策略
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { id } = await context.params;

    // 检查策略是否存在
    const [existingStrategy] = await db.select()
      .from(marketMakerStrategies)
      .where(eq(marketMakerStrategies.id, id));

    if (!existingStrategy) {
      return NextResponse.json(
        { success: false, error: '策略不存在' },
        { status: 404 }
      );
    }

    // 更新策略
    const updatedData = {
      ...body,
      updatedAt: new Date(),
    };

    const validatedUpdateData = updateMarketMakerStrategySchema.parse(updatedData);
    const [updatedStrategy] = await db.update(marketMakerStrategies)
      .set(validatedUpdateData)
      .where(eq(marketMakerStrategies.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedStrategy,
      message: '策略更新成功'
    });
  } catch (error) {
    console.error('Update strategy error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新策略失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/market-maker/strategies/[id] - 删除策略
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await context.params;

    // 检查策略是否存在
    const [existingStrategy] = await db.select()
      .from(marketMakerStrategies)
      .where(eq(marketMakerStrategies.id, id));

    if (!existingStrategy) {
      return NextResponse.json(
        { success: false, error: '策略不存在' },
        { status: 404 }
      );
    }

    // 如果策略正在运行，先停止
    if (existingStrategy.status === 'running') {
      await db.update(marketMakerStrategies)
        .set({ status: 'stopped', updatedAt: new Date() })
        .where(eq(marketMakerStrategies.id, id));
    }

    // 删除策略
    await db.delete(marketMakerStrategies).where(eq(marketMakerStrategies.id, id));

    return NextResponse.json({
      success: true,
      message: '策略删除成功'
    });
  } catch (error) {
    console.error('Delete strategy error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除策略失败' },
      { status: 500 }
    );
  }
}
