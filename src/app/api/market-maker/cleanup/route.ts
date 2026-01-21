import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { marketMakerStrategies } from '@/storage/database/shared/schema';
import { desc } from 'drizzle-orm';

// GET /api/market-maker/cleanup - 清理多余策略，只保留最新的两个
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    // 获取所有策略，按创建时间倒序排序
    const allStrategies = await db
      .select()
      .from(marketMakerStrategies)
      .orderBy(desc(marketMakerStrategies.createdAt));

    if (allStrategies.length <= 2) {
      return NextResponse.json({
        success: true,
        message: '当前策略数量不足 3 个，无需清理',
        data: {
          total: allStrategies.length,
          deleted: 0,
          kept: allStrategies.length,
        }
      });
    }

    // 保留最新的两个策略
    const keepCount = 2;
    const strategiesToDelete = allStrategies.slice(keepCount);
    const idsToDelete = strategiesToDelete.map(s => s.id);

    // 批量删除多余的策略
    for (const id of idsToDelete) {
      await db
        .delete(marketMakerStrategies)
        .where(require('drizzle-orm').eq(marketMakerStrategies.id, id));
    }

    return NextResponse.json({
      success: true,
      message: `成功删除 ${idsToDelete.length} 个策略，保留最新的 2 个`,
      data: {
        total: allStrategies.length,
        deleted: idsToDelete.length,
        kept: keepCount,
        deletedIds: idsToDelete,
      }
    });
  } catch (error) {
    console.error('Cleanup strategies error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '清理策略失败' },
      { status: 500 }
    );
  }
}
