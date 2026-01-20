import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { transactions, tokens } from '@/storage/database/shared/schema';
import { insertTransactionSchema, insertTokenSchema } from '@/storage/database/shared/schema';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // 验证必填字段
    const { walletId, chain, tokenName, tokenSymbol, totalSupply, liquidity } = body;
    
    if (!walletId || !chain || !tokenName || !tokenSymbol || !totalSupply) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: walletId, chain, tokenName, tokenSymbol, totalSupply' },
        { status: 400 }
      );
    }

    // 模拟代币发行逻辑（实际应用中需要调用区块链网络）
    // 这里我们创建一个代币地址和记录
    const mockTokenAddress = `0x${Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    
    // 创建代币记录
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
      metadata: {
        creator: walletId,
        description: `${tokenName} (${tokenSymbol}) - Launch via Meme Master Pro`,
      }
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

    return NextResponse.json({
      success: true,
      data: {
        token,
        transaction,
        message: '代币发行成功！'
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
