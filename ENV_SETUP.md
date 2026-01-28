# 环境变量配置指南

## Vercel 部署环境变量配置

### 数据库连接字符串（必需）

在 Vercel Dashboard 中配置以下环境变量之一：

#### 选项 1: PGDATABASE_URL（推荐）
- **变量名**: `PGDATABASE_URL`
- **来源**: 手动配置
- **格式**: `postgresql://postgres:[PASSWORD]@[HOST]:5432/[DATABASE]`

#### 选项 2: POSTGRES_URL（Vercel Postgres 自动配置）
- **变量名**: `POSTGRES_URL`
- **来源**: 使用 Vercel Postgres 时自动添加
- **说明**: 如果您使用 Vercel Storage 创建 Postgres 数据库，此变量会自动配置

#### 选项 3: DATABASE_URL（通用配置）
- **变量名**: `DATABASE_URL`
- **来源**: 手动配置
- **格式**: `postgresql://postgres:[PASSWORD]@[HOST]:5432/[DATABASE]`

**优先级**: PGDATABASE_URL > POSTGRES_URL > DATABASE_URL

**注意**: 只需配置上述三种变量中的一种即可！

---

## 配置步骤

### 步骤 1: 打开 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目

### 步骤 2: 进入环境变量设置

1. 点击 `Settings` 标签
2. 点击左侧菜单 `Environment Variables`

### 步骤 3: 添加环境变量

#### 如果使用 Vercel Postgres（推荐）

1. 点击 `Storage` 标签
2. 点击 `Create Database`
3. 选择 `Postgres`
4. 点击 `Continue`
5. Vercel 会自动添加 `POSTGRES_URL` 环境变量
6. 无需手动配置！

#### 如果使用其他数据库服务（Supabase、Neon 等）

1. 在数据库服务提供商处获取连接字符串
2. 在 `Environment Variables` 页面点击 `Add`
3. 填写：
   - **Key**: `PGDATABASE_URL`
   - **Value**: 您的数据库连接字符串
4. 选择环境：
   - `Production`（生产环境）
   - `Preview`（预览环境）
   - `Development`（开发环境）
5. 点击 `Save`

### 步骤 4: 重新部署

添加环境变量后，需要重新部署应用：

1. 点击 `Deployments` 标签
2. 找到最新的部署
3. 点击右上角 `...` 菜单
4. 选择 `Redeploy`

---

## 获取数据库连接字符串

### Vercel Postgres

创建数据库后，Vercel 会自动配置 `POSTGRES_URL`，无需手动获取。

### Supabase

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击 `Settings` > `Database`
4. 复制 `Connection String`（选择 "URI" 格式）
5. 替换 `[YOUR-PASSWORD]` 为您的数据库密码

格式：
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Neon

1. 访问 [Neon Console](https://console.neon.tech)
2. 选择您的项目
3. 复制连接字符串

格式：
```
postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
```

---

## 验证配置

### 方法 1: 查看 Vercel 环境变量

1. 在 Vercel Dashboard 中
2. 点击 `Settings` > `Environment Variables`
3. 确认环境变量已配置

### 方法 2: 在应用中测试

部署后，尝试创建一个新钱包：
- 如果成功：环境变量配置正确
- 如果失败：检查环境变量是否正确设置

### 方法 3: 查看部署日志

1. 在 Vercel Dashboard 中
2. 点击 `Deployments`
3. 点击最新的部署
4. 查看 `Function Logs`，检查是否有数据库连接错误

---

## 其他必需的环境变量

除了数据库连接字符串，还需要配置以下环境变量：

### 加密密钥（必需）

#### ENCRYPTION_KEY
- **说明**: 用于加密钱包私钥（64位十六进制字符串）
- **生成命令**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

#### ENCRYPTION_SALT
- **说明**: 加密盐值（32位十六进制字符串）
- **生成命令**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
  ```

### 应用 URL（推荐）

#### NEXT_PUBLIC_APP_URL
- **说明**: 应用的访问 URL
- **示例**: `https://your-app.vercel.app`
- **注意**: 部署后可从 Vercel Dashboard 获取

---

## 常见问题

### Q1: 提示 "PGDATABASE_URL 环境变量未设置"

**解决方法**:
1. 检查是否已配置 `PGDATABASE_URL`、`POSTGRES_URL` 或 `DATABASE_URL`
2. 确认环境变量在正确的环境中（Production）
3. 重新部署应用

### Q2: 使用 Vercel Postgres 后仍然提示未设置

**解决方法**:
1. 确认数据库已创建
2. 检查 `Environment Variables` 页面是否有 `POSTGRES_URL`
3. 等待几分钟后重新部署

### Q3: 数据库连接失败

**解决方法**:
1. 检查连接字符串格式是否正确
2. 确认数据库允许 Vercel IP 访问
3. 查看数据库服务的防火墙设置

### Q4: Supabase 连接失败

**解决方法**:
1. 确认使用正确的连接字符串格式
2. 检查密码是否正确
3. 确认 Supabase 项目的连接池设置

---

## 环境变量清单

### 必需变量（必须配置）

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `PGDATABASE_URL` | 数据库连接字符串（优先） | 手动配置 |
| `POSTGRES_URL` | 数据库连接字符串（Vercel） | Vercel Postgres 自动配置 |
| `DATABASE_URL` | 数据库连接字符串（通用） | 手动配置 |
| `ENCRYPTION_KEY` | 加密密钥 | 手动生成 |
| `ENCRYPTION_SALT` | 加密盐值 | 手动生成 |

### 推荐变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | 应用 URL | `https://your-app.vercel.app` |
| `WALLET_PRIVATE_KEY` | 主钱包私钥 | `0x1234...` |

### 可选变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SOLANA_RPC_URL` | Solana RPC 节点 | `https://api.mainnet-beta.solana.com` |
| `ETH_RPC_URL` | Ethereum RPC 节点 | `https://mainnet.infura.io/v3/...` |
| `BSC_RPC_URL` | BSC RPC 节点 | `https://bsc-dataseed.binance.org` |

---

## 安全提醒

1. **不要提交 .env 文件**
   - `.env` 已在 `.gitignore` 中
   - 所有敏感信息通过 Vercel Dashboard 管理

2. **使用强密码**
   - 数据库密码应包含大小写字母、数字和特殊字符
   - 定期更换密码

3. **限制访问权限**
   - 数据库应限制只允许 Vercel IP 访问
   - 不要使用公共数据库连接

4. **使用 Vercel Postgres**
   - 自动安全管理
   - 自动备份
   - 免费额度充足

---

**配置完成后，记得重新部署应用！** 🚀
