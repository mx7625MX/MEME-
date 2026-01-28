import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { portfolios, wallets } from '@/storage/database/shared/schema';
import { insertPortfolioSchema } from '@/storage/database/shared/schema';
import { eq, desc } from 'drizzle-orm';

// 获取所有持仓
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const status = searchParams.get('status') || 'active';

    let query = db
      .select({
        portfolio: portfolios,
        wallet: {
          id: wallets.id,
          name: wallets.name,
          address: wallets.address,
        }
      })
      .from(portfolios)
      .leftJoin(wallets, eq(portfolios.walletId, wallets.id));

    // 应用状态过滤
    const results = await query.where(eq(portfolios.status, status));

    // 过滤钱包ID（如果有指定）
    const filteredResults = walletId 
      ? results.filter(r => r.portfolio.walletId === walletId)
      : results;

    // 按创建时间排序
    const sortedResults = filteredResults.sort((a, b) => 
      new Date(b.portfolio.createdAt).getTime() - new Date(a.portfolio.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedResults.map(r => ({
        ...r.portfolio,
        wallet: r.wallet
      }))
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取持仓列表失败' },
      { status: 500 }
    );
  }
}

// 添加持仓
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // 验证必填字段
    const { walletId, chain, tokenAddress, tokenSymbol, amount, buyPrice, buyAmount } = body;
    
    if (!walletId || !chain || !tokenAddress || !tokenSymbol || !amount || !buyPrice || !buyAmount) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证钱包是否存在
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    // 检查是否已存在该代币的持仓
    const [existing] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.tokenAddress, tokenAddress))
      .limit(1);

    let portfolio;
    
    if (existing && existing.status === 'active') {
      // 更新现有持仓（追加买入）
      const newAmount = parseFloat(existing.amount) + parseFloat(amount);
      const newInvested = parseFloat(existing.totalInvested) + parseFloat(buyAmount);
      const newBuyPrice = newInvested / newAmount; // 重新计算平均买入价

      [portfolio] = await db
        .update(portfolios)
        .set({
          amount: newAmount.toString(),
          buyPrice: newBuyPrice.toString(),
          totalInvested: newInvested.toString(),
          currentPrice: buyPrice.toString(),
          totalValue: (newAmount * parseFloat(buyPrice)).toString(),
          updatedAt: new Date()
        })
        .where(eq(portfolios.id, existing.id))
        .returning();
    } else {
      // 创建新持仓
      const newPortfolio = {
        walletId,
        chain,
        tokenAddress,
        tokenSymbol,
        tokenName: body.tokenName || tokenSymbol,
        amount: amount.toString(),
        buyPrice: buyPrice.toString(),
        buyAmount: buyAmount.toString(),
        currentPrice: buyPrice.toString(),
        profitTarget: body.profitTarget || null,
        stopLoss: body.stopLoss || null,
        totalInvested: buyAmount.toString(),
        totalValue: (parseFloat(amount) * parseFloat(buyPrice)).toString(),
        profitLoss: '0',
        profitLossPercent: '0',
        status: 'active',
        metadata: body.metadata || {}
      };

      const validatedData = insertPortfolioSchema.parse(newPortfolio);
      [portfolio] = await db.insert(portfolios).values(validatedData).returning();
    }

    return NextResponse.json({
      success: true,
      data: portfolio,
      message: existing ? '持仓已更新' : '持仓已创建'
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建持仓失败' },
      { status: 500 }
    );
  }
}
