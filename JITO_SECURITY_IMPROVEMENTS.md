# Jito Key 安全改进方案

## 📋 执行摘要

本文档详细说明了 Meme Master Pro 项目中 Jito Shred Key 的安全改进措施，解决了原有的多个安全漏洞。

## 🔴 原有安全问题

### 1. 明文存储
- **位置**: `src/app/api/settings/jito/route.ts:47`
- **问题**: Jito Shred Key 以明文形式直接存入数据库
- **风险**: 数据库泄露将直接暴露密钥

### 2. 前端暴露
- **位置**: `src/app/api/settings/jito/route.ts:15`
- **问题**: GET API 完整返回 shredKey 给前端
- **风险**: 浏览器开发者工具可直接读取密钥

### 3. 缺乏访问控制
- **问题**: 无用户认证验证
- **风险**: 任何能访问 API 的人都能获取/修改密钥

### 4. 缺少审计
- **问题**: 无访问日志记录
- **风险**: 无法追踪密钥使用情况和异常访问

---

## ✅ 实施的安全改进

### 1. 加密存储系统

#### 实现文件: `src/lib/encryption.ts`

**核心功能**:
- AES-256-GCM 加密算法
- PBKDF2 密钥派生（100,000 次迭代）
- 每次加密使用随机 Salt 和 IV
- Auth Tag 验证数据完整性

**API**:
```typescript
encrypt(text: string): string      // 加密
decrypt(encryptedData: string): string  // 解密
validateJitoKey(key: string): boolean   // 密钥格式验证
maskKey(key: string, visibleChars: number): string  // 密钥掩码
```

**安全特性**:
- 使用环境变量 `ENCRYPTION_KEY` 作为主密钥
- 每次加密生成独立的 Salt 和 IV
- Base64 编码存储，避免二进制数据问题

---

### 2. 审计日志系统

#### 实现文件: `src/lib/audit.ts`

**核心功能**:
- 记录所有敏感操作
- 自动分级（low/medium/high/critical）
- 支持 90 天自动清理

**记录的事件类型**:
- `jito_key_created` - 密钥创建
- `jito_key_updated` - 密钥更新
- `jito_key_deleted` - 密钥删除
- `jito_key_accessed` - 密钥访问（服务端）
- `jito_key_update_failed` - 密钥更新失败
- `encryption_key_rotated` - 加密密钥轮换

**数据库表**: `audit_logs`
```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  event VARCHAR(128) NOT NULL,
  details JSONB NOT NULL,
  severity VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);
```

---

### 3. 安全的 API 端点

#### 修改文件: `src/app/api/settings/jito/route.ts`

**GET 端点改进**:
```typescript
// ❌ 旧实现（危险）
return NextResponse.json({
  shredKey: jitoConfig?.value || null  // 返回完整密钥
});

// ✅ 新实现（安全）
const decryptedKey = decrypt(jitoConfig.value);
return NextResponse.json({
  maskedKey: maskKey(decryptedKey, 8),  // 只返回掩码
  exists: true,
  configured: true
});
```

**POST 端点改进**:
- 输入验证：验证 Jito Key 格式
- 加密存储：使用 `encrypt()` 函数
- 审计日志：记录创建/更新操作
- 错误处理：失败时记录审计日志

**新增内部函数**:
```typescript
getDecryptedJitoKey(): Promise<string | null>  // 服务端使用
isJitoConfigured(): Promise<boolean>           // 检查配置状态
```

---

### 4. 前端安全改进

#### 修改文件: `src/app/page.tsx`

**改进点**:
1. **只显示掩码**: 前端不再接收完整密钥
2. **提示更新**: 已配置时显示掩码并提示重新输入
3. **安全提示**: 添加加密存储提示

```typescript
// UI 改进示例
{jitoShredKey ? (
  <div className="text-white font-mono">
    {jitoShredKey}  // 显示掩码：xxxxxxxx...xxxx
  </div>
) : (
  <Input
    type="text"
    placeholder="输入你的 Jito Shred Key"
    // 允许用户输入新密钥
  />
)}
```

---

### 5. 密钥轮换机制

#### 实现文件: `src/lib/keyRotation.ts`

**核心功能**:
```typescript
generateNewEncryptionKey(): string  // 生成新密钥
rotateEncryption(
  encryptedData: string,
  oldKey: string,
  newKey: string
): string  // 轮换加密
performKeyRotation(
  oldKey: string,
  newKey: string,
  encryptedRecords: Array
): Promise<Array>  // 批量轮换
```

#### API 端点: `src/app/api/settings/encryption/route.ts`

