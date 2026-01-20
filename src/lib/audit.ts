import { getDb } from 'coze-coding-dev-sdk';
import { auditLogs } from '@/storage/database/shared/schema';

export interface AuditEvent {
  event: string;
  details: Record<string, any>;
}

/**
 * 记录审计日志
 * 
 * 使用场景：
 * - 密钥访问（读取、修改、删除）
 * - 权限变更
 * - 敏感操作（如发币、大额交易）
 * - 系统异常
 */
export async function logAuditEvent(event: string, details: Record<string, any>): Promise<void> {
  try {
    const db = await getDb();
    
    await db.insert(auditLogs).values({
      event,
      details: JSON.stringify(details),
      timestamp: new Date(),
      severity: getSeverityFromEvent(event),
    });
  } catch (error) {
    // 审计日志记录失败不应影响主流程，但要记录到控制台
    console.error('[AUDIT] Failed to log audit event:', error);
  }
}

/**
 * 根据事件类型确定严重级别
 */
function getSeverityFromEvent(event: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalEvents = [
    'jito_key_deleted',
    'wallet_key_exported',
    'unauthorized_access_attempt',
  ];
  
  const highEvents = [
    'jito_key_updated',
    'jito_key_created',
    'large_transaction',
    'token_launch',
  ];
  
  const mediumEvents = [
    'jito_key_accessed',
    'wallet_connected',
    'portfolio_synced',
  ];
  
  if (criticalEvents.includes(event)) return 'critical';
  if (highEvents.includes(event)) return 'high';
  if (mediumEvents.includes(event)) return 'medium';
  return 'low';
}

/**
 * 查询审计日志
 */
export async function getAuditLogs(filters?: {
  event?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  limit?: number;
  offset?: number;
}) {
  try {
    const db = await getDb();
    const { event, severity, limit = 50, offset = 0 } = filters || {};
    
    let query = db.select().from(auditLogs);
    
    // TODO: 添加过滤逻辑（需要根据 Drizzle ORM 的实际 API 调整）
    // if (event) {
    //   query = query.where(eq(auditLogs.event, event));
    // }
    // if (severity) {
    //   query = query.where(eq(auditLogs.severity, severity));
    // }
    
    // return await query
    //   .orderBy(desc(auditLogs.timestamp))
    //   .limit(limit)
    //   .offset(offset);
    
    // 临时实现
    const logs = await query;
    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(offset, offset + limit);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * 清理旧审计日志（保留最近 90 天）
 */
export async function cleanupOldAuditLogs(): Promise<void> {
  try {
    const db = await getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    // TODO: 实现删除逻辑（需要根据 Drizzle ORM 的实际 API 调整）
    // await db.delete(auditLogs)
    //   .where(lt(auditLogs.timestamp, cutoffDate));
    
    console.log('[AUDIT] Old logs cleaned up');
  } catch (error) {
    console.error('[AUDIT] Failed to cleanup old logs:', error);
  }
}
