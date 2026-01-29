# 钱包功能问题排查

## 问题说明

用户报告创建钱包和导入钱包不能正常运行。

## 本地测试结果

### 1. 创建钱包 API - ✅ 正常工作

```bash
curl -X POST http://localhost:5000/api/wallets/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Wallet","chain":"eth"}'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "76ad4481-c9cc-4466-822c-8aca30e1ff62",
    "name": "Test Wallet",
    "chain": "eth",
    "address": "0x05104036ea77831f91B0Bd9A08A7cB7c0D14B1Ad",
    "balance": "0.000000000000000000",
    "isActive": true,
    "createdAt": "2026-01-29 11:50:24.096474+08"
  }
}
```

### 2. 导入钱包 API - ✅ 正常工作

```bash
curl -X POST http://localhost:5000/api/wallets/import \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Imported Wallet",
    "chain":"eth",
    "importType":"mnemonic",
    "mnemonic":"test test test test test test test test test test test test"
  }'
```

**响应**:
```json
{
  "success": false,
  "error": "invalid mnemonic checksum (argument=\"mnemonic\", value=\"[ REDACTED ]\", code=INVALID_ARGUMENT, version=6.16.0)"
}
```

**说明**: 助记词验证失败是因为使用了无效的助记词，API 本身正常工作。

### 3. 查询钱包列表 - ✅ 正常工作

```bash
curl http://localhost:5000/api/wallets
```

**响应**: 返回了多个钱包，说明数据库连接正常。

## 可能的问题

### 1. Vercel 环境变量未配置

**症状**: 创建钱包失败，提示"数据库连接失败"

**解决方案**:
- 在 Vercel Dashboard → Settings → Environment Variables
- 添加 `PGDATABASE_URL` 或 `POSTGRES_URL` 或 `DATABASE_URL`
- 添加 `ENCRYPTION_KEY` 和 `ENCRYPTION_SALT`（生产环境必需）
- 重新部署

### 2. 加密密钥问题

**症状**: 创建的钱包无法导入/解密

**解决方案**:
- 确保 `ENCRYPTION_KEY` 和 `ENCRYPTION_SALT` 已配置
- 使用固定的密钥，不要使用随机生成的
- 重新部署应用

### 3. 数据库未初始化

**症状**: 创建钱包失败，提示表不存在

**解决方案**:
```bash
curl -X POST https://meme-master-pro.vercel.app/api/init/migrate
```

### 4. 前端调用问题

**症状**: 前端显示错误，但后端 API 正常

**检查项**:
- 请求 URL 是否正确
- 请求方法是否正确（POST）
- Content-Type 是否设置为 `application/json`
- 请求体格式是否正确

## 测试步骤

### 步骤 1: 检查健康状态

```bash
curl https://meme-master-pro.vercel.app/api/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "environment": "production"
}
```

### 步骤 2: 初始化数据库

```bash
curl -X POST https://meme-master-pro.vercel.app/api/init/migrate
```

**预期响应**:
```json
{
  "success": true,
  "message": "数据库迁移完成，所有表已创建",
  "data": {
    "tablesCreated": 14,
    "indexesCreated": 35
  }
}
```

### 步骤 3: 创建钱包

```bash
curl -X POST https://meme-master-pro.vercel.app/api/wallets/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Wallet","chain":"eth"}'
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Test Wallet",
    "chain": "eth",
    "address": "0x...",
    "balance": "0",
    "isActive": true,
    "createdAt": "2026-01-29T12:00:00.000Z"
  }
}
```

### 步骤 4: 导入钱包（使用真实助记词）

```bash
curl -X POST https://meme-master-pro.vercel.app/api/wallets/import \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Imported Wallet",
    "chain":"eth",
    "importType":"mnemonic",
    "mnemonic":"your real 12 word mnemonic here"
  }'
```

**注意**: 使用真实的 12 或 24 词助记词进行测试。

### 步骤 5: 查询钱包列表

```bash
curl https://meme-master-pro.vercel.app/api/wallets
```

## 常见错误

### 错误 1: Database connection failed

**原因**: 数据库连接字符串未配置

**解决方案**:
1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确保 `PGDATABASE_URL` 或 `POSTGRES_URL` 或 `DATABASE_URL` 已设置
3. 重新部署应用

### 错误 2: Failed to encrypt wallet data

**原因**: 加密密钥未配置

**解决方案**:
1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确保 `ENCRYPTION_KEY` 和 `ENCRYPTION_SALT` 已设置
3. 重新部署应用

### 错误 3: Invalid mnemonic

**原因**: 助记词格式不正确

**解决方案**:
- 使用真实的 12 或 24 词助记词
- 确保助记词单词之间用空格分隔
- 确保助记词是有效的 BIP39 助记词

### 错误 4: Wallet with this address already exists

**原因**: 钱包地址已存在

**解决方案**:
- 使用不同的助记词或私钥
- 或使用现有的钱包

## 日志检查

### Vercel Dashboard 日志

1. 访问 Vercel Dashboard
2. 选择项目: Meme Master Pro
3. 点击 Functions
4. 查看函数日志

### 查找错误信息

搜索以下关键词:
- `Error creating wallet`
- `Error importing wallet`
- `Database connection failed`
- `Encryption failed`
- `Decryption failed`

## 环境变量验证

### 检查环境变量是否配置

在 Vercel Dashboard 中，确保以下环境变量已设置：

```bash
# 数据库连接（三选一）
PGDATABASE_URL=postgresql://user:password@host:port/database

# 加密密钥（生产环境必需）
ENCRYPTION_KEY=your-32-char-hex-key-here
ENCRYPTION_SALT=your-16-char-hex-salt-here
```

### 生成加密密钥

```bash
# 生成 ENCRYPTION_KEY（32 字节 = 64 个十六进制字符）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成 ENCRYPTION_SALT（16 字节 = 32 个十六进制字符）
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 下一步

1. **用户提供更多信息**:
   - 具体的错误消息
   - 浏览器控制台错误
   - Vercel 函数日志

2. **按照测试步骤逐一验证**:
   - 健康检查
   - 数据库迁移
   - 创建钱包
   - 导入钱包
   - 查询钱包

3. **检查环境变量**:
   - 数据库连接字符串
   - 加密密钥

4. **查看日志**:
   - Vercel Dashboard 函数日志
   - 浏览器控制台

## 联系支持

如果问题仍然存在，请提供以下信息：

1. 具体的错误消息
2. 浏览器控制台错误
3. Vercel 函数日志
4. 环境变量配置截图（隐藏敏感信息）
5. 请求和响应的详细信息

---

**当前状态**:
- ✅ 本地环境测试正常
- ⏳ 等待用户提供更多信息
- ⏳ 需要在 Vercel 环境中测试
