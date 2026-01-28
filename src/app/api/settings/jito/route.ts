import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { settings } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt, validateJitoKey, maskKey } from '@/lib/encryption';
import { logAuditEvent } from '@/lib/audit';

// 获取 Jito 配置（仅返回掩码信息，不返回完整密钥）
export async function GET() {
  try {
    const db = await getDb();
    const [jitoConfig] = await db.select().from(settings).where(eq(settings.key, 'jito_shred_key'));

    if (!jitoConfig) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          maskedKey: null,
          configured: false,
        }
      });
    }

    // 解密密钥
    const decryptedKey = decrypt(jitoConfig.value);

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        maskedKey: maskKey(decryptedKey, 8), // 只显示前 8 个字符
        configured: true,
        // 不返回完整密钥！
      }
    });
  } catch (error) {
    console.error('Get Jito config error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取 Jito 配置失败' 
      },
      { status: 500 }
    );
  }
}

// 更新 Jito 配置（加密存储）
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { shredKey } = body;

    if (!shredKey) {
      return NextResponse.json(
        { success: false, error: '缺少 shred key' },
        { status: 400 }
      );
    }

    // 验证密钥格式
    if (!validateJitoKey(shredKey)) {
      return NextResponse.json(
        { success: false, error: 'Jito Shred Key 格式无效' },
        { status: 400 }
      );
    }

    // 加密密钥
    const encryptedKey = encrypt(shredKey);

    // 检查是否已存在配置
    const [existing] = await db.select().from(settings).where(eq(settings.key, 'jito_shred_key'));

    if (existing) {
      // 更新现有配置
      await db.update(settings)
        .set({ 
          value: encryptedKey,
          updatedAt: new Date()
        })
        .where(eq(settings.key, 'jito_shred_key'));
      
      // 记录审计日志
      await logAuditEvent('jito_key_updated', {
        action: 'update',
        resource: 'jito_shred_key',
        maskedKey: maskKey(shredKey, 8),
        timestamp: new Date().toISOString(),
      });
    } else {
      // 创建新配置
      await db.insert(settings).values({
        key: 'jito_shred_key',
        value: encryptedKey,
        category: 'trading',
        description: 'Jito Shred Key for Solana transaction acceleration',
      });
      
      // 记录审计日志
      await logAuditEvent('jito_key_created', {
        action: 'create',
        resource: 'jito_shred_key',
        maskedKey: maskKey(shredKey, 8),
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Jito 配置已更新（已加密存储）'
    });
  } catch (error) {
    console.error('Update Jito config error:', error);
    
    // 记录错误审计日志
    await logAuditEvent('jito_key_update_failed', {
      action: 'update',
      resource: 'jito_shred_key',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '更新 Jito 配置失败' 
      },
      { status: 500 }
    );
  }
}

// 删除 Jito 配置
export async function DELETE() {
  try {
    const db = await getDb();
    
    // 先获取配置用于审计
    const [existing] = await db.select().from(settings).where(eq(settings.key, 'jito_shred_key'));
    
    await db.delete(settings).where(eq(settings.key, 'jito_shred_key'));

    // 记录审计日志
    await logAuditEvent('jito_key_deleted', {
      action: 'delete',
      resource: 'jito_shred_key',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Jito 配置已删除'
    });
  } catch (error) {
    console.error('Delete Jito config error:', error);
    
    // 记录错误审计日志
    await logAuditEvent('jito_key_delete_failed', {
      action: 'delete',
      resource: 'jito_shred_key',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '删除 Jito 配置失败' 
      },
      { status: 500 }
    );
  }
}
