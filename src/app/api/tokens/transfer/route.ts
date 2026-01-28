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
    const { walletId, chain, toAddress, tokenSymbol, amount, isNative = false } = body;
    
    if (!walletId || !chain || !toAddress || !amount) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: walletId, chain, toAddress, amount' },
        { status: 400 }
      );
    }

    // 验证地址格式
    if (chain === 'solana') {
      if (!toAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return NextResponse.json(
          { success: false, error: 'Solana 地址格式无效' },
          { status: 400 }
        );
      }
    } else {
      if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return NextResponse.json(
          { success: false, error: 'EVM 地址格式无效' },
          { status: 400 }
        );
      }
    }

    // 获取钱包信息
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    // 检查余额
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return NextResponse.json(
        { success: false, error: '余额不足' },
        { status: 400 }
      );
    }

    // 模拟转账逻辑
    const gasFee = isNative ? 0.001 : 0.01;
    const actualAmount = isNative ? parseFloat(amount) - gasFee : parseFloat(amount);
    
    // 创建交易记录
    const newTransaction = {
      walletId,
      type: 'transfer' as const,
      chain,
      toAddress,
      tokenSymbol: tokenSymbol || (isNative ? chain.toUpperCase() : 'TOKEN'),
      amount: actualAmount.toString(),
      price: '0',
      fee: gasFee.toString(),
      status: 'completed' as const,
      metadata: {
        isNative,
        from: wallet.address,
        to: toAddress,
        txHash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
      }
    };

    const validatedTxData = insertTransactionSchema.parse(newTransaction);
    const [transaction] = await db.insert(transactions)
      .values(validatedTxData)
      .returning();

    // 更新钱包余额（仅针对原生代币转账）
    if (isNative) {
      await db.update(wallets)
        .set({ 
          balance: (parseFloat(wallet.balance) - parseFloat(amount)).toString(),
          updatedAt: new Date().toISOString().toISOString()
        })
        .where(eq(wallets.id, walletId));
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        message: `转账成功！已发送 ${actualAmount} ${tokenSymbol || chain.toUpperCase()} 到 ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`
      }
    });

  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '转账失败' 
      },
      { status: 500 }
    );
  }
}
