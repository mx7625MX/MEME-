import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { marketMakerStrategies, wallets, transactions, tokens, portfolios, botDetectionLogs } from '@/storage/database/shared/schema';
import { insertTransactionSchema, insertPortfolioSchema, insertBotDetectionLogSchema } from '@/storage/database/shared/schema';
import { eq, and, lt, gte } from 'drizzle-orm';

// 机器人检测逻辑
function detectBotAction(tx: any, platform: string): {
  isBot: boolean;
  confidence: number;
  detectionType: string;
  reason: string;
} {
  // 检测 1: 快速买入后立即卖出（套利机器人）
  const buySellInterval = tx.buySellInterval; // 买入到卖出的时间间隔（毫秒）
  if (buySellInterval && buySellInterval < 5000) {
    return {
      isBot: true,
      confidence: 90,
      detectionType: 'rapid_buy_sell',
      reason: `快速买入后立即卖出（${buySellInterval}ms）`
    };
  }

  // 检测 2: 大额买入（可能是狙击机器人）
  const largeBuyThreshold = 1000; // 大额买入阈值
  if (tx.type === 'buy' && parseFloat(tx.amount) > largeBuyThreshold) {
    return {
      isBot: true,
      confidence: 75,
      detectionType: 'large_buy',
      reason: `大额买入 (${parseFloat(tx.amount).toFixed(0)} 代币)`
    };
  }

  // 检测 3: 异常交易模式（短时间内多次交易）
  const recentTxCount = tx.recentTxCount || 0;
  if (recentTxCount > 3) {
    return {
      isBot: true,
      confidence: 80,
      detectionType: 'pattern',
      reason: `短时间内多次交易 (${recentTxCount} 次交易)`
    };
  }

  // 检测 4: 砸盘行为（大额卖出）
  const dumpThreshold = 10000; // 砸盘阈值
  if (tx.type === 'sell' && parseFloat(tx.amount) > dumpThreshold) {
    return {
      isBot: true,
      confidence: 85,
      detectionType: 'dump',
      reason: `大额砸盘 (${parseFloat(tx.amount).toFixed(0)} 代币)`
    };
  }

  return {
    isBot: false,
    confidence: 0,
    detectionType: 'none',
    reason: ''
  };
}

// 执行托底买入
async function executeFloorBuy(
  db: any,
  strategy: any,
  wallet: any,
  token: any,
  currentPrice: number
): Promise<any> {
  const params = strategy.params as any;

  // 计算价格下限
  const floorPrice = currentPrice * (parseFloat(params.floorPricePercent) / 100);

  // 如果当前价格高于下限，不执行托底买入
  if (currentPrice >= floorPrice) {
    return { executed: false, reason: '价格高于托底价格' };
  }

  // 检查是否已达到最大托底买入量
  const floorBought = parseFloat(params.floorBought || '0');
  const floorMaxBuy = parseFloat(params.floorMaxBuy);
  if (floorBought >= floorMaxBuy) {
    return { executed: false, reason: '已达到最大托底买入量' };
  }

  // 计算本次买入数量
  const floorBuyAmount = Math.min(
    parseFloat(params.floorBuyAmount),
    floorMaxBuy - floorBought
  );

  // 模拟买入交易（实际应用中需要调用区块链）
  const mockTxHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  // 创建交易记录
  const newTransaction = {
    walletId: strategy.walletId,
    type: 'buy' as const,
    chain: wallet.chain,
    tokenAddress: strategy.tokenAddress,
    tokenSymbol: strategy.tokenSymbol,
    amount: floorBuyAmount.toString(),
    price: currentPrice.toString(),
    fee: (floorBuyAmount * currentPrice * 0.003).toString(),
    status: 'completed' as const,
    metadata: {
      strategyId: strategy.id,
      strategyType: 'market_maker',
      action: 'floor_buy',
      txHash: mockTxHash,
      floorPrice: floorPrice.toString(),
    }
  };

  const validatedTxData = insertTransactionSchema.parse(newTransaction);
  const [transaction] = await db.insert(transactions)
    .values(validatedTxData)
    .returning();

  // 更新策略统计
  const updatedParams = {
    ...params,
    floorBought: (floorBought + floorBuyAmount).toString(),
  };

  await db.update(marketMakerStrategies)
    .set({
      params: updatedParams,
      totalBuys: (strategy.totalBuys || 0) + 1,
      totalBuyAmount: (parseFloat(strategy.totalBuyAmount || '0') + floorBuyAmount).toString(),
      totalSpent: (parseFloat(strategy.totalSpent || '0') + floorBuyAmount * currentPrice).toString(),
      lastExecutedAt: new Date(),
    })
    .where(eq(marketMakerStrategies.id, strategy.id));

  return {
    executed: true,
    transaction,
    amount: floorBuyAmount,
    price: currentPrice,
    reason: '托底买入'
  };
}

