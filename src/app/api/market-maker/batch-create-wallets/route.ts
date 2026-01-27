import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { wallets } from '@/storage/database/shared/schema';
import { insertWalletSchema } from '@/storage/database/shared/schema';

// POST /api/market-maker/batch-create-wallets - 批量创建钱包
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const { count = 5, chain = 'solana', prefix = 'MM' } = body;
    
    if (count < 1 || count > 100) {
      return NextResponse.json(
        { success: false, error: '钱包数量必须在1-100之间' },
        { status: 400 }
      );
    }
    
    const createdWallets = [];
    
    for (let i = 0; i < count; i++) {
      // 生成随机地址（实际应用中需要调用真实的区块链SDK）
      const randomAddress = Array.from({ length: 44 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      const newWallet = {
        name: `${prefix}-${(i + 1).toString().padStart(3, '0')}`,
        chain,
        address: `${randomAddress.substring(0, 8)}...${randomAddress.substring(36)}`,
        balance: '0',
        isActive: true,
      };
      
      const validatedData = insertWalletSchema.pick({
        name: true,
        chain: true,
        address: true,
        balance: true,
        isActive: true,
      }).parse(newWallet);
      
      const [wallet] = await db.insert(wallets).values(validatedData).returning();
      createdWallets.push(wallet);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        wallets: createdWallets,
        count: createdWallets.length,
        message: `成功创建 ${createdWallets.length} 个钱包`
      }
    });
    
  } catch (error) {
    console.error('Batch create wallets error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '批量创建钱包失败' },
      { status: 500 }
    );
  }
}
