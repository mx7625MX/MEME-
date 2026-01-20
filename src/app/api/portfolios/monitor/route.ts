import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { portfolios, transactions, wallets, settings } from '@/storage/database/shared/schema';
import { insertTransactionSchema } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';

// 模拟获取代币当前价格
async function getTokenPrice(chain: string, tokenAddress: string): Promise<number> {
  // 在实际应用中，应该调用价格API（如 Jupiter, CoinGecko, DEX Screener等）
  const prices: Record<string, Record<string, number>> = {
    solana: {
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 0.000000015, // BONK
      '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': 2.5, // WIF
    },
    eth: {
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 3000, // WETH
    },
    bsc: {
      '0x55d398326f99059fF775485246999027B3197955': 1.0, // USDT
    },
  };

  const chainPrices = prices[chain] || {};
  // 对于未知代币，返回模拟的价格波动
  if (chainPrices[tokenAddress]) {
    return chainPrices[tokenAddress];
  }

  // 模拟价格波动（实际应用中应该调用真实API）
  const basePrice = 0.000001;
  const randomFluctuation = (Math.random() - 0.5) * 0.0000005; // ±25% 波动
  return basePrice + randomFluctuation;
}

// 模拟检测大额买入（返回最近是否有大额买入，以及买入金额）
async function detectWhaleBuy(chain: string, tokenAddress: string, whaleThreshold: number): Promise<{ hasWhale: boolean; amount: number; txHash?: string }> {
  // 在实际应用中，应该：
  // 1. 连接到 DEX（如 Raydium, PancakeSwap, Uniswap）获取交易历史
  // 2. 分析最近 10-30 分钟的交易
  // 3. 检测是否有大额买入（超过阈值）
  
  // 模拟随机大额买入事件
  const randomWhale = Math.random() < 0.15; // 15% 概率检测到大额买入
  
  if (randomWhale) {
    const whaleAmount = whaleThreshold * (1 + Math.random() * 2); // 阈值的 1-3 倍
    return {
      hasWhale: true,
      amount: whaleAmount,
      txHash: `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`
    };
  }

  return { hasWhale: false, amount: 0 };
}

// 检查单个持仓是否需要触发自动卖出
async function checkPortfolio(portfolio: any, db: any): Promise<{ shouldSell: boolean; reason: string; currentPrice: number; whaleAmount?: number }> {
  const currentPrice = await getTokenPrice(portfolio.chain, portfolio.tokenAddress);
  const buyPrice = parseFloat(portfolio.buyPrice);
  const profitTarget = parseFloat(portfolio.profitTarget || '100');
  const stopLoss = parseFloat(portfolio.stopLoss || '30');
  const autoSellType = portfolio.autoSellType || 'both';
  const whaleThreshold = parseFloat(portfolio.whaleBuyThreshold || '0.5');

  // 计算当前利润百分比
  const currentProfitPercent = ((currentPrice - buyPrice) / buyPrice) * 100;

  // 1. 检查利润目标触发
  if (autoSellType === 'profit' || autoSellType === 'both') {
    if (currentProfitPercent >= profitTarget) {
      return {
        shouldSell: true,
        reason: `profit_target_reached`,
        currentPrice,
      };
    }

    // 检查止损触发
    if (currentProfitPercent <= -stopLoss) {
      return {
        shouldSell: true,
        reason: `stop_loss_triggered`,
        currentPrice,
      };
    }
  }

  // 2. 检查大额买入触发
  if (autoSellType === 'whale' || autoSellType === 'both') {
    const whaleDetection = await detectWhaleBuy(portfolio.chain, portfolio.tokenAddress, whaleThreshold);
    
    if (whaleDetection.hasWhale) {
      return {
        shouldSell: true,
        reason: `whale_buy_detected`,
        currentPrice,
        whaleAmount: whaleDetection.amount,
      };
    }
  }

  // 3. 检查定时卖出触发（针对无人买入的情况）
  if (portfolio.timedSellEnabled && portfolio.timedSellScheduledAt) {
    const scheduledTime = new Date(portfolio.timedSellScheduledAt);
    const now = new Date();
    
    // 如果已超过预定执行时间且尚未执行
    if (now >= scheduledTime && !portfolio.timedSellExecutedAt) {
      return {
        shouldSell: true,
        reason: `timed_sell_triggered`,
        currentPrice,
      };
    }
  }

  return {
    shouldSell: false,
    reason: '',
    currentPrice,
  };
}

