import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { marketMakerStrategies, transactions, tokens } from '@/storage/database/shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

// GET /api/market-maker/performance/[id] - 获取策略性能分析报告
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    // 获取时间范围参数（默认7天）
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 获取策略信息
    const [strategy] = await db.select()
      .from(marketMakerStrategies)
      .where(eq(marketMakerStrategies.id, id));

    if (!strategy) {
      return NextResponse.json(
        { success: false, error: '策略不存在' },
        { status: 404 }
      );
    }

    // 获取策略相关的所有交易记录
    const strategyTransactions = await db.select()
      .from(transactions)
      .where(
        and(
          eq(transactions.walletId, strategy.walletId),
          gte(transactions.createdAt, startDate),
          // 通过 metadata 筛选该策略的交易
        )
      )
      .orderBy(desc(transactions.createdAt));

    // 筛选属于该策略的交易
    const strategyTxs = strategyTransactions.filter(
      (tx) => tx.metadata && (tx.metadata as any).strategyId === id
    );

    // 获取代币信息
    const [token] = await db.select()
      .from(tokens)
      .where(eq(tokens.address, strategy.tokenAddress));

    const currentPrice = parseFloat(token?.price || '0');
    const initialPrice = token?.metadata && (token.metadata as any).initialPrice
      ? parseFloat((token.metadata as any).initialPrice)
      : currentPrice;

    // 计算性能指标
    const performance = calculatePerformanceMetrics(strategy, strategyTxs, currentPrice, initialPrice, days);

    return NextResponse.json({
      success: true,
      data: {
        strategy,
        performance,
        transactions: strategyTxs,
        timeRange: {
          startDate,
          endDate: new Date(),
          days,
        },
      },
    });
  } catch (error) {
    console.error('Get strategy performance error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取性能分析失败' },
      { status: 500 }
    );
  }
}

// 计算性能指标
function calculatePerformanceMetrics(
  strategy: any,
  transactions: any[],
  currentPrice: number,
  initialPrice: number,
  days: number
) {
  // 基础统计
  const totalTrades = transactions.length;
  const buyTrades = transactions.filter((tx) => tx.type === 'buy');
  const sellTrades = transactions.filter((tx) => tx.type === 'sell');

  const totalBuyAmount = parseFloat(strategy.totalBuyAmount || '0');
  const totalSpent = parseFloat(strategy.totalSpent || '0');

  // 计算盈亏
  let totalProfit = 0;
  let totalLoss = 0;

  const buyMap = new Map<string, any>();

  // 记录买入交易
  buyTrades.forEach((tx) => {
    buyMap.set(tx.id, {
      amount: parseFloat(tx.amount),
      price: parseFloat(tx.price),
      cost: parseFloat(tx.amount) * parseFloat(tx.price),
    });
  });

  // 计算卖出盈亏
  sellTrades.forEach((tx) => {
    const sellAmount = parseFloat(tx.amount);
    const sellPrice = parseFloat(tx.price);
    const sellRevenue = sellAmount * sellPrice;

    // 查找匹配的买入（简化处理，实际应使用 FIFO）
    for (const [buyId, buy] of buyMap.entries()) {
      if (buy.amount > 0) {
        const matchedAmount = Math.min(sellAmount, buy.amount);
        const matchedCost = (matchedAmount / buy.amount) * buy.cost;
        const pnl = matchedAmount * sellPrice - matchedCost;

        if (pnl >= 0) {
          totalProfit += pnl;
        } else {
          totalLoss += Math.abs(pnl);
        }

        buy.amount -= matchedAmount;
        if (buy.amount <= 0) {
          buyMap.delete(buyId);
        }
        break;
      }
    }
  });

  const totalPnL = totalProfit - totalLoss;

  // 计算胜率
  const winCount = transactions.filter((tx) => {
    if (tx.type !== 'sell') return false;
    // 简化计算，实际应比较买入和卖出价格
    return parseFloat(tx.price) > parseFloat(tx.metadata?.buyPrice || '0');
  }).length;
  const winRate = totalTrades > 0 ? (winCount / sellTrades.length) * 100 : 0;

  // 计算平均交易
  const avgTradeSize = totalTrades > 0 ? totalBuyAmount / totalTrades : 0;
  const avgTradeValue = totalTrades > 0 ? totalSpent / totalTrades : 0;

  // 计算最大回撤
  const maxDrawdown = calculateMaxDrawdown(transactions, currentPrice);

  // 计算夏普比率（简化版）
  const sharpeRatio = calculateSharpeRatio(transactions, totalPnL);

  // 计算收益率
  const totalReturn = totalSpent > 0 ? (totalPnL / totalSpent) * 100 : 0;

  // 计算持仓价值
  const remainingAmount = totalBuyAmount - sellTrades.reduce(
    (sum, tx) => sum + parseFloat(tx.amount),
    0
  );
  const positionValue = remainingAmount * currentPrice;

  // 策略执行效率
  const executionEfficiency = strategy.totalBuys > 0
    ? (transactions.filter((tx) => tx.status === 'completed').length / strategy.totalBuys) * 100
    : 100;

  // 风险指标
  const riskMetrics = {
    maxDrawdown,
    var95: calculateVaR(transactions, 0.95), // 95% 置信度的风险价值
    volatility: calculateVolatility(transactions),
  };

  return {
    // 基础指标
    totalTrades,
    buyCount: buyTrades.length,
    sellCount: sellTrades.length,
    totalBuyAmount: totalBuyAmount.toFixed(2),
    totalSpent: totalSpent.toFixed(2),

    // 盈亏指标
    totalProfit: totalProfit.toFixed(4),
    totalLoss: totalLoss.toFixed(4),
    totalPnL: totalPnL.toFixed(4),
    totalReturn: totalReturn.toFixed(2) + '%',
    winRate: winRate.toFixed(2) + '%',

    // 持仓指标
    remainingAmount: remainingAmount.toFixed(2),
    positionValue: positionValue.toFixed(4),
    currentPrice: currentPrice.toFixed(8),
    priceChange: initialPrice > 0
      ? ((currentPrice - initialPrice) / initialPrice * 100).toFixed(2) + '%'
      : '0%',

    // 交易指标
    avgTradeSize: avgTradeSize.toFixed(2),
    avgTradeValue: avgTradeValue.toFixed(4),

    // 风险指标
    maxDrawdown: maxDrawdown.toFixed(2) + '%',
    sharpeRatio: sharpeRatio.toFixed(2),
    riskMetrics,

    // 执行效率
    executionEfficiency: executionEfficiency.toFixed(2) + '%',
    successRate: transactions.filter((tx) => tx.status === 'completed').length / totalTrades * 100 + '%',

    // 成本分析
    totalFees: transactions.reduce((sum, tx) => sum + parseFloat(tx.fee || '0'), 0).toFixed(4),
    avgFeePerTrade: totalTrades > 0
      ? (transactions.reduce((sum, tx) => sum + parseFloat(tx.fee || '0'), 0) / totalTrades).toFixed(4)
      : '0',

    // 时间分析
    firstTradeDate: transactions.length > 0 ? transactions[transactions.length - 1].createdAt : null,
    lastTradeDate: transactions.length > 0 ? transactions[0].createdAt : null,
    avgTradesPerDay: days > 0 ? (totalTrades / days).toFixed(2) : '0',
  };
}