// 执行机器人狙击
async function executeBotSnipe(
  db: any,
  strategy: any,
  wallet: any,
  botDetection: any,
  currentPrice: number
): Promise<any> {
  const params = strategy.params as any;

  if (!params.snipeEnabled) {
    return { executed: false, reason: '机器人狙击未启用' };
  }

  // 模拟狙击买入（实际应用中需要调用区块链）
  const snipeAmount = parseFloat(params.snipeAmount);
  const mockTxHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  // 创建交易记录
  const newTransaction = {
    walletId: strategy.walletId,
    type: 'buy' as const,
    chain: wallet.chain,
    tokenAddress: strategy.tokenAddress,
    tokenSymbol: strategy.tokenSymbol,
    amount: snipeAmount.toString(),
    price: currentPrice.toString(),
    fee: (snipeAmount * currentPrice * 0.003).toString(),
    status: 'completed' as const,
    metadata: {
      strategyId: strategy.id,
      strategyType: 'market_maker',
      action: 'bot_snipe',
      botWalletAddress: botDetection.walletAddress,
      txHash: mockTxHash,
      snipeDelay: params.snipeDelay,
    }
  };

  const validatedTxData = insertTransactionSchema.parse(newTransaction);
  const [transaction] = await db.insert(transactions)
    .values(validatedTxData)
    .returning();

  // 更新策略统计
  await db.update(marketMakerStrategies)
    .set({
      totalBuys: (strategy.totalBuys || 0) + 1,
      totalBuyAmount: (parseFloat(strategy.totalBuyAmount || '0') + snipeAmount).toString(),
      totalSpent: (parseFloat(strategy.totalSpent || '0') + snipeAmount * currentPrice).toString(),
      lastExecutedAt: new Date(),
    })
    .where(eq(marketMakerStrategies.id, strategy.id));

  // 记录机器人检测日志
  const newBotLog = {
    walletAddress: botDetection.walletAddress,
    tokenAddress: strategy.tokenAddress,
    platform: strategy.platform,
    detectionType: botDetection.detectionType,
    confidence: botDetection.confidence,
    details: {
      txHash: mockTxHash,
      amount: snipeAmount.toString(),
      price: currentPrice.toString(),
      timestamp: new Date().toISOString(),
      reason: botDetection.reason,
      behavior: 'sniping',
      actionTaken: 'snipe_counter',
    },
    actionTaken: 'snipe_counter',
    strategyId: strategy.id,
  };

  const validatedBotLogData = insertBotDetectionLogSchema.parse(newBotLog);
  await db.insert(botDetectionLogs).values(validatedBotLogData);

  return {
    executed: true,
    transaction,
    amount: snipeAmount,
    price: currentPrice,
    reason: `机器人狙击（${botDetection.reason}）`
  };
}

