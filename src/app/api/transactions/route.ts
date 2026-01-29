/**
 * 交易列表 API - 使用缓存优化
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';
import { cache } from '@/lib/cache';
import { generateCacheKey } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '缺少用户ID'
      }, { status: 400 });
    }

    // 生成缓存键
    const cacheKey = generateCacheKey('user_transactions', userId, limit, offset);

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
    const transactions = await db.query.transactionsTable.findMany({
      where: eq(transactionsTable.userId, userId),
      orderBy: [desc(transactionsTable.createdAt)],
      limit,
      offset
    });

    // 缓存结果 (30秒)
    cache.set(cacheKey, transactions, 30000);

    return NextResponse.json({
      success: true,
      data: transactions,
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
    const { userId, from, to, amount, txType, network = 'ethereum' } = body;

    // 创建交易
    const result = await db.insert(transactionsTable).values({
      userId,
      from,
      to,
      amount,
      txType,
      network,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    // 清除用户交易缓存
    const cacheKey = generateCacheKey('user_transactions', userId);
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
