/**
 * 交易列表 API - 使用缓存优化
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { transactions } from '@/storage/database/shared/schema';
import { cache } from '@/lib/cache';
import { generateCacheKey } from '@/lib/cache';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!walletId) {
      return NextResponse.json({
        success: false,
        error: '缺少钱包ID'
      }, { status: 400 });
    }

    // 生成缓存键
    const cacheKey = generateCacheKey('wallet_transactions', walletId, limit, offset);

    // 尝试从缓存获取
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('缓存命中:', cacheKey);
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // 从数据库查询
    const db = await getDb();
    const txList = await db.select()
      .from(transactions)
      .where(eq(transactions.walletId, walletId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // 缓存结果 (30秒)
    cache.set(cacheKey, txList, 30000);

    return NextResponse.json({
      success: true,
      data: txList,
      cached: false
    });
  } catch (error) {
    console.error('获取交易列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取交易列表失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId, type, chain, tokenAddress, tokenSymbol, amount, price, fee = '0', txHash, metadata = {} } = body;

    if (!walletId || !type || !chain || !amount) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数: walletId, type, chain, amount'
      }, { status: 400 });
    }

    // 创建交易
    const db = await getDb();
    const result = await db.insert(transactions).values({
      walletId,
      type,
      chain,
      tokenAddress,
      tokenSymbol,
      amount: amount.toString(),
      price: price?.toString(),
      fee: fee.toString(),
      txHash,
      status: 'pending',
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    // 清除钱包交易缓存
    const cacheKey = generateCacheKey('wallet_transactions', walletId);
    cache.delete(cacheKey);

    return NextResponse.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('创建交易失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建交易失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