// 执行价格稳定
async function executePriceStabilization(
  db: any,
  strategy: any,
  wallet: any,
  currentPrice: number
): Promise<any> {
  const params = strategy.params as any;

  if (!params.stabilizationEnabled) {
    return { executed: false, reason: '价格稳定未启用' };
  }

  // 计算目标增长率
  const targetGrowthPercent = parseFloat(params.stabilizationTargetGrowth);
  const stabilizationAmount = parseFloat(params.stabilizationAmount);

  // 模拟稳定买入（实际应用中需要调用区块链）
  const mockTxHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  // 创建交易记录
  const newTransaction = {
    walletId: strategy.walletId,
    type: 'buy' as const,
    chain: wallet.chain,
    tokenAddress: strategy.tokenAddress,
    tokenSymbol: strategy.tokenSymbol,
    amount: stabilizationAmount.toString(),
    price: currentPrice.toString(),
    fee: (stabilizationAmount * currentPrice * 0.003).toString(),
    status: 'completed' as const,
    metadata: {
      strategyId: strategy.id,
      strategyType: 'market_maker',
      action: 'price_stabilization',
      txHash: mockTxHash,
      targetGrowthPercent,
    }
  };

  const validatedTxData = insertTransactionSchema.parse(newTransaction);
  const [transaction] = await db.insert(transactions)
    .values(validatedTxData)
    .returning();

  // 更新策略统计和下次执行时间
  const nextExecuteAt = new Date(Date.now() + params.stabilizationInterval * 1000);

  await db.update(marketMakerStrategies)
    .set({
      totalBuys: (strategy.totalBuys || 0) + 1,
      totalBuyAmount: (parseFloat(strategy.totalBuyAmount || '0') + stabilizationAmount).toString(),
      totalSpent: (parseFloat(strategy.totalSpent || '0') + stabilizationAmount * currentPrice).toString(),
      nextExecuteAt,
      lastExecutedAt: new Date(),
    })
    .where(eq(marketMakerStrategies.id, strategy.id));

  return {
    executed: true,
    transaction,
    amount: stabilizationAmount,
    price: currentPrice,
    nextExecuteAt,
    reason: '价格稳定'
  };
}

// 执行防砸盘
async function executeAntiDump(
  db: any,
  strategy: any,
  wallet: any,
  dumpDetection: any,
  currentPrice: number
): Promise<any> {
  const params = strategy.params as any;

  if (!params.antiDumpEnabled) {
    return { executed: false, reason: '防砸盘未启用' };
  }

  // 模拟反制买入（实际应用中需要调用区块链）
  const antiDumpAmount = parseFloat(params.antiDumpAmount);
  const mockTxHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  // 创建交易记录
  const newTransaction = {
    walletId: strategy.walletId,
    type: 'buy' as const,
    chain: wallet.chain,
    tokenAddress: strategy.tokenAddress,
    tokenSymbol: strategy.tokenSymbol,
    amount: antiDumpAmount.toString(),
    price: currentPrice.toString(),
    fee: (antiDumpAmount * currentPrice * 0.003).toString(),
    status: 'completed' as const,
    metadata: {
      strategyId: strategy.id,
      strategyType: 'market_maker',
      action: 'anti_dump',
      dumpAmount: dumpDetection.amount,
      txHash: mockTxHash,
    }
  };

  const validatedTxData = insertTransactionSchema.parse(newTransaction);
  const [transaction] = await db.insert(transactions)
    .values(validatedTxData)
    .returning();

  // 更新策略统计
  await db.update(marketMakerStrategies)
    .set({
      totalBuys: (strategy.totalBuys || 0) + 1,
      totalBuyAmount: (parseFloat(strategy.totalBuyAmount || '0') + antiDumpAmount).toString(),
      totalSpent: (parseFloat(strategy.totalSpent || '0') + antiDumpAmount * currentPrice).toString(),
      lastExecutedAt: new Date(),
    })
    .where(eq(marketMakerStrategies.id, strategy.id));

  // 记录机器人检测日志
  const newBotLog = {
    walletAddress: dumpDetection.walletAddress,
    tokenAddress: strategy.tokenAddress,
    platform: strategy.platform,
    detectionType: 'dump',
    confidence: dumpDetection.confidence,
    details: {
      txHash: mockTxHash,
      amount: antiDumpAmount.toString(),
      price: currentPrice.toString(),
      timestamp: new Date().toISOString(),
      reason: dumpDetection.reason,
      behavior: 'dumping',
      actionTaken: 'snipe_counter',
    },
    actionTaken: 'snipe_counter',
    strategyId: strategy.id,
  };

  const validatedBotLogData = insertBotDetectionLogSchema.parse(newBotLog);
  await db.insert(botDetectionLogs).values(validatedBotLogData);

  return {
    executed: true,
    transaction,
    amount: antiDumpAmount,
    price: currentPrice,
    reason: `防砸盘（${dumpDetection.reason}）`
  };
}

