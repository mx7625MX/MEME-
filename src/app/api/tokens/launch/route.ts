import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { transactions, tokens, portfolios } from '@/storage/database/shared/schema';
import { insertTransactionSchema, insertTokenSchema, insertPortfolioSchema } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // 验证必填字段
    const { walletId, chain, tokenName, tokenSymbol, totalSupply, liquidity, imageUrl, imageKey, bundleBuyPercent } = body;

    if (!walletId || !chain || !tokenName || !tokenSymbol || !totalSupply) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: walletId, chain, tokenName, tokenSymbol, totalSupply' },
        { status: 400 }
      );
    }

    // 创作者捆绑买入逻辑 - 必须是第一个买家
    // 默认买入 10% 的供应量，确保创作者是第一个买家
    const bundleBuyPercentValue = bundleBuyPercent || 10; // 默认 10%
    const bundleBuyAmount = (parseFloat(totalSupply) * bundleBuyPercentValue / 100).toString();
    const initialPrice = '0.000001'; // 初始价格
    const bundleBuyCost = (parseFloat(bundleBuyAmount) * parseFloat(initialPrice)).toString();

    // 模拟代币发行逻辑（实际应用中需要调用区块链网络）
    // 这里我们创建一个代币地址和记录
    const mockTokenAddress = `0x${Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    
    // 创建代币记录
    const tokenMetadata: any = {
      creator: walletId,
      description: `${tokenName} (${tokenSymbol}) - Launch via Meme Master Pro`,
    };
    
    // 如果有图片信息，添加到 metadata 中
    if (imageUrl && imageKey) {
      tokenMetadata.imageUrl = imageUrl;
      tokenMetadata.imageKey = imageKey;
    }
    
    const newToken = {
      chain,
      address: mockTokenAddress,
      symbol: tokenSymbol,
      name: tokenName,
      decimals: 18,
      totalSupply: totalSupply.toString(),
      liquidity: liquidity ? liquidity.toString() : '0',
      price: '0.000001',
      isHot: false,
      metadata: tokenMetadata
    };

    const validatedTokenData = insertTokenSchema.parse(newToken);
    const [token] = await db.insert(tokens)
      .values(validatedTokenData)
      .returning();

    // 创建交易记录
    const newTransaction = {
      walletId,
      type: 'launch' as const,
      chain,
      tokenAddress: mockTokenAddress,
      tokenSymbol,
      amount: totalSupply.toString(),
      price: '0',
      fee: '0.01', // 假设 0.01 ETH/SOL 作为发行费用
      status: 'completed' as const,
      metadata: {
        tokenName,
        totalSupply,
        liquidity,
        txHash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
      }
    };

    const validatedTxData = insertTransactionSchema.parse(newTransaction);
    const [transaction] = await db.insert(transactions)
      .values(validatedTxData)
      .returning();

    // 创作者捆绑买入交易记录（必须是第一个买家）
    const bundleBuyTx = {
      walletId,
      type: 'buy' as const,
      chain,
      tokenAddress: mockTokenAddress,
      tokenSymbol,
      amount: bundleBuyAmount,
      price: initialPrice,
      fee: (parseFloat(bundleBuyCost) * 0.001).toString(), // 0.1% 交易费
      status: 'completed' as const,
      metadata: {
        bundleBuy: true, // 标记为捆绑买入
        bundleBuyPercent: bundleBuyPercentValue.toString(),
        txHash: `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
        isFirstBuyer: true, // 标记为第一个买家
      }
    };

    const validatedBundleBuyTxData = insertTransactionSchema.parse(bundleBuyTx);
    const [bundleBuyTransaction] = await db.insert(transactions)
      .values(validatedBundleBuyTxData)
      .returning();

    // 自动创建持仓记录（创作者模式）
    // 创作者持有剩余的供应量（总供应量 - 捆绑买入数量）
    const creatorHoldingAmount = (parseFloat(totalSupply) - parseFloat(bundleBuyAmount)).toString();
    const totalBuyAmount = bundleBuyCost; // 实际投入的资金

    const newPortfolio = {
      walletId,
      chain,
      tokenAddress: mockTokenAddress,
      tokenSymbol,
      tokenName,
      amount: creatorHoldingAmount, // 持有剩余的供应量
      buyPrice: initialPrice,
      buyAmount: totalBuyAmount, // 实际投入的资金
      currentPrice: initialPrice,
      profitTarget: body.profitTarget || '100', // 默认利润目标 100%
      stopLoss: body.stopLoss || '30', // 默认止损 30%
      totalInvested: totalBuyAmount,
      totalValue: totalBuyAmount,
      profitLoss: '0',
      profitLossPercent: '0',
      status: 'active',
      // 启用自动闪电卖出
      autoSellEnabled: body.autoSellEnabled !== false, // 默认启用
      autoSellType: body.autoSellType || 'both', // 默认同时监测利润和大额买入
      whaleBuyThreshold: body.whaleBuyThreshold || '0.5', // 默认大额买入阈值 0.5 ETH/SOL
      autoSellPercentage: body.autoSellPercentage || '100', // 默认全部卖出
      autoSellStatus: 'idle',
      // 启用定时卖出（针对无人买入的情况）
      timedSellEnabled: body.timedSellEnabled !== false, // 默认启用
      timedSellSeconds: body.timedSellSeconds || 5, // 默认 5 秒
      timedSellScheduledAt: new Date(Date.now() + (body.timedSellSeconds || 5) * 1000), // 预定 5 秒后执行
      timedSellExecutedAt: null,
      metadata: {
        creatorMode: true,
        launchTxHash: (transaction.metadata as any)?.txHash,
        bundleBuyTxHash: (bundleBuyTransaction.metadata as any)?.txHash, // 捆绑买入交易哈希
        bundleBuyPercent: bundleBuyPercentValue.toString(),
        bundleBuyAmount,
        isFirstBuyer: true, // 标记为第一个买家
        liquidityPool: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      }
    };

    const validatedPortfolioData = insertPortfolioSchema.parse(newPortfolio);
    const [portfolio] = await db.insert(portfolios)
      .values(validatedPortfolioData)
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        token,
        transaction,
        bundleBuyTransaction, // 捆绑买入交易记录
        portfolio,
        message: `代币发行成功！已自动创建持仓并启用闪电卖出监控。您是第一个买家（买入 ${bundleBuyPercentValue}% 供应量）`
      }
    });

  } catch (error) {
    console.error('Launch token error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '代币发行失败' 
      },
      { status: 500 }
    );
  }
}
