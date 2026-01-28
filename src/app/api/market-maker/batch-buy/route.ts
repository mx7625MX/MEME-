import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { transactions, wallets, tokens } from '@/storage/database/shared/schema';
import { insertTransactionSchema } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/market-maker/batch-buy - 批量买入代币
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const { 
      walletIds, 
      tokenSymbol, 
      tokenAddress, 
      buyAmountPerWallet,
      chain = 'solana',
      price = '0.000001'
    } = body;
    
    if (!walletIds || walletIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择钱包' },
        { status: 400 }
      );
    }
    
    if (!tokenSymbol || !buyAmountPerWallet) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    const results = {
      success: [] as Array<{ walletId: string; walletName: string; transactionId: string; amount: number; spent: number }>,
      failed: [] as Array<{ walletId: string; reason: string }>,
      totalAmount: 0,
      totalSpent: 0
    };
    
    const buyAmount = parseFloat(buyAmountPerWallet);
    const buyPrice = parseFloat(price);
    
    for (const walletId of walletIds) {
      try {
        // 获取钱包信息
        const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
        
        if (!wallet) {
          results.failed.push({ walletId, reason: '钱包不存在' });
          continue;
        }
        
        // 检查余额
        const walletBalance = parseFloat(wallet.balance);
        const estimatedCost = buyAmount * buyPrice;
        const gasFee = 0.001; // 估算的Gas费用
        
        if (walletBalance < estimatedCost + gasFee) {
          results.failed.push({ walletId, reason: '余额不足' });
          continue;
        }
        
        // 创建交易记录
        const newTransaction = {
          walletId,
          type: 'buy' as const,
          chain,
          tokenAddress,
          tokenSymbol,
          amount: buyAmount.toString(),
          price: price,
          fee: gasFee.toString(),
          status: 'completed' as const,
          metadata: {
            batchOperation: true,
            txHash: `0x${Array.from({ length: 64 }, () => 
              Math.floor(Math.random() * 16).toString(16)
            ).join('')}`,
          }
        };
        
        const validatedTxData = insertTransactionSchema.parse(newTransaction);
        const [transaction] = await db.insert(transactions).values(validatedTxData).returning();
        
        // 更新钱包余额
        const newBalance = walletBalance - estimatedCost - gasFee;
        await db.update(wallets)
          .set({ 
            balance: newBalance.toString(),
            updatedAt: new Date().toISOString().toISOString()
          })
          .where(eq(wallets.id, walletId));
        
        results.success.push({
          walletId,
          walletName: wallet.name,
          transactionId: transaction.id,
          amount: buyAmount,
          spent: estimatedCost
        });
        
        results.totalAmount += buyAmount;
        results.totalSpent += estimatedCost;
        
      } catch (error) {
        console.error(`Buy failed for wallet ${walletId}:`, error);
        results.failed.push({ walletId, reason: error instanceof Error ? error.message : '买入失败' });
      }
      
      // 添加小延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...results,
        message: `批量买入完成！成功 ${results.success.length} 笔，失败 ${results.failed.length} 笔`
      }
    });
    
  } catch (error) {
    console.error('Batch buy error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '批量买入失败' },
      { status: 500 }
    );
  }
}