// 计算最大回撤
function calculateMaxDrawdown(transactions: any[], currentPrice: number) {
  if (transactions.length === 0) return 0;

  let maxDrawdown = 0;
  let peak = 0;

  // 简化计算，使用交易价格计算
  const prices = [currentPrice, ...transactions.map((tx) => parseFloat(tx.price || '0'))];

  prices.forEach((price) => {
    if (price > peak) {
      peak = price;
    }
    const drawdown = peak > 0 ? ((peak - price) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return maxDrawdown;
}

// 计算夏普比率（简化版）
function calculateSharpeRatio(transactions: any[], totalPnL: number) {
  if (transactions.length === 0) return 0;

  // 简化计算：总收益 / 总风险
  // 实际应使用无风险利率调整后的收益率标准差
  const totalReturn = totalPnL;
  const totalRisk = transactions.length; // 简化使用交易次数作为风险度量

  return totalRisk > 0 ? (totalReturn / totalRisk) * 100 : 0;
}

// 计算风险价值（VaR）
function calculateVaR(transactions: any[], confidenceLevel: number) {
  if (transactions.length === 0) return 0;

  // 计算每次交易的收益率
  const returns = [];
  for (let i = 1; i < transactions.length; i++) {
    const price1 = parseFloat(transactions[i - 1].price || '0');
    const price2 = parseFloat(transactions[i].price || '0');
    if (price1 > 0) {
      returns.push((price2 - price1) / price1);
    }
  }

  if (returns.length === 0) return 0;

  // 排序并找到对应置信度的分位数
  returns.sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * returns.length);
  const varValue = returns[index] || 0;

  return (varValue * 100).toFixed(2) + '%';
}

// 计算波动率
function calculateVolatility(transactions: any[]) {
  if (transactions.length < 2) return 0;

  const prices = transactions.map((tx) => parseFloat(tx.price || '0'));
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;

  const volatility = Math.sqrt(variance);

  return mean > 0 ? (volatility / mean * 100).toFixed(2) + '%' : '0%';
}
