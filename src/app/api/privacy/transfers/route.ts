import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { privacyTransfers } from '@/storage/database/shared/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/privacy/transfers?walletId=xxx&limit=20
 * 查询隐私转账历史
 */
export async function GET(request: NextRequest) {
  try {
    const walletId = request.nextUrl.searchParams.get('walletId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const status = request.nextUrl.searchParams.get('status');

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    const conditions = [eq(privacyTransfers.fromWalletId, walletId)];

    if (status) {
      conditions.push(eq(privacyTransfers.status, status));
    }

    const db = await getDb();
    const transfers = await db.select()
      .from(privacyTransfers)
      .where(and(...conditions))
      .orderBy(desc(privacyTransfers.createdAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      transfers,
      total: transfers.length,
    });
  } catch (error) {
    console.error('Failed to fetch privacy transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy transfers' },
      { status: 500 }
    );
  }
}
