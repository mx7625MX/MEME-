import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { settings } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// 获取 Jito 配置
export async function GET() {
  try {
    const db = await getDb();
    const [jitoConfig] = await db.select().from(settings).where(eq(settings.key, 'jito_shred_key'));

    return NextResponse.json({
      success: true,
      data: {
        shredKey: jitoConfig?.value || null,
        exists: !!jitoConfig,
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

// 更新 Jito 配置
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

    // 检查是否已存在配置
    const [existing] = await db.select().from(settings).where(eq(settings.key, 'jito_shred_key'));

    if (existing) {
      // 更新现有配置
      await db.update(settings)
        .set({ 
          value: shredKey,
          updatedAt: new Date()
        })
        .where(eq(settings.key, 'jito_shred_key'));
    } else {
      // 创建新配置
      await db.insert(settings).values({
        key: 'jito_shred_key',
        value: shredKey,
        category: 'trading',
        description: 'Jito Shred Key for Solana transaction acceleration',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Jito 配置已更新'
    });
  } catch (error) {
    console.error('Update Jito config error:', error);
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
    await db.delete(settings).where(eq(settings.key, 'jito_shred_key'));

    return NextResponse.json({
      success: true,
      message: 'Jito 配置已删除'
    });
  } catch (error) {
    console.error('Delete Jito config error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '删除 Jito 配置失败' 
      },
      { status: 500 }
    );
  }
}
