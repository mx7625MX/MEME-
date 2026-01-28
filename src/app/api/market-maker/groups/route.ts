import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { marketMakerStrategyGroups, marketMakerStrategies } from '@/storage/database/shared/schema';
import { insertMarketMakerStrategyGroupSchema } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/market-maker/groups - 获取策略组列表
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('tokenAddress');
    const isEnabled = searchParams.get('isEnabled');

    const conditions: any[] = [];
    if (tokenAddress) conditions.push(eq(marketMakerStrategyGroups.tokenAddress, tokenAddress));
    if (isEnabled) conditions.push(eq(marketMakerStrategyGroups.isEnabled, isEnabled === 'true'));

    let groups;
    if (conditions.length > 0) {
      groups = await db
        .select()
        .from(marketMakerStrategyGroups)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    } else {
      groups = await db.select().from(marketMakerStrategyGroups);
    }

    // 获取每个组包含的策略
    const groupsWithStrategies = await Promise.all(
      groups.map(async (group) => {
        if (!group.strategyId) {
          return {
            ...group,
            strategies: [],
          };
        }
        const strategies = await db
          .select()
          .from(marketMakerStrategies)
          .where(eq(marketMakerStrategies.id, group.strategyId));
        return {
          ...group,
          strategies,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: groupsWithStrategies,
    });
  } catch (error) {
    console.error('Get strategy groups error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取策略组失败' },
      { status: 500 }
    );
  }
}

// POST /api/market-maker/groups - 创建策略组
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    const { name, tokenAddress, tokenSymbol, strategyIds, coordinationType } = body;

    if (!name || !tokenAddress || !tokenSymbol || !strategyIds || strategyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 创建策略组记录
    const newGroup = {
      name,
      tokenAddress,
      tokenSymbol,
      strategyId: strategyIds[0], // 主策略
      coordinationType: coordinationType || 'parallel', // parallel(并行), sequential(顺序), priority(优先级)
      isEnabled: true,
      coordinationRules: {
        maxConcurrent: 5,
        priorityOrder: strategyIds,
        cooldownTime: 1000, // 策略间冷却时间（毫秒）
        budgetAllocation: {
          total: '100',
          distribution: strategyIds.map((id: string) => ({
            strategyId: id,
            percentage: (100 / strategyIds.length).toString(),
          })),
        },
      },
    };

    const validatedGroupData = insertMarketMakerStrategyGroupSchema.parse(newGroup);
    const [group] = await db.insert(marketMakerStrategyGroups).values(validatedGroupData).returning();

    // 为每个策略创建关联记录
    for (const strategyId of strategyIds) {
      await db.insert(marketMakerStrategyGroups).values({
        groupId: group.id,
        strategyId,
        coordinationType: body.coordinationType || 'parallel',
        priority: strategyIds.indexOf(strategyId),
        isEnabled: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: group,
      message: '策略组创建成功',
    });
  } catch (error) {
    console.error('Create strategy group error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建策略组失败' },
      { status: 500 }
    );
  }
}
