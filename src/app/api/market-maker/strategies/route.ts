import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { marketMakerStrategies, wallets, transactions, portfolios } from '@/storage/database/shared/schema';
import { insertMarketMakerStrategySchema, updateMarketMakerStrategySchema, insertTransactionSchema, insertPortfolioSchema } from '@/storage/database/shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

// GET /api/market-maker/strategies - 获取所有策略
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const tokenAddress = searchParams.get('tokenAddress');
    const platform = searchParams.get('platform');

    // 构建查询条件
    const conditions: any[] = [];
    if (walletId) conditions.push(eq(marketMakerStrategies.walletId, walletId));
    if (tokenAddress) conditions.push(eq(marketMakerStrategies.tokenAddress, tokenAddress));
    if (platform) conditions.push(eq(marketMakerStrategies.platform, platform));

    let strategies;
    if (conditions.length > 0) {
      strategies = await db
        .select()
        .from(marketMakerStrategies)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(marketMakerStrategies.createdAt))
        .limit(50);
    } else {
      strategies = await db
        .select()
        .from(marketMakerStrategies)
        .orderBy(desc(marketMakerStrategies.createdAt))
        .limit(50);
    }

    return NextResponse.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    console.error('Get strategies error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取策略失败' },
      { status: 500 }
    );
  }
}

// POST /api/market-maker/strategies - 创建策略
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    // 验证必填字段
    const { name, walletId, tokenAddress, tokenSymbol, platform, strategyType, params } = body;
    if (!name || !walletId || !tokenAddress || !tokenSymbol || !platform || !strategyType) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: name, walletId, tokenAddress, tokenSymbol, platform, strategyType' },
        { status: 400 }
      );
    }

    // 验证平台是否为 Bonding Curve 平台
    const validPlatforms = ['pump.fun', 'four.meme', 'raydium', 'uniswap', 'pancakeswap'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `无效的平台: ${platform}` },
        { status: 400 }
      );
    }

    // 验证策略类型
    const validStrategyTypes = ['price_floor', 'bot_snipe', 'price_stabilization', 'anti_dump', 'comprehensive'];
    if (!validStrategyTypes.includes(strategyType)) {
      return NextResponse.json(
        { success: false, error: `无效的策略类型: ${strategyType}` },
        { status: 400 }
      );
    }

    // 检查代币是否已存在策略
    const existingStrategy = await db.select()
      .from(marketMakerStrategies)
      .where(and(
        eq(marketMakerStrategies.tokenAddress, tokenAddress),
        eq(marketMakerStrategies.strategyType, strategyType)
      ))
      .limit(1);

    if (existingStrategy.length > 0) {
      return NextResponse.json(
        { success: false, error: '该代币已存在相同类型的策略' },
        { status: 400 }
      );
    }

    // 获取钱包信息
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    // 合并默认参数
    const defaultParams = {
      // 托底买入参数
      floorPricePercent: params.floorPricePercent || '95',
      floorBuyAmount: params.floorBuyAmount || '1000',
      floorMaxBuy: params.floorMaxBuy || '10000',
      floorBought: '0',

      // 机器人狙击参数
      snipeEnabled: params.snipeEnabled || false,
      snipeDelay: params.snipeDelay || 100,
      snipeAmount: params.snipeAmount || '500',
      snipeThreshold: params.snipeThreshold || '0.5',

      // 价格稳定参数
      stabilizationEnabled: params.stabilizationEnabled || false,
      stabilizationInterval: params.stabilizationInterval || 10,
      stabilizationAmount: params.stabilizationAmount || '200',
      stabilizationTargetGrowth: params.stabilizationTargetGrowth || '5',

      // 防砸盘参数
      antiDumpEnabled: params.antiDumpEnabled || false,
      dumpThreshold: params.dumpThreshold || '10000',
      antiDumpAmount: params.antiDumpAmount || '2000',
    };

    const newStrategy = {
      name,
      walletId,
      tokenAddress,
      tokenSymbol,
      platform,
      strategyType,
      isEnabled: body.isEnabled !== false,
      status: 'idle',
      params: defaultParams,
      maxSpend: body.maxSpend || '100',
      stopLossPercent: body.stopLossPercent || '50',
      startAt: body.startAt || null,
      endAt: body.endAt || null,
      nextExecuteAt: new Date(Date.now() + 10000), // 10秒后首次执行
    };

    const validatedStrategyData = insertMarketMakerStrategySchema.parse(newStrategy);
    const [strategy] = await db.insert(marketMakerStrategies)
      .values(validatedStrategyData)
      .returning();

    return NextResponse.json({
      success: true,
      data: strategy,
      message: '做市值策略创建成功'
    });
  } catch (error) {
    console.error('Create strategy error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建策略失败' },
      { status: 500 }
    );
  }
}
