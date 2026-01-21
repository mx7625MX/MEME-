import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { transactions, botDetectionLogs } from '@/storage/database/shared/schema';
import { insertBotDetectionLogSchema } from '@/storage/database/shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

// 机器人检测逻辑
function detectSuspiciousTransaction(
  tx: any,
  recentTransactions: any[]
): {
  isSuspicious: boolean;
  confidence: number;
  detectionType: string;
  reason: string;
  details: any;
} {
  const walletAddress = tx.walletAddress;
  const tokenAddress = tx.tokenAddress;
  const amount = parseFloat(tx.amount || '0');

  // 检测 1: 快速买入后立即卖出（套利机器人）
  if (tx.type === 'sell') {
    // 查找该钱包最近的买入记录
    const recentBuy = recentTransactions.find(
      (rtx) =>
        rtx.walletAddress === walletAddress &&
        rtx.tokenAddress === tokenAddress &&
        rtx.type === 'buy'
    );

    if (recentBuy) {
      const buyTime = new Date(recentBuy.createdAt).getTime();
      const sellTime = new Date(tx.createdAt).getTime();
      const interval = sellTime - buyTime;

      // 5秒内买入并卖出
      if (interval < 5000) {
        return {
          isSuspicious: true,
          confidence: 90 + Math.min(interval / 500, 10), // 90-100
          detectionType: 'rapid_buy_sell',
          reason: `快速买入后立即卖出（${interval}ms）`,
          details: {
            buyAmount: recentBuy.amount,
            sellAmount: tx.amount,
            buyPrice: recentBuy.price,
            sellPrice: tx.price,
            profitPercent: ((parseFloat(tx.price) - parseFloat(recentBuy.price)) / parseFloat(recentBuy.price) * 100).toFixed(2),
          }
        };
      }
    }
  }

  // 检测 2: 大额买入（可能是狙击机器人）
  if (tx.type === 'buy') {
    const avgBuyAmount = recentTransactions
      .filter((rtx) => rtx.type === 'buy')
      .reduce((sum: number, rtx: any) => sum + parseFloat(rtx.amount || '0'), 0) /
      (recentTransactions.filter((rtx) => rtx.type === 'buy').length || 1);

    if (amount > avgBuyAmount * 10 && amount > 1000) {
      return {
        isSuspicious: true,
        confidence: 75 + Math.min((amount / avgBuyAmount) / 10, 25), // 75-100
        detectionType: 'large_buy',
        reason: `大额买入（${amount.toFixed(0)} 代币，平均 ${avgBuyAmount.toFixed(0)}）`,
        details: {
          amount,
          avgBuyAmount,
          ratio: (amount / avgBuyAmount).toFixed(2),
        }
      };
    }
  }

  // 检测 3: 短时间内多次交易（高频交易机器人）
  const userRecentTxs = recentTransactions.filter(
    (rtx) => rtx.walletAddress === walletAddress && rtx.tokenAddress === tokenAddress
  );

  if (userRecentTxs.length >= 3) {
    // 计算时间范围
    const firstTx = userRecentTxs[userRecentTxs.length - 1];
    const lastTx = userRecentTxs[0];
    const timeRange = new Date(lastTx.createdAt).getTime() - new Date(firstTx.createdAt).getTime();

    // 1分钟内交易3次或以上
    if (timeRange < 60000 && userRecentTxs.length >= 3) {
      return {
        isSuspicious: true,
        confidence: 70 + Math.min(userRecentTxs.length, 30), // 70-100
        detectionType: 'pattern',
        reason: `短时间内多次交易（${userRecentTxs.length} 次交易，${timeRange}ms）`,
        details: {
          txCount: userRecentTxs.length,
          timeRange,
          avgInterval: (timeRange / (userRecentTxs.length - 1)).toFixed(0),
        }
      };
    }
  }

  // 检测 4: 砸盘行为（大额卖出）
  if (tx.type === 'sell' && amount > 10000) {
    // 检查是否导致价格大幅下跌
    const previousPrice = parseFloat(recentTransactions[0]?.price || '0');
    const currentPrice = parseFloat(tx.price || '0');

    if (previousPrice > 0 && currentPrice < previousPrice * 0.9) {
      return {
        isSuspicious: true,
        confidence: 85 + Math.min((1 - currentPrice / previousPrice) * 100, 15), // 85-100
        detectionType: 'dump',
        reason: `大额砸盘导致价格下跌（${((1 - currentPrice / previousPrice) * 100).toFixed(2)}%）`,
        details: {
          amount,
          previousPrice,
          currentPrice,
          priceDropPercent: ((1 - currentPrice / previousPrice) * 100).toFixed(2),
        }
      };
    }
  }

  return {
    isSuspicious: false,
    confidence: 0,
    detectionType: 'none',
    reason: '',
    details: null
  };
}

// POST /api/market-maker/detect-bot - 检测机器人交易
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    const { transaction, platform } = body;

    if (!transaction || !platform) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: transaction, platform' },
        { status: 400 }
      );
    }

    // 获取最近的交易记录（用于模式检测）
    const recentTransactions = await db.select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tokenAddress, transaction.tokenAddress),
          gte(transactions.createdAt, new Date(Date.now() - 60000)) // 最近1分钟
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(20);

    // 执行检测
    const detection = detectSuspiciousTransaction(transaction, recentTransactions);

    // 如果检测到可疑行为，记录到数据库
    if (detection.isSuspicious) {
      const newBotLog = {
        walletAddress: transaction.walletAddress,
        tokenAddress: transaction.tokenAddress,
        platform,
        detectionType: detection.detectionType,
        confidence: detection.confidence,
        details: {
          txHash: transaction.metadata?.txHash || '',
          amount: transaction.amount,
          price: transaction.price,
          timestamp: new Date().toISOString(),
          reason: detection.reason,
          behavior: detection.detectionType === 'rapid_buy_sell' ? 'scalping' :
                    detection.detectionType === 'large_buy' ? 'sniping' :
                    detection.detectionType === 'dump' ? 'dumping' : 'pattern',
          ...detection.details,
        },
        actionTaken: 'none', // 默认不采取行动，等待策略触发
      };

      const validatedBotLogData = insertBotDetectionLogSchema.parse(newBotLog);
      await db.insert(botDetectionLogs).values(validatedBotLogData);

      return NextResponse.json({
        success: true,
        data: {
          isBot: true,
          detection,
          botLog: validatedBotLogData,
          recommendation: '建议触发机器人狙击策略'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isBot: false,
        detection,
        message: '未检测到机器人行为'
      }
    });

  } catch (error) {
    console.error('Detect bot error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '检测机器人失败' },
      { status: 500 }
    );
  }
}

// GET /api/market-maker/detect-bot - 获取机器人检测日志
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('tokenAddress');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 构建查询条件
    const conditions: any[] = [];
    if (tokenAddress) conditions.push(eq(botDetectionLogs.tokenAddress, tokenAddress));
    if (platform) conditions.push(eq(botDetectionLogs.platform, platform));

    let logs;
    if (conditions.length > 0) {
      logs = await db
        .select()
        .from(botDetectionLogs)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(botDetectionLogs.createdAt))
        .limit(limit);
    } else {
      logs = await db
        .select()
        .from(botDetectionLogs)
        .orderBy(desc(botDetectionLogs.createdAt))
        .limit(limit);
    }

    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get bot logs error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取机器人日志失败' },
      { status: 500 }
    );
  }
}
