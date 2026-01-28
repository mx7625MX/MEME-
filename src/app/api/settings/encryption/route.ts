import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { settings } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { performKeyRotation, generateNewEncryptionKey, validateEncryptionKey } from '@/lib/keyRotation';
import { logAuditEvent } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * 执行密钥轮换
 * 
 * POST /api/settings/encryption/rotate
 * 
 * Body:
 * {
 *   "confirm": true,  // 必须显式确认
 *   "newKey": string | null  // 可选，不提供则自动生成
 * }
 * 
 * ⚠️ 危险操作：会重新加密所有敏感数据
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { confirm, newKey: userProvidedNewKey } = body;

    // 安全检查：必须显式确认
    if (!confirm) {
      return NextResponse.json(
        { 
          success: false, 
          error: '必须提供 confirm=true 参数来确认密钥轮换操作' 
        },
        { status: 400 }
      );
    }

    // 获取当前加密密钥（从环境变量）
    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey) {
      return NextResponse.json(
        { success: false, error: '未配置 ENCRYPTION_KEY 环境变量' },
        { status: 500 }
      );
    }

    // 获取所有加密的配置项
    const encryptedSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.category, 'trading'));

    // 验证当前密钥是否有效（尝试解密第一个加密项）
    if (encryptedSettings.length > 0) {
      const isValid = validateEncryptionKey(currentKey, encryptedSettings[0].value);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: '当前加密密钥无效，无法进行轮换' },
          { status: 400 }
        );
      }
    }

    // 生成或使用提供的新密钥
    const newKey = userProvidedNewKey || generateNewEncryptionKey();

    if (newKey.length !== 64) {
      return NextResponse.json(
        { success: false, error: '新密钥必须是 64 字符的十六进制字符串' },
        { status: 400 }
      );
    }

    // 执行密钥轮换
    const results = await performKeyRotation(
      currentKey,
      newKey,
      encryptedSettings.map(s => ({ id: s.key, value: s.value }))
    );

    // 更新数据库中的加密值
    let successCount = 0;
    let failCount = 0;

    for (const result of results) {
      if (result.success) {
        await db.update(settings)
          .set({ 
            value: (result as any).newValue,
            updatedAt: new Date().toISOString()
          })
          .where(eq(settings.key, result.id));
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to rotate key for ${result.id}:`, result.error);
      }
    }

    // 记录审计日志
    await logAuditEvent('encryption_key_rotated', {
      action: 'rotate',
      resource: 'encryption_key',
      oldKeyMasked: currentKey.substring(0, 8) + '...',
      newKeyMasked: newKey.substring(0, 8) + '...',
      successCount,
      failCount,
      timestamp: new Date().toISOString(),
    });

    if (failCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `密钥轮换部分失败：${successCount} 成功，${failCount} 失败`,
          results 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '密钥轮换成功',
      newKey,  // ⚠️ 客户端需要更新环境变量
      successCount,
      results: results.map(r => ({ id: r.id, success: r.success }))
    });
  } catch (error) {
    console.error('Key rotation error:', error);
    
    await logAuditEvent('encryption_key_rotation_failed', {
      action: 'rotate',
      resource: 'encryption_key',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '密钥轮换失败' 
      },
      { status: 500 }
    );
  }
}

/**
 * 验证当前加密密钥
 * 
 * POST /api/settings/encryption/validate
 * 
 * Body:
 * {
 *   "key": string  // 要验证的密钥
 * }
 */
export async function VALIDATE(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: '缺少密钥参数' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // 获取一个加密记录进行验证
    const [encryptedRecord] = await db
      .select()
      .from(settings)
      .where(eq(settings.category, 'trading'))
      .limit(1);

    if (!encryptedRecord) {
      return NextResponse.json({
        success: true,
        message: '没有加密记录需要验证',
        valid: true
      });
    }

    const isValid = validateEncryptionKey(key, encryptedRecord.value);

    return NextResponse.json({
      success: true,
      valid: isValid,
      message: isValid ? '密钥验证成功' : '密钥无效'
    });
  } catch (error) {
    console.error('Key validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '密钥验证失败' 
      },
      { status: 500 }
    );
  }
}