// POST /api/market-maker/execute/[id] - 执行策略
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await context.params;
    const body = await request.json();

    // 检查策略是否存在
    const [strategy] = await db.select()
      .from(marketMakerStrategies)
      .where(eq(marketMakerStrategies.id, id));

    if (!strategy) {
      return NextResponse.json(
        { success: false, error: '策略不存在' },
        { status: 404 }
      );
    }

    // 检查策略是否启用
    if (!strategy.isEnabled) {
      return NextResponse.json(
        { success: false, error: '策略未启用' },
        { status: 400 }
      );
    }

    // 获取钱包信息
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, strategy.walletId));
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    // 获取代币信息
    const [token] = await db.select().from(tokens).where(eq(tokens.address, strategy.tokenAddress));
    if (!token) {
      return NextResponse.json(
        { success: false, error: '代币不存在' },
        { status: 404 }
      );
    }

    const currentPrice = parseFloat(token.price || '0.000001');
    const maxSpend = parseFloat(strategy.maxSpend || '100');
    const totalSpent = parseFloat(strategy.totalSpent || '0');

    // 检查是否超过最大花费限制
    if (totalSpent >= maxSpend) {
      return NextResponse.json({
        success: false,
        error: '已达到最大花费限制',
        data: {
          totalSpent,
          maxSpend,
          remaining: 0
        }
      }, { status: 400 });
    }

    // 更新策略状态为运行中
    await db.update(marketMakerStrategies)
      .set({ status: 'running', lastExecutedAt: new Date() })
      .where(eq(marketMakerStrategies.id, id));

    // 根据触发类型执行不同的策略
    let result: any = { executed: false, reason: '无触发条件' };

    // 1. 托底买入（检查价格）
    if (strategy.strategyType === 'price_floor' || strategy.strategyType === 'comprehensive') {
      result = await executeFloorBuy(db, strategy, wallet, token, currentPrice);
    }

    // 2. 机器人狙击（传入检测到的机器人信息）
    if (body.botDetection) {
      const snipeResult = await executeBotSnipe(db, strategy, wallet, body.botDetection, currentPrice);
      if (snipeResult.executed) {
        result = snipeResult;
      }
    }

    // 3. 价格稳定（定期执行）
    if (strategy.strategyType === 'price_stabilization' || strategy.strategyType === 'comprehensive') {
      const stabilizeResult = await executePriceStabilization(db, strategy, wallet, currentPrice);
      if (stabilizeResult.executed) {
        result = stabilizeResult;
      }
    }

    // 4. 防砸盘（传入砸盘检测信息）
    if (body.dumpDetection) {
      const antiDumpResult = await executeAntiDump(db, strategy, wallet, body.dumpDetection, currentPrice);
      if (antiDumpResult.executed) {
        result = antiDumpResult;
      }
    }

    // 更新策略状态为空闲
    await db.update(marketMakerStrategies)
      .set({ status: 'idle' })
      .where(eq(marketMakerStrategies.id, id));

    return NextResponse.json({
      success: true,
      data: {
        strategy,
        result,
        remainingSpend: maxSpend - totalSpent - (result.executed ? (result.amount * result.price) : 0),
      },
      message: result.executed
        ? `策略执行成功：${result.reason}`
        : `策略未执行：${result.reason}`
    });

  } catch (error) {
    console.error('Execute strategy error:', error);

    // 出错时更新策略状态为空闲
    try {
      const db = await getDb();
      const { id: strategyId } = await context.params;
      await db.update(marketMakerStrategies)
        .set({ status: 'idle' })
        .where(eq(marketMakerStrategies.id, strategyId));
    } catch (updateError) {
      console.error('Update strategy status error:', updateError);
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '执行策略失败' },
      { status: 500 }
    );
  }
}
