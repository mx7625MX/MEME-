import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { transactions, wallets } from '@/storage/database/shared/schema';
import { insertTransactionSchema } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // 验证必填字段
    const { walletId, chain, tokenAddress, tokenSymbol, amount, slippage = 5 } = body;
    
    if (!walletId || !chain || !tokenAddress || !tokenSymbol || !amount) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: walletId, chain, tokenAddress, tokenSymbol, amount' },
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

    // 模拟闪电卖出逻辑（实际应用中需要调用 DEX 如 Raydium、PancakeSwap 等）
    // 计算滑点后的价格
    const basePrice = 0.000001; // 假设价格
    const slippageFactor = 1 - (slippage / 100);
    const estimatedReceive = parseFloat(amount) * basePrice * slippageFactor;
    
    // 创建交易记录
    const newTransaction = {
      walletId,
      type: 'sell' as const,
      chain,
      tokenAddress,
      tokenSymbol,
      amount: amount.toString(),
      price: basePrice.toString(),
      fee: (estimatedReceive * 0.003).toString(), // 0.3% 交易费
      status: 'completed' as const,
      metadata: {
        slippage,
        estimatedReceive: estimatedReceive.toString(),
        executeTime: new Date().toISOString(),
        txHash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
        dex: chain === 'solana' ? 'Raydium' : chain === 'bsc' ? 'PancakeSwap' : 'Uniswap'
      }
    };

    const validatedTxData = insertTransactionSchema.parse(newTransaction);
    const [transaction] = await db.insert(transactions)
      .values(validatedTxData)
      .returning();

    // 更新钱包余额（模拟）
    await db.update(wallets)
      .set({ 
        balance: (parseFloat(wallet.balance) + estimatedReceive).toString(),
        updatedAt: new Date().toISOString().toISOString()
      })
      .where(eq(wallets.id, walletId));

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        estimatedReceive: estimatedReceive.toString(),
        message: `闪电卖出成功！收到 ${estimatedReceive.toFixed(6)} ${chain.toUpperCase()}`
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
