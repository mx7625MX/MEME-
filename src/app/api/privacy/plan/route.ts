import { NextRequest, NextResponse } from 'next/server';
import { privacyProtectionService } from '@/services/privacy-protection/privacy-service';
import { PrivacyLevel } from '@/services/privacy-protection/types';

/**
 * POST /api/privacy/plan
 * 规划隐私转账路径
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fromWalletId,
      toAddress,
      amount,
      tokenSymbol,
      chain,
      privacyLevel,
      customConfig,
    } = body;

    // 验证必需参数
    if (!fromWalletId || !toAddress || !amount || !tokenSymbol || !chain) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const transferRequest = {
      fromWalletId,
      toAddress,
      amount,
      tokenSymbol,
      chain,
      privacyLevel: privacyLevel as PrivacyLevel,
      customConfig,
    };

    const path = await privacyProtectionService.planPrivacyTransferPath(transferRequest);

    return NextResponse.json({
      success: true,
      path,
    });
  } catch (error) {
    console.error('Failed to plan privacy transfer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to plan privacy transfer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
