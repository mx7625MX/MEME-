import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { transactions, wallets } from '@/storage/database/shared/schema';
import { insertTransactionSchema } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/market-maker/batch-collect - 批量归集代币
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const { 
      walletIds, 
      targetWalletId, 
      tokenSymbol, 
      tokenAddress,
      chain = 'solana'
    } = body;
    
    if (!walletIds || walletIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要归集的钱包' },
        { status: 400 }
      );
    }
    
    if (!targetWalletId) {
      return NextResponse.json(
        { success: false, error: '请选择目标钱包' },
        { status: 400 }
      );
    }
    
    // 获取目标钱包信息
    const [targetWallet] = await db.select().from(wallets).where(eq(wallets.id, targetWalletId));
    
    if (!targetWallet) {
      return NextResponse.json(
        { success: false, error: '目标钱包不存在' },
        { status: 404 }
      );
    }
    
    const results = {
      success: [] as Array<{ walletId: string; walletName: string; collectedAmount: number; toWallet: string }>,
      failed: [] as Array<{ walletId: string; reason: string }>,
      totalCollected: 0,
      totalTransactions: 0
    };
    
    for (const walletId of walletIds) {
      if (walletId === targetWalletId) {
        results.failed.push({ walletId, reason: '不能归集到自身' });
        continue;
      }
      
      try {
        // 获取源钱包信息
        const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
        
        if (!wallet) {
          results.failed.push({ walletId, reason: '钱包不存在' });
          continue;
        }
        
        // 模拟查询代币余额（实际应用中需要调用区块链查询）
        // 这里假设归集所有余额的50%作为示例
        const walletBalance = parseFloat(wallet.balance);
        const collectAmount = walletBalance * 0.5;
        const gasFee = 0.001;
        
        if (collectAmount <= gasFee) {
          results.failed.push({ walletId, reason: '余额过少' });
          continue;
        }
        
        const actualAmount = collectAmount - gasFee;
        
        // 创建归集交易记录（从源钱包转出）
        const newTransaction = {
          walletId,
          type: 'transfer' as const,
          chain,
          tokenAddress,
          tokenSymbol: tokenSymbol || chain.toUpperCase(),
          amount: actualAmount.toString(),
          price: '0',
          fee: gasFee.toString(),
          status: 'completed' as const,
          metadata: {
            batchOperation: true,
            operationType: 'collect',
            toAddress: targetWallet.address,
            txHash: `0x${Array.from({ length: 64 }, () => 
              Math.floor(Math.random() * 16).toString(16)
            ).join('')}`,
          }
        };
        
        const validatedTxData = insertTransactionSchema.parse(newTransaction);
        await db.insert(transactions).values(validatedTxData).returning();
        
        // 更新源钱包余额
        await db.update(wallets)
          .set({ 
            balance: (walletBalance - collectAmount).toString(),
            updatedAt: new Date()
          })
          .where(eq(wallets.id, walletId));
        
        // 更新目标钱包余额
        const targetBalance = parseFloat(targetWallet.balance);
        await db.update(wallets)
          .set({ 
            balance: (targetBalance + actualAmount).toString(),
            updatedAt: new Date()
          })
          .where(eq(wallets.id, targetWalletId));
        
        results.success.push({
          walletId,
          walletName: wallet.name,
          collectedAmount: actualAmount,
          toWallet: targetWallet.name
        });
        
        results.totalCollected += actualAmount;
        results.totalTransactions++;
        
      } catch (error) {
        console.error(`Collect failed for wallet ${walletId}:`, error);
        results.failed.push({ walletId, reason: error instanceof Error ? error.message : '归集失败' });
      }
      
      // 添加小延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...results,
        message: `批量归集完成！成功归集 ${results.success.length} 个钱包，总计 ${results.totalCollected.toFixed(4)} ${tokenSymbol || chain.toUpperCase()}`
      }
    });
    
  } catch (error) {
    console.error('Batch collect error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '批量归集失败' },
      { status: 500 }
    );
  }
}
