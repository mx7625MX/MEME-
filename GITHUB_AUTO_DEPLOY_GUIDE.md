# GitHub 自动部署指南 - 超详细步骤

## 🎯 最简单的部署方式（推荐）

通过 GitHub + Vercel 自动部署，无需命令行，全程图形化操作。

**预计耗时：20 分钟**

---

## 📋 部署前准备

### 确保你已注册：
- ✅ GitHub 账号
- ✅ Vercel 账号
- ✅ Supabase 账号

### 需要准备的信息：
- GitHub 仓库名称（例如：meme-master-pro）
- Supabase DATABASE_URL（稍后获取）
- 钱包私钥（0x...格式）

---

## 🚀 部署步骤

### 步骤 1：在 GitHub 创建仓库（3 分钟）

#### 1.1 访问 GitHub
打开浏览器，访问：https://github.com

#### 1.2 创建新仓库
1. 点击右上角的 **+** 号
2. 选择 **New repository**

#### 1.3 填写仓库信息
```
Repository name: meme-master-pro
Description: Meme Master Pro - DeFi 交易管理平台
☑️ Public（公开）
☑️ Add a README file（可选）
☑️ Add .gitignore（选择 Node）
☑️ Choose a license（可选）
```

#### 1.4 创建仓库
点击 **Create repository** 按钮

#### 1.5 记录仓库地址
创建成功后，你会看到类似这样的地址：
```
https://github.com/你的用户名/meme-master-pro.git
```
**复制这个地址，后面会用到！**

---

### 步骤 2：将代码推送到 GitHub（5 分钟）

#### 方式 A：如果你有本地项目

在你的本地电脑上打开终端（Terminal 或 PowerShell）：

```bash
# 1. 进入项目目录
cd /path/to/meme-master-pro

# 2. 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/meme-master-pro.git

# 3. 添加所有文件
git add .

# 4. 创建首次提交
git commit -m "Initial commit: Meme Master Pro"

# 5. 推送到 GitHub（如果需要认证，会提示你输入）
git branch -M main
git push -u origin main
```

#### 方式 B：如果你还没有本地代码

1. 在本地电脑上下载项目文件
2. 或者从 GitHub 上 clone 刚创建的空仓库：
```bash
git clone https://github.com/你的用户名/meme-master-pro.git
cd meme-master-pro
# 将所有项目文件复制到这个目录
# 然后执行：
git add .
git commit -m "Initial commit"
git push origin main
```

#### 验证推送成功
- 访问：https://github.com/你的用户名/meme-master-pro
- 应该能看到所有项目文件

---

### 步骤 3：在 Vercel 导入 GitHub 仓库（2 分钟）

#### 3.1 访问 Vercel
打开浏览器，访问：https://vercel.com

#### 3.2 登录 Vercel
如果你还没登录，点击 **Login**，选择 **Continue with GitHub**

#### 3.3 创建新项目
1. 登录后，点击右上角的 **Add New...**
2. 选择 **Project**

#### 3.4 导入 GitHub 仓库
1. 在 "Import Git Repository" 页面
2. 找到 `meme-master-pro` 仓库
3. 点击右侧的 **Import** 按钮

---

### 步骤 4：配置 Vercel 项目（5 分钟）

#### 4.1 配置项目信息

```
Project Name: meme-master-pro
Framework Preset: Next.js  (Vercel 会自动检测)
Root Directory: ./        （保持默认）
Build and Output Settings: 保持默认
```

#### 4.2 配置环境变量

点击 **Environment Variables** 部分，逐个添加以下变量：

**重要提示：这些变量包含敏感信息，不要泄露给他人！**

##### 变量 1：DATABASE_URL
```
Name: DATABASE_URL
Value: postgresql://postgres:[你的密码]@db.[项目ID].supabase.co:5432/postgres
Environment: Production, Preview, Development
```

**如何获取 DATABASE_URL：**
1. 访问 https://app.supabase.com
2. 选择你的项目（如果还没有，先创建一个）
3. 点击左侧菜单的 **Settings**
4. 点击 **Database**
5. 找到 **Connection string** 部分
6. 选择 **URI** 标签页
7. 点击复制按钮（Copy）
8. 粘贴到 Vercel

##### 变量 2：WALLET_PRIVATE_KEY
```
Name: WALLET_PRIVATE_KEY
Value: 0x1234567890abcdef...（你的钱包私钥，66字符）
Environment: Production, Preview, Development
```

