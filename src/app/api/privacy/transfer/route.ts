import { NextRequest, NextResponse } from 'next/server';
import { privacyProtectionService } from '@/services/privacy-protection/privacy-service';
import { PrivacyLevel } from '@/services/privacy-protection/types';

/**
 * POST /api/privacy/transfer
 * 执行隐私转账（多跳中转）
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

    const result = await privacyProtectionService.executePrivacyTransfer(transferRequest);

    return NextResponse.json({
      success: true,
      transfer: result,
    });
  } catch (error) {
    console.error('Failed to execute privacy transfer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute privacy transfer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
