# 推送代码到 GitHub 指南

## 当前状态

- ✅ 本地有 **3 个提交** 待推送
- ✅ 远程仓库已配置：`https://github.com/mx7625MX/MEME-.git`
- ❌ 需要配置 GitHub 认证才能推送

## 待推送的提交

```
b573f0c fix: 配置数据库环境变量 PGDATABASE_URL
3ce5243 fix: 改进钱包创建的错误处理和用户提示
748a99c docs: 完成服务器部署配置方案和数据库架构说明
```

---

## 方法 1：使用 Personal Access Token（推荐）⭐

### 步骤 1：创建 Personal Access Token

1. **访问 GitHub Token 设置页面**：
   - 网址：https://github.com/settings/tokens

2. **创建新 Token**：
   - 点击 **"Generate new token"**
   - 选择 **"Generate new token (classic)"**

3. **配置 Token**：
   - **Note（备注）**: `Meme Master Pro Development`
   - **Expiration（过期时间）**: 选择 `90 days` 或 `No expiration`
   - **Scopes（权限）**: 勾选以下选项：
     - ✅ `repo` - 完整仓库权限
     - ✅ `workflow` - GitHub Actions 权限（可选）

4. **生成并复制 Token**：
   - 点击 **"Generate token"**
   - **立即复制 Token**（只显示一次！）

### 步骤 2：配置 Git 并推送

在你的**本地终端**中执行以下命令：

```bash
# 1. 进入项目目录
cd /path/to/MEME-

# 2. 配置 Git 凭据助手
git config credential.helper store

# 3. 推送到 GitHub（会提示输入凭据）
git push origin main
```

当提示输入时：
- **Username**: `mx7625MX`（你的 GitHub 用户名）
- **Password**: 粘贴刚才复制的 **Personal Access Token**

### 步骤 3：验证推送

推送成功后，访问你的 GitHub 仓库：
```
https://github.com/mx7625MX/MEME-
```

你应该能看到最新的 3 个提交。

---

## 方法 2：使用 SSH 密钥（更安全）🔒

### 步骤 1：生成 SSH 密钥

```bash
# 生成 ED25519 密钥（推荐）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 或者使用 RSA 密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

按提示操作：
- **Enter file**: 直接回车（使用默认路径）
- **Enter passphrase**: 可以设置密码或直接回车（留空）

### 步骤 2：复制公钥

```bash
# 复制公钥内容
cat ~/.ssh/id_ed25519.pub
```

### 步骤 3：添加 SSH 密钥到 GitHub

1. 访问：https://github.com/settings/keys
2. 点击 **"New SSH key"**
3. 填写：
   - **Title**: `你的电脑名称`（例如：`MacBook Pro`）
   - **Key**: 粘贴刚才复制的公钥内容
4. 点击 **"Add SSH key"**

### 步骤 4：测试 SSH 连接

```bash
ssh -T git@github.com
```

如果看到类似以下信息，说明成功：
```
Hi mx7625MX! You've successfully authenticated, but GitHub does not provide shell access.
```

### 步骤 5：更改远程仓库 URL 并推送

```bash
# 进入项目目录
cd /path/to/MEME-

# 更改远程仓库 URL 为 SSH
git remote set-url origin git@github.com:mx7625MX/MEME-.git