⚠️ **安全提醒：**
- 只在服务端使用这个私钥
- 不要在前端代码中使用
- 不要分享给任何人

##### 变量 3：SOLANA_RPC_URL
```
Name: SOLANA_RPC_URL
Value: https://api.mainnet-beta.solana.com
Environment: Production, Preview, Development
```

（如果你有付费的 RPC（如 Helius、QuickNode），可以替换为那个）

##### 变量 4：JITO_RPC_URL（可选）
```
Name: JITO_RPC_URL
Value: https://mainnet.block-engine.jito.wtf/api/v1
Environment: Production, Preview, Development
```

##### 变量 5：JITO_BUNDLE_URL（可选）
```
Name: JITO_BUNDLE_URL
Value: https://mainnet.block-engine.jito.wtf/api/v1/bundles
Environment: Production, Preview, Development
```

#### 4.3 完成配置
点击底部的 **Deploy** 按钮

---

### 步骤 5：等待部署（2 分钟）

Vercel 会自动：
1. 克隆你的 GitHub 仓库
2. 安装依赖（pnpm install）
3. 构建项目（pnpm build）
4. 部署到 Vercel

**你会看到进度条：**
```
Cloning...
Installing dependencies...
Building...
Deploying...
```

**部署完成后：**
- ✅ 显示 "Deployed"
- ✅ 显示生产环境 URL：https://meme-master-pro.vercel.app
- ✅ 显示域名：meme-master-pro.vercel.app

**点击链接访问你的应用！**

---

### 步骤 6：初始化 Supabase 数据库（3 分钟）

#### 6.1 访问 Supabase
打开浏览器，访问：https://app.supabase.com

#### 6.2 创建项目（如果还没有）
1. 点击 **New project**
2. 填写项目信息：
```
Name: meme-master-pro
Database Password: 设置一个强密码（记住这个密码！）
Region: 选择离你最近的区域
```
3. 点击 **Create new project**
4. 等待项目创建完成（约 1-2 分钟）

#### 6.3 获取 DATABASE_URL
1. 点击左侧菜单的 **Settings**
2. 点击 **Database**
3. 找到 **Connection string** 部分
4. 选择 **URI** 标签页
5. 复制连接字符串

#### 6.4 更新 Vercel 环境变量
1. 回到 Vercel Dashboard
2. 进入你的项目
3. 点击 **Settings** > **Environment Variables**
4. 找到 `DATABASE_URL`
5. 点击 **Edit**
6. 粘贴新的 DATABASE_URL
7. 点击 **Save**
8. 点击项目顶部的 **Redeploy** 按钮

#### 6.5 创建数据库表
1. 在 Supabase Dashboard
2. 点击左侧菜单的 **SQL Editor**
3. 点击 **New query**
4. 复制以下 SQL 脚本：

```sql
-- 创建钱包表
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(256) NOT NULL,
    chain VARCHAR(20) NOT NULL,
    address VARCHAR(256) NOT NULL UNIQUE,
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 创建交易表
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    chain VARCHAR(20) NOT NULL,
    token_address VARCHAR(256),
    token_symbol VARCHAR(32),
    amount NUMERIC,
    price NUMERIC,
    fee NUMERIC,
    status VARCHAR(20) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建投资组合表
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    token_address VARCHAR(256) NOT NULL,
    token_symbol VARCHAR(32) NOT NULL,
    amount NUMERIC NOT NULL,
    buy_price NUMERIC NOT NULL,
    chain VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 创建策略表
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(256) NOT NULL,
    wallet_id UUID NOT NULL,
    token_address VARCHAR(256),
    token_symbol VARCHAR(32),
    platform VARCHAR(50),
    strategy_type VARCHAR(50),
    is_enabled BOOLEAN DEFAULT false,
    status VARCHAR(20),
    params JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 创建设置表
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(256) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    user_id VARCHAR(256),
    resource VARCHAR(256),
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

5. 点击 **Run** 执行脚本

#### 6.6 验证数据库创建成功
1. 点击左侧菜单的 **Table Editor**
2. 应该能看到以下表：
   - ✅ wallets
   - ✅ transactions
   - ✅ portfolios
   - ✅ strategies
   - ✅ settings
   - ✅ audit_logs

---

### 步骤 7：验证部署（1 分钟）

#### 7.1 访问应用
打开浏览器，访问：
```
https://meme-master-pro.vercel.app
```

#### 7.2 检查功能
- ✅ 页面正常加载
- ✅ 可以导航到各个页面
- ✅ 可以添加钱包
- ✅ 可以查看策略
- ✅ 可以执行操作

#### 7.3 查看部署日志
1. 访问 Vercel Dashboard
2. 进入你的项目
3. 点击 **Deployments**
4. 点击最新的部署
5. 查看 **Build Logs** 和 **Server Logs**

---

## 🔄 后续更新

### 更新代码（自动部署）

当你修改代码后：

```bash
# 在本地电脑
git add .
git commit -m "描述你的修改"
git push origin main

