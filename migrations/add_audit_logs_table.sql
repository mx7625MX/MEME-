-- ============================================================================
-- 审计日志表 (audit_logs)
-- ============================================================================
-- 用于记录所有敏感操作和系统事件，提供安全审计能力
--
-- 创建时间: 2025
-- 目的: 增强 Jito Key 和其他敏感配置的安全性
-- ============================================================================

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  event VARCHAR(128) NOT NULL,           -- 事件类型（如：jito_key_created, jito_key_updated）
  details JSONB NOT NULL,                -- 事件详细信息（JSON 格式）
  severity VARCHAR(20) NOT NULL,         -- 严重级别：low, medium, high, critical
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS audit_logs_event_idx ON audit_logs(event);
CREATE INDEX IF NOT EXISTS audit_logs_severity_idx ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp DESC);

-- 添加注释
COMMENT ON TABLE audit_logs IS '审计日志表，记录所有敏感操作和系统事件';
COMMENT ON COLUMN audit_logs.event IS '事件类型';
COMMENT ON COLUMN audit_logs.details IS '事件详细信息（JSON格式）';
COMMENT ON COLUMN audit_logs.severity IS '严重级别：low, medium, high, critical';
COMMENT ON COLUMN audit_logs.timestamp IS '事件发生时间';

-- ============================================================================
-- 数据迁移：为现有的 Jito Key 加密
-- ============================================================================
-- 
-- ⚠️ 重要：如果 settings 表中已有明文的 jito_shred_key，需要执行以下步骤：
--
-- 1. 备份当前数据
--    CREATE TABLE settings_backup AS SELECT * FROM settings;
--
-- 2. 手动迁移（需要应用层配合）
--    - 使用应用提供的 API 重新提交 Jito Key
--    - 新的 API 会自动加密存储
--    - 旧的明文密钥会被新的加密密钥覆盖
--
-- 3. 验证迁移
--    SELECT * FROM settings WHERE key = 'jito_shred_key';
--    -- value 字段应该是加密后的 Base64 字符串，而不是原始的密钥
--
-- ============================================================================

-- ============================================================================
-- 性能优化建议
-- ============================================================================
--
-- 1. 定期清理旧日志（保留 90 天）
--    DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '90 days';
--
-- 2. 创建分区表（大数据量时）
--    -- 可以按时间分区以提高查询性能
--    -- 建议按月分区
--
-- 3. 添加查询视图
--    CREATE VIEW audit_logs_recent AS
--    SELECT * FROM audit_logs
--    WHERE timestamp > NOW() - INTERVAL '7 days'
--    ORDER BY timestamp DESC;
--
-- ============================================================================
