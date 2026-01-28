import { NextRequest, NextResponse } from 'next/server';
import { privacyProtectionService } from '@/services/privacy-protection/privacy-service';
import { getDb } from '@/storage/database/db';
import { wallets } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/privacy/analyze
 * 分析钱包的追踪风险
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId } = body;

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    // 查询钱包信息
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // 执行追踪分析
    const trackingAnalysis = await privacyProtectionService.analyzeWalletTracking(
      wallet.address,
      wallet.chain
    );

    return NextResponse.json({
      success: true,
      walletId,
      address: wallet.address,
      chain: wallet.chain,
      trackingAnalysis,
    });
  } catch (error) {
    console.error('Failed to analyze wallet tracking:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze wallet tracking',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/privacy/analyze?walletId=xxx
 * 生成完整的钱包隐私报告
 */
export async function GET(request: NextRequest) {
  try {
    const walletId = request.nextUrl.searchParams.get('walletId');
    
    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    // 生成隐私报告
    const report = await privacyProtectionService.generateWalletPrivacyReport(walletId);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Failed to generate privacy report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate privacy report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