# Vercel 会自动检测到推送，自动部署！
```

### 查看部署状态
- 访问 Vercel Dashboard
- 查看最新的部署进度
- 通常 1-2 分钟完成

### 回滚到历史版本
1. 访问 Vercel Dashboard
2. 点击 **Deployments**
3. 找到之前的版本
4. 点击右侧的 **...** 菜单
5. 选择 **Promote to Production**

---

## 📊 配置环境变量（补充）

### 在 Vercel Dashboard 中添加环境变量

1. 访问 Vercel Dashboard
2. 选择你的项目
3. 点击 **Settings** > **Environment Variables**
4. 点击 **Add New**
5. 填写变量名和值
6. 选择环境（Production / Preview / Development）
7. 点击 **Save**

### 修改环境变量

1. 找到要修改的变量
2. 点击 **Edit**
3. 修改值
4. 点击 **Save**
5. 点击项目顶部的 **Redeploy**

---

## 🎯 部署完成清单

### ✅ 基础配置
- [ ] GitHub 仓库已创建
- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建
- [ ] GitHub 仓库已导入 Vercel

### ✅ 环境变量
- [ ] DATABASE_URL 已配置
- [ ] WALLET_PRIVATE_KEY 已配置
- [ ] SOLANA_RPC_URL 已配置
- [ ] JITO_RPC_URL 已配置（可选）
- [ ] JITO_BUNDLE_URL 已配置（可选）

### ✅ 数据库
- [ ] Supabase 项目已创建
- [ ] DATABASE_URL 已更新
- [ ] 数据库表已创建
- [ ] 表结构验证通过

### ✅ 部署验证
- [ ] 应用可以访问
- [ ] 页面正常加载
- [ ] 基本功能可用
- [ ] 部署日志正常

---

## 🆘 常见问题

### Q1: 部署失败怎么办？
**A:**
1. 查看 Vercel 构建日志
2. 检查环境变量是否正确
3. 确保代码没有语法错误
4. 尝试重新部署

### Q2: 数据库连接失败？
**A:**
1. 检查 DATABASE_URL 格式是否正确
2. 确认 Supabase 项目正在运行
3. 检查密码是否正确
4. 尝试重新连接

### Q3: 环境变量不生效？
**A:**
1. 确保环境变量添加到了所有环境（Production / Preview / Development）
2. 修改后点击 **Redeploy**
3. 清除浏览器缓存

### Q4: 部署后功能异常？
**A:**
1. 查看 Vercel 日志
2. 检查浏览器控制台错误
3. 验证数据库连接
4. 检查 API 是否正常

### Q5: 如何配置自定义域名？
**A:**
1. 在 Vercel Dashboard > Settings > Domains
2. 点击 **Add Domain**
3. 输入你的域名
4. 按照提示配置 DNS 记录

---

## 💰 费用说明

### 完全免费
- Vercel：$0/月（个人使用）
- Supabase：$0/月（500MB 数据库）
- GitHub：$0/月（公开仓库）

### 仅当实际使用时收费
- Solana 交易：约 $0.001/笔
- 超出免费额度后才收费

---

## 🎉 恭喜！

如果你按照以上步骤完成，那么你的 Meme Master Pro 已经成功部署到生产环境了！

**现在你可以：**
1. 访问 https://meme-master-pro.vercel.app
2. 添加你的钱包
3. 配置交易策略
4. 开始使用真实交易

**需要启用真实交易？**
- 参考 `JITO_INTEGRATION_STATUS.md`
- 配置 Jito Shred Key
- 修改代码启用真实交易

---

## 📞 需要帮助？

如果在部署过程中遇到问题：

1. **查看 Vercel 文档**：https://vercel.com/docs
2. **查看 Supabase 文档**：https://supabase.com/docs
3. **查看 GitHub Issues**：https://github.com/vercel/vercel/issues

**或者随时问我！** 😊