# 推送到 GitHub
git push origin main
```

---

## 方法 3：在 GitHub 上下载代码（备选方案）

如果无法配置 Git 认证，可以手动提交：

### 步骤 1：下载项目文件

从沙箱环境中下载所有文件：
```bash
cd /workspace/projects
tar -czf meme-master-pro.tar.gz .
```

### 步骤 2：在 GitHub 上创建 Pull Request

1. **Fork 仓库**（如果需要）
2. 在本地克隆你的 Fork：
   ```bash
   git clone https://github.com/your-username/MEME-.git
   cd MEME-
   ```

3. **复制文件**：
   - 解压刚才下载的 `meme-master-pro.tar.gz`
   - 将所有文件复制到克隆的仓库中

4. **提交并推送**：
   ```bash
   git add .
   git commit -m "fix: 配置数据库环境变量和改进错误处理"
   git push origin main
   ```

---

## 推送后验证清单

推送成功后，检查以下项目：

### 仓库文件

- [ ] `src/app/page.tsx` - 主页面
- [ ] `src/app/api/wallets/create/route.ts` - 创建钱包 API
- [ ] `src/app/api/wallets/import/route.ts` - 导入钱包 API
- [ ] `src/storage/database/walletManager.ts` - 钱包管理器
- [ ] `src/storage/database/shared/schema.ts` - 数据库模型
- [ ] `.env` - 环境变量配置（注意：不要推送敏感信息）

### 文档文件

- [ ] `docs/DEPLOYMENT-GUIDE.md` - 部署指南
- [ ] `docs/WALLET_TROUBLESHOOTING.md` - 钱包故障排查
- [ ] `docs/DATABASE_ENV_FIX.md` - 数据库环境变量修复
- [ ] `QUICK_FIX_WALLET_ISSUE.md` - 快速修复指南
- [ ] `docs/GIT_PUSH_GUIDE.md` - 本文档

### 提交记录

- [ ] `b573f0c` - 配置数据库环境变量 PGDATABASE_URL
- [ ] `3ce5243` - 改进钱包创建的错误处理和用户提示
- [ ] `748a99c` - 完成服务器部署配置方案和数据库架构说明

---

## ⚠️ 安全提示

### 不要推送的文件

确保以下文件/目录在 `.gitignore` 中：

```gitignore
# 环境变量文件
.env
.env.local
.env.production

# 依赖目录
node_modules/

# 构建输出
.next/
out/
dist/

# 日志文件
*.log
logs/

# 操作系统文件
.DS_Store
Thumbs.db

# IDE 配置
.vscode/
.idea/

# 临时文件
*.tmp
*.swp
```

### 敏感信息

**不要在代码中硬编码**：
- ❌ 数据库密码
- ❌ API 密钥
- ❌ 私钥
- ❌ 加密密钥

**应该使用环境变量**：
```typescript
// ✅ 正确
const dbUrl = process.env.PGDATABASE_URL;

// ❌ 错误
const dbUrl = "postgresql://user:password@host:5432/db";
```

---

## 📞 需要帮助？

如果遇到问题，检查以下资源：

### 常见错误

**错误 1**：`fatal: could not read Username`
- **原因**：未配置认证
- **解决**：使用方法 1 或方法 2 配置认证

**错误 2**：`fatal: remote origin already exists`
- **原因**：远程仓库已存在
- **解决**：检查配置：`git remote -v`

**错误 3**：`error: failed to push some refs`
- **原因**：远程仓库有新的提交
- **解决**：先拉取：`git pull origin main --rebase`

### 有用的命令

```bash
# 查看远程仓库配置
git remote -v

# 查看当前分支状态
git status

# 查看提交历史
git log --oneline -5

# 查看待推送的提交
git log origin/main..HEAD --oneline

# 强制推送（谨慎使用）
git push origin main --force
```

---

## ✅ 成功标志

推送成功后，你应该看到：

```
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Delta compression using up to 8 threads
Compressing objects: 100% (10/10), done.
Writing objects: 100% (15/15), 3.45 KiB | 1.15 MiB/s, done.
Total 15 (delta 5), reused 0 (delta 0), pack-reused 0
To https://github.com/mx7625MX/MEME-.git
   a1b2c3d..b573f0c  main -> main
```

访问你的 GitHub 仓库确认：
```
https://github.com/mx7625MX/MEME-
```

---

## 🎯 下一步

推送成功后，你可以：

1. ✅ **查看提交历史**：确认所有更改已推送
2. ✅ **创建 Pull Request**（如果需要合并到其他分支）
3. ✅ **部署到生产环境**：使用 `scripts/deploy.sh`
4. ✅ **配置 CI/CD**：设置 GitHub Actions 自动部署

---

**祝你推送成功！🚀**
