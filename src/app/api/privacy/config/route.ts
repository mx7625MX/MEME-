import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { privacyConfigs, wallets } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { privacyProtectionService } from '@/services/privacy-protection/privacy-service';

/**
 * GET /api/privacy/config?walletId=xxx
 * 获取钱包的隐私配置
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

    const db = await getDb();
    const [config] = await db.select().from(privacyConfigs).where(eq(privacyConfigs.walletId, walletId));

    if (!config) {
      // 返回默认配置
      return NextResponse.json({
        walletId,
        privacyLevel: 'MEDIUM',
        enableAutoPrivacy: false,
        maxHops: 2,
        splitCount: 2,
        minDelayMs: 1000,
        maxDelayMs: 5000,
        useRandomPath: true,
        avoidKnownTracking: true,
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to fetch privacy config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/privacy/config
 * 创建或更新隐私配置
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletId,
      privacyLevel,
      enableAutoPrivacy,
      maxHops,
      splitCount,
      minDelayMs,
      maxDelayMs,
      useRandomPath,
      avoidKnownTracking,
    } = body;

    const db = await getDb();
    // 验证钱包是否存在
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // 检查配置是否已存在
    const [existingConfig] = await db.select().from(privacyConfigs).where(eq(privacyConfigs.walletId, walletId));

    const configData = {
      walletId,
      privacyLevel: privacyLevel || 'MEDIUM',
      enableAutoPrivacy: enableAutoPrivacy || false,
      maxHops: maxHops || 2,
      splitCount: splitCount || 2,
      minDelayMs: minDelayMs || 1000,
      maxDelayMs: maxDelayMs || 5000,
      useRandomPath: useRandomPath !== undefined ? useRandomPath : true,
      avoidKnownTracking: avoidKnownTracking !== undefined ? avoidKnownTracking : true,
      updatedAt: new Date().toISOString(),
    };

    let config;
    if (existingConfig) {
      // 更新现有配置
      const result = await db.update(privacyConfigs)
        .set(configData)
        .where(eq(privacyConfigs.walletId, walletId))
        .returning();
      config = result[0];
    } else {
      // 创建新配置
      const result = await db.insert(privacyConfigs)
        .values(configData)
        .returning();
      config = result[0];
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to save privacy config:', error);
    return NextResponse.json(
      { error: 'Failed to save privacy config' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/privacy/config
 * 更新隐私配置
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId, ...updates } = body;

    const db = await getDb();
    const result = await db.update(privacyConfigs)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(privacyConfigs.walletId, walletId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Privacy config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to update privacy config:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy config' },
      { status: 500 }
    );
  }
}