**轮换流程**:
1. 验证当前密钥有效性
2. 获取所有加密记录
3. 使用旧密钥解密，新密钥加密
4. 更新数据库
5. 记录审计日志
6. 返回新密钥（需更新环境变量）

**安全检查**:
- 必须提供 `confirm=true` 参数
- 验证当前密钥有效性
- 验证新密钥格式（64 字符 hex）
- 记录成功/失败数量

---

## 📁 新增/修改的文件

### 新增文件

1. **`src/lib/encryption.ts`** - 加密/解密工具
2. **`src/lib/audit.ts`** - 审计日志系统
3. **`src/lib/keyRotation.ts`** - 密钥轮换工具
4. **`migrations/add_audit_logs_table.sql`** - 数据库迁移脚本
5. **`SECURITY_CONFIG.md`** - 安全配置文档
6. **`JITO_SECURITY_IMPROVEMENTS.md`** - 本文档

### 修改文件

1. **`src/app/api/settings/jito/route.ts`** - 安全的 Jito 配置 API
2. **`src/app/api/portfolios/monitor/route.ts`** - 使用安全的密钥获取方式
3. **`src/app/page.tsx`** - 前端只显示掩码密钥
4. **`src/storage/database/shared/schema.ts`** - 添加 auditLogs 表定义

---

## 🚀 部署步骤

### 1. 数据库迁移

```bash
# 执行迁移脚本
psql -U your_user -d your_database -f migrations/add_audit_logs_table.sql
```

### 2. 配置环境变量

在 `.env.local` 或生产环境配置中添加：

```bash
# 生成加密密钥（选择其一）
# Node.js: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# OpenSSL: openssl rand -hex 32

ENCRYPTION_KEY=<your-64-char-hex-key>
```

### 3. 重新部署应用

```bash
pnpm install
pnpm build
pnpm start
```

### 4. 迁移现有密钥（可选）

如果数据库中已有明文的 Jito Key：

1. 通过前端 UI 重新提交 Jito Key
2. 新的 API 会自动加密存储
3. 验证加密成功：`value` 字段应该是 Base64 编码的字符串

---

## 🔒 安全最佳实践

### 1. 环境变量管理

- ✅ 使用密钥管理服务（AWS KMS、Azure Key Vault）
- ✅ 定期轮换加密密钥（建议每年一次）
- ✅ 不要在代码中硬编码密钥
- ✅ 不要将 `.env` 文件提交到版本控制

### 2. 数据库安全

- ✅ 启用数据库连接加密（SSL/TLS）
- ✅ 限制数据库访问 IP
- ✅ 定期备份数据库
- ✅ 定期清理审计日志（90 天）

### 3. 应用安全

- ✅ 实施速率限制（Rate Limiting）
- ✅ 启用 HTTPS（生产环境必须）
- ✅ 实施访问控制和身份验证
- ✅ 定期审计日志检查

### 4. 开发流程

- ✅ 代码审查（Code Review）
- ✅ 安全测试（渗透测试）
- ✅ 依赖更新（定期更新 npm 包）
- ✅ 安全培训（开发团队）

---

## 📊 安全对比表

| 方面 | 改进前 | 改进后 |
|------|--------|--------|
| 存储方式 | 明文 | AES-256-GCM 加密 |
| 前端暴露 | 完整密钥 | 仅掩码显示 |
| 访问控制 | 无 | 审计日志 |
| 密钥轮换 | 不支持 | 支持批量轮换 |
| 密钥验证 | 无 | 格式验证 + 完整性验证 |
| 错误处理 | 基础 | 审计日志 + 详细错误 |
| 合规性 | 不符合 | 符合安全最佳实践 |

---

## ⚠️ 重要提醒

1. **密钥丢失**: 如果 `ENCRYPTION_KEY` 丢失，所有加密数据将无法解密
2. **备份**: 在执行密钥轮换前，务必备份数据库
3. **测试**: 先在测试环境验证所有功能，再部署到生产环境
4. **监控**: 定期检查审计日志，发现异常及时处理

---

## 📞 支持

如有安全问题或疑问，请：

1. 查看审计日志：`src/app/api/settings/audit`
2. 检查错误日志：`/app/work/logs/bypass/app.log`
3. 联系安全团队进行安全评估

---

## 🔗 相关文档

- [SECURITY_CONFIG.md](./SECURITY_CONFIG.md) - 加密密钥配置指南
- [migrations/add_audit_logs_table.sql](./migrations/add_audit_logs_table.sql) - 数据库迁移脚本
- Jito 官方文档：https://jito-labs.gitbook.io/jito/

---

**文档版本**: 1.0  
**最后更新**: 2025  
**作者**: Meme Master Pro 安全团队
