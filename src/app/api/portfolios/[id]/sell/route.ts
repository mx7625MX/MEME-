import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { portfolios, transactions, wallets } from '@/storage/database/shared/schema';
import { insertTransactionSchema } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';

// 快速卖出持仓
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const body = await request.json();
    
    // 验证持仓是否存在
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: '持仓不存在' },
        { status: 404 }
      );
    }

    if (portfolio.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '该持仓已卖出或关闭' },
        { status: 400 }
      );
    }

    const { sellAmount, slippage = 5 } = body;
    
    // 如果没有指定卖出数量，默认卖出全部
    const amountToSell = sellAmount || portfolio.amount;
    
    // 模拟闪电卖出逻辑（实际应用中需要调用 DEX）
    const currentPrice = portfolio.currentPrice || portfolio.buyPrice;
    const slippageFactor = 1 - (slippage / 100);
    const sellPrice = parseFloat(currentPrice) * slippageFactor;
    const estimatedReceive = parseFloat(amountToSell) * sellPrice;
    
    // 计算实际盈亏
    const profitLoss = (sellPrice - parseFloat(portfolio.buyPrice)) * parseFloat(amountToSell);
    const profitLossPercent = ((sellPrice - parseFloat(portfolio.buyPrice)) / parseFloat(portfolio.buyPrice) * 100);
    
    // 创建交易记录
    const newTransaction = {
      walletId: portfolio.walletId,
      type: 'sell' as const,
      chain: portfolio.chain,
      tokenAddress: portfolio.tokenAddress,
      tokenSymbol: portfolio.tokenSymbol,
      amount: amountToSell.toString(),
      price: sellPrice.toString(),
      fee: (estimatedReceive * 0.003).toString(), // 0.3% 交易费
      status: 'completed' as const,
      metadata: {
        slippage,
        estimatedReceive: estimatedReceive.toString(),
        profitLoss: profitLoss.toString(),
        profitLossPercent: profitLossPercent.toFixed(2),
        buyPrice: portfolio.buyPrice,
        executeTime: new Date().toISOString(),
        txHash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
        dex: portfolio.chain === 'solana' ? 'Raydium' : portfolio.chain === 'bsc' ? 'PancakeSwap' : 'Uniswap',
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
          soldAt: new Date(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(portfolios.id, id));
    } else {
      // 部分卖出
      await db.update(portfolios)
        .set({ 
          amount: remainingAmount.toString(),
          totalValue: (remainingAmount * sellPrice).toString(),
          profitLoss: profitLoss.toString(),
          profitLossPercent: profitLossPercent.toFixed(2),
          updatedAt: new Date().toISOString()
        })
        .where(eq(portfolios.id, id));
    }

    // 更新钱包余额（模拟）
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, portfolio.walletId));
    if (wallet) {
      await db.update(wallets)
        .set({ 
          balance: (parseFloat(wallet.balance) + estimatedReceive).toString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(wallets.id, portfolio.walletId));
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        portfolio,
        estimatedReceive: estimatedReceive.toString(),
        profitLoss: profitLoss.toString(),
        profitLossPercent: profitLossPercent.toFixed(2),
        message: `闪电卖出成功！收到 ${estimatedReceive.toFixed(6)} ${portfolio.chain.toUpperCase()} ${profitLoss >= 0 ? '盈利' : '亏损'} ${Math.abs(profitLossPercent).toFixed(2)}%`
      }
    });

  } catch (error) {
    console.error('Flash sell error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '闪电卖出失败' 
      },
      { status: 500 }
    );
  }
}
