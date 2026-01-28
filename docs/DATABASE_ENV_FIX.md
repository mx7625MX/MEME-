# 数据库环境变量配置问题 - 解决方案

## 问题描述

创建钱包时出现以下错误提示：
```
未设定资料库URL。设置pgdatabase_url环境变量。
未创建数据库？您可以通过Coze编码平台创建一个。
```

## 根本原因

1. **环境变量名称错误**：项目使用 `coze-coding-dev-sdk`，需要的环境变量是 `PGDATABASE_URL`（大写），而不是 `DATABASE_URL`
2. **缺少 `.env` 文件**：项目只有 `.env.example` 文件，没有实际的环境变量配置文件
3. **数据库模型未同步**：需要执行 `coze-coding-ai db generate-models` 来同步数据库模型

## ✅ 已实施的修复

### 1. 创建了 `.env` 文件

创建了 `/workspace/projects/.env` 文件，包含以下配置：

```env
# 数据库配置（使用 coze-coding-dev-sdk 的环境变量名称）
PGDATABASE_URL="postgresql://user_7597348115112280090:dcc13453-338d-4cf9-9e24-2ee909416583@cp-fancy-frost-daf1230f.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1768895976767?sslmode=require&channel_binding=require"

# 为了兼容性，同时设置 DATABASE_URL
DATABASE_URL="postgresql://user_7597348115112280090:dcc13453-338d-4cf9-9e24-2ee909416583@cp-fancy-frost-daf1230f.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1768895976767?sslmode=require&channel_binding=require"

# 加密密钥
ENCRYPTION_KEY="d7c7b3485b5f9e68a6171cd951d12f7c0d658ce03804e731cc3bfd3bf3b0c25f"
ENCRYPTION_SALT="194059a198168bda179a45ed149aa003"

# 其他配置...
```

### 2. 同步了数据库模型

执行了以下命令：
```bash
coze-coding-ai db generate-models
```

输出：
```
- Generating models from database...
✔ Models generated at /workspace/projects/src/storage/database/shared/schema.ts
```

### 3. 重启了开发服务器

重新启动了 Next.js 开发服务器，使其能够读取新的环境变量。

## 🔍 环境变量说明

### PGDATABASE_URL vs DATABASE_URL

| 环境变量 | 用途 | 来源 |
|----------|------|------|
| **PGDATABASE_URL** | coze-coding-dev-sdk 使用的数据库连接字符串 | 必须设置 |
| **DATABASE_URL** | 应用代码中使用的数据库连接字符串 | 兼容性设置 |

### 数据库连接格式

```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?sslmode=require&channel_binding=require
```

示例：
```
postgresql://user_7597348115112280090:dcc13453-338d-4cf9-9e24-2ee909416583@cp-fancy-frost-daf1230f.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1768895976767?sslmode=require&channel_binding=require
```

## 📋 后续步骤

### 如果仍然遇到问题

1. **检查环境变量**：
   ```bash
   cd /workspace/projects
   source .env
   echo "PGDATABASE_URL=$PGDATABASE_URL"
   ```

2. **同步数据库模型**（如果修改了 schema）：
   ```bash
   coze-coding-ai db generate-models
   coze-coding-ai db upgrade
   ```

3. **重启开发服务器**：
   ```bash
   pkill -f "next dev"
   cd /workspace/projects
   coze dev
   ```

4. **测试数据库连接**：
   ```bash
   curl -X POST http://localhost:5000/api/wallets/create \
     -H "Content-Type: application/json" \
     -d '{"name":"test","chain":"solana"}'
   ```

## 📚 相关文档

- [数据库集成文档](https://github.com/your-org/database-integration)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [coze-coding-dev-sdk 使用指南](https://github.com/your-org/coze-coding-dev-sdk)

## ⚠️ 重要提示

### 安全警告

1. **不要将 `.env` 文件提交到 Git**
2. **生产环境必须修改加密密钥**
3. **数据库密码必须使用强密码**
4. **启用 SSL 连接**

### 加密密钥

当前的加密密钥仅用于开发环境：
```env
ENCRYPTION_KEY="d7c7b3485b5f9e68a6171cd951d12f7c0d658ce03804e731cc3bfd3bf3b0c25f"
ENCRYPTION_SALT="194059a198168bda179a45ed149aa003"
```

**生产环境需要生成新的随机密钥**：
```bash
# 生成新的加密密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 生成新的盐值
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 数据库迁移

如果需要修改数据库结构：
1. 修改 `src/storage/database/shared/schema.ts`
2. 执行 `coze-coding-ai db upgrade`
3. 检查迁移日志

## ✅ 验证清单

- [x] 创建了 `.env` 文件
- [x] 设置了 `PGDATABASE_URL` 环境变量
- [x] 同步了数据库模型
- [x] 重启了开发服务器
- [ ] 测试创建钱包功能
- [ ] 测试导入钱包功能
- [ ] 测试其他数据库相关功能