// 执行闪电卖出
async function executeFlashSell(portfolio: any, db: any, reason: string, whaleAmount?: number) {
  const sellPercentage = parseFloat(portfolio.autoSellPercentage || '100');
  const amountToSell = (parseFloat(portfolio.amount) * sellPercentage / 100).toString();
  const currentPrice = await getTokenPrice(portfolio.chain, portfolio.tokenAddress);
  const slippage = 5; // 默认 5% 滑点
  
  // 计算卖出价格（考虑滑点）
  const slippageFactor = 1 - (slippage / 100);
  const sellPrice = currentPrice * slippageFactor;
  const estimatedReceive = parseFloat(amountToSell) * sellPrice;
  
  // 计算实际盈亏
  const profitLoss = (sellPrice - parseFloat(portfolio.buyPrice)) * parseFloat(amountToSell);
  const profitLossPercent = ((sellPrice - parseFloat(portfolio.buyPrice)) / parseFloat(portfolio.buyPrice) * 100);

  // 获取 Jito 配置（用于加速 Solana 交易）
  let useJito = false;
  let jitoShredKey = '';
  
  if (portfolio.chain === 'solana') {
    try {
      // 使用安全的密钥获取函数
      const { getDecryptedJitoKey } = await import('@/lib/jitoKeyManager');
      const decryptedKey = await getDecryptedJitoKey();
      
      if (decryptedKey) {
        useJito = true;
        jitoShredKey = decryptedKey;
        
        // 记录审计日志
        const { logAuditEvent } = await import('@/lib/audit');
        await logAuditEvent('jito_key_accessed', {
          action: 'access',
          resource: 'jito_shred_key',
          purpose: 'auto_sell',
          portfolioId: portfolio.id,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching Jito config:', error);
    }
  }

  // 模拟交易提交（实际应用中应该调用 Jito SDK 或 DEX API）
  let txHash = `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
  
  if (useJito && portfolio.chain === 'solana') {
    // 如果配置了 Jito，模拟使用 Jito 提交交易
    // 在实际应用中，应该使用 Jito SDK:
    // const jitoBundle = await createJitoBundle(transaction, jitoShredKey);
    // const bundleId = await submitJitoBundle(jitoBundle);
    // txHash = bundleId;
    txHash = `jito_${txHash}`; // 标记为 Jito 交易
  }

  // 创建交易记录
  const newTransaction = {
    walletId: portfolio.walletId,
    type: 'sell' as const,
    chain: portfolio.chain,
    tokenAddress: portfolio.tokenAddress,
    tokenSymbol: portfolio.tokenSymbol,
    amount: amountToSell,
    price: sellPrice.toString(),
    fee: (estimatedReceive * 0.003).toString(), // 0.3% 交易费
    status: 'completed' as const,
    metadata: {
      autoSell: true,
      triggerReason: reason,
      whaleAmount: whaleAmount?.toString(),
      slippage,
      estimatedReceive: estimatedReceive.toString(),
      profitLoss: profitLoss.toString(),
      profitLossPercent: profitLossPercent.toFixed(2),
      buyPrice: portfolio.buyPrice,
      executeTime: new Date().toISOString(),
      txHash,
      dex: portfolio.chain === 'solana' ? 'Raydium' : portfolio.chain === 'bsc' ? 'PancakeSwap' : 'Uniswap',
      useJito,
      jitoShredKey: useJito ? jitoShredKey.substring(0, 8) + '...' : undefined, // 只保存前 8 个字符用于验证
      portfolioId: portfolio.id
    }
  };

  const validatedTxData = insertTransactionSchema.parse(newTransaction);
  const [transaction] = await db.insert(transactions)
    .values(validatedTxData)
    .returning();

  // 更新持仓状态
  const remainingAmount = parseFloat(portfolio.amount) - parseFloat(amountToSell);
  
  if (remainingAmount <= 0.000001) {
    // 全部卖出，标记为sold
    await db.update(portfolios)
      .set({ 
        status: 'sold',
        autoSellStatus: 'completed',
        timedSellExecutedAt: new Date(),
        soldAt: new Date(),
        lastAutoSellAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(portfolios.id, portfolio.id));
  } else {
    // 部分卖出
    await db.update(portfolios)
      .set({ 
        amount: remainingAmount.toString(),
        currentPrice: currentPrice.toString(),
        totalValue: (remainingAmount * currentPrice).toString(),
        profitLoss: profitLoss.toString(),
        profitLossPercent: profitLossPercent.toFixed(2),
        autoSellStatus: 'completed',
        timedSellExecutedAt: new Date(),
        lastAutoSellAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(portfolios.id, portfolio.id));
  }

  // 更新钱包余额（模拟）
  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, portfolio.walletId));
  if (wallet) {
    await db.update(wallets)
      .set({ 
        balance: (parseFloat(wallet.balance) + estimatedReceive).toString(),
        updatedAt: new Date()
      })
      .where(eq(wallets.id, portfolio.walletId));
  }

  return {
    transaction,
    portfolio,
    estimatedReceive: estimatedReceive.toString(),
    profitLoss: profitLoss.toString(),
    profitLossPercent: profitLossPercent.toFixed(2),
  };
}

// 监控所有持仓
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const portfolioId = body.portfolioId; // 如果指定了 portfolioId，只监控该持仓

    // 获取所有启用了自动闪电卖出的活跃持仓
    const allPortfolios = portfolioId
      ? await db.select().from(portfolios)
          .where(and(
            eq(portfolios.id, portfolioId),
            eq(portfolios.status, 'active'),
            eq(portfolios.autoSellEnabled, true)
          ))
      : await db.select().from(portfolios)
          .where(and(
            eq(portfolios.status, 'active'),
            eq(portfolios.autoSellEnabled, true)
          ));

    const results: any[] = [];
    const errors: string[] = [];

    for (const portfolio of allPortfolios) {
      try {
        // 如果已经在触发状态，跳过
        if (portfolio.autoSellStatus === 'triggered') {
          continue;
        }

        // 检查是否需要触发卖出
        const checkResult = await checkPortfolio(portfolio, db);

        // 更新当前价格
        const currentProfitPercent = ((checkResult.currentPrice - parseFloat(portfolio.buyPrice)) / parseFloat(portfolio.buyPrice)) * 100;
        await db.update(portfolios)
          .set({
            currentPrice: checkResult.currentPrice.toString(),
            totalValue: (parseFloat(portfolio.amount) * checkResult.currentPrice).toString(),
            profitLoss: ((checkResult.currentPrice - parseFloat(portfolio.buyPrice)) * parseFloat(portfolio.amount)).toString(),
            profitLossPercent: currentProfitPercent.toFixed(2),
            updatedAt: new Date()
          })
          .where(eq(portfolios.id, portfolio.id));

        if (checkResult.shouldSell) {
          // 标记为触发状态
          await db.update(portfolios)
            .set({
              autoSellStatus: 'triggered',
              updatedAt: new Date()
            })
            .where(eq(portfolios.id, portfolio.id));

          // 执行闪电卖出
          const sellResult = await executeFlashSell(portfolio, db, checkResult.reason, checkResult.whaleAmount);

          results.push({
            portfolioId: portfolio.id,
            tokenSymbol: portfolio.tokenSymbol,
            action: 'auto_sell_executed',
            reason: checkResult.reason,
            whaleAmount: checkResult.whaleAmount,
            ...sellResult
          });
        } else {
          results.push({
            portfolioId: portfolio.id,
            tokenSymbol: portfolio.tokenSymbol,
            action: 'monitoring',
            currentPrice: checkResult.currentPrice,
            profitPercent: currentProfitPercent.toFixed(2),
          });
        }
      } catch (error) {
        console.error(`Error monitoring portfolio ${portfolio.id}:`, error);
        errors.push(`Portfolio ${portfolio.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        monitored: allPortfolios.length,
        autoSold: results.filter(r => r.action === 'auto_sell_executed').length,
        results,
        errors
      }
    });

  } catch (error) {
    console.error('Monitor portfolios error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '监控持仓失败' 
      },
      { status: 500 }
    );
  }
}

// 获取监控状态
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    let portfoliosWithAutoSell;
    
    if (portfolioId) {
      portfoliosWithAutoSell = await db
        .select()
        .from(portfolios)
        .where(and(
          eq(portfolios.autoSellEnabled, true),
          eq(portfolios.id, portfolioId)
        ));
    } else {
      portfoliosWithAutoSell = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.autoSellEnabled, true));
    }

    return NextResponse.json({
      success: true,
      data: portfoliosWithAutoSell.map(p => ({
        id: p.id,
        tokenSymbol: p.tokenSymbol,
        tokenAddress: p.tokenAddress,
        autoSellEnabled: p.autoSellEnabled,
        autoSellType: p.autoSellType,
        whaleBuyThreshold: p.whaleBuyThreshold,
        autoSellPercentage: p.autoSellPercentage,
        autoSellStatus: p.autoSellStatus,
        lastAutoSellAt: p.lastAutoSellAt,
        profitTarget: p.profitTarget,
        stopLoss: p.stopLoss,
        currentPrice: p.currentPrice,
        profitLossPercent: p.profitLossPercent,
        status: p.status,
      }))
    });
  } catch (error) {
    console.error('Get monitor status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取监控状态失败' 
      },
      { status: 500 }
    );
  }
}
