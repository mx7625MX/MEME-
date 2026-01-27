import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { transactions, wallets } from '@/storage/database/shared/schema';
import { insertTransactionSchema } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/market-maker/batch-sell - 批量卖出代币
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const { 
      walletIds, 
      tokenSymbol, 
      tokenAddress,
      chain = 'solana',
      sellPercentage = 100, // 卖出百分比
      currentPrice = '0.000002' // 当前价格
    } = body;
    
    if (!walletIds || walletIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择钱包' },
        { status: 400 }
      );
    }
    
    if (!tokenSymbol) {
      return NextResponse.json(
        { success: false, error: '缺少代币符号' },
        { status: 400 }
      );
    }
    
    const results = {
      success: [],
      failed: [],
      totalSoldAmount: 0,
      totalReceived: 0
    };
    
    const sellPct = parseFloat(sellPercentage.toString()) / 100;
    const price = parseFloat(currentPrice);
    
    for (const walletId of walletIds) {
      try {
        // 获取钱包信息
        const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
        
        if (!wallet) {
          results.failed.push({ walletId, reason: '钱包不存在' });
          continue;
        }
        
        // 模拟查询代币持仓（实际应用中需要调用区块链查询）
        // 这里假设钱包余额的80%是代币价值（简化处理）
        const walletBalance = parseFloat(wallet.balance);
        const tokenValue = walletBalance * 0.8;
        
        if (tokenValue <= 0) {
          results.failed.push({ walletId, reason: '没有代币持仓' });
          continue;
        }
        
        const sellValue = tokenValue * sellPct;
        const gasFee = 0.001;
        const actualReceive = sellValue - gasFee;
        
        if (actualReceive <= 0) {
          results.failed.push({ walletId, reason: '卖出金额过少' });
          continue;
        }
        
        // 计算卖出的代币数量
        const soldTokenAmount = sellValue / price;
        
        // 创建交易记录
        const newTransaction = {
          walletId,
          type: 'sell' as const,
          chain,
          tokenAddress,
          tokenSymbol,
          amount: soldTokenAmount.toString(),
          price: currentPrice,
          fee: gasFee.toString(),
          status: 'completed' as const,
          metadata: {
            batchOperation: true,
            sellPercentage: sellPercentage,
            txHash: `0x${Array.from({ length: 64 }, () => 
              Math.floor(Math.random() * 16).toString(16)
            ).join('')}`,
          }
        };
        
        const validatedTxData = insertTransactionSchema.parse(newTransaction);
        await db.insert(transactions).values(validatedTxData).returning();
        
        // 更新钱包余额（卖出后增加原生代币余额）
        const newBalance = walletBalance - tokenValue * sellPct + actualReceive;
        await db.update(wallets)
          .set({ 
            balance: newBalance.toString(),
            updatedAt: new Date()
          })
          .where(eq(wallets.id, walletId));
        
        results.success.push({
          walletId,
          walletName: wallet.name,
          soldAmount: soldTokenAmount,
          receivedAmount: actualReceive
        });
        
        results.totalSoldAmount += soldTokenAmount;
        results.totalReceived += actualReceive;
        
      } catch (error) {
        console.error(`Sell failed for wallet ${walletId}:`, error);
        results.failed.push({ walletId, reason: error instanceof Error ? error.message : '卖出失败' });
      }
      
      // 添加小延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...results,
        message: `批量卖出完成！成功卖出 ${results.success.length} 笔，总计 ${results.totalSoldAmount.toFixed(0)} ${tokenSymbol}，获得 ${results.totalReceived.toFixed(4)} ${chain.toUpperCase()}`
      }
    });
    
  } catch (error) {
    console.error('Batch sell error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '批量卖出失败' },
      { status: 500 }
    );
  }
}
