# GitHub 自动部署 - 快速参考表

## 🚀 20 分钟快速部署

### 第 1 步：创建 GitHub 仓库（3 分钟）
```
1. 访问 https://github.com/new
2. 填写：
   - Repository name: meme-master-pro
   - Public
3. 点击 Create repository
4. 复制仓库地址：https://github.com/你的用户名/meme-master-pro.git
```

### 第 2 步：推送代码到 GitHub（5 分钟）
```bash
git remote add origin https://github.com/你的用户名/meme-master-pro.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### 第 3 步：在 Vercel 导入仓库（2 分钟）
```
1. 访问 https://vercel.com
2. 登录（使用 GitHub）
3. 点击 Add New > Project
4. 找到 meme-master-pro 仓库
5. 点击 Import
```

### 第 4 步：配置环境变量（5 分钟）
在 Vercel Project Settings 中添加：

| 变量名 | 值 |
|--------|-----|
| DATABASE_URL | 从 Supabase 获取 |
| WALLET_PRIVATE_KEY | 你的钱包私钥 (0x...) |
| SOLANA_RPC_URL | https://api.mainnet-beta.solana.com |
| JITO_RPC_URL | https://mainnet.block-engine.jito.wtf/api/v1 |
| JITO_BUNDLE_URL | https://mainnet.block-engine.jito.wtf/api/v1/bundles |

### 第 5 步：部署（2 分钟）
```
1. 点击 Deploy 按钮
2. 等待 1-2 分钟
3. 部署完成！
4. 访问: https://meme-master-pro.vercel.app
```

### 第 6 步：初始化数据库（3 分钟）
```
1. 访问 https://app.supabase.com
2. 创建项目（如果还没有）
3. 复制 DATABASE_URL
4. 更新 Vercel 环境变量
5. 在 SQL Editor 中执行数据库创建脚本
```

---

## ✅ 检查清单

- [ ] GitHub 仓库已创建
- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已导入
- [ ] 环境变量已配置
- [ ] 部署成功
- [ ] 可以访问应用
- [ ] Supabase 项目已创建
- [ ] 数据库表已创建

---

## 🔧 关键链接

| 服务 | 链接 |
|------|------|
| GitHub | https://github.com |
| Vercel | https://vercel.com |
| Supabase | https://supabase.com |
| 你的应用 | https://meme-master-pro.vercel.app |

---

## 🔄 更新应用

```bash
git add .
git commit -m "描述修改"
git push origin main

# Vercel 自动部署！
```

---

## 📞 获取帮助

- 详细指南：查看 `GITHUB_AUTO_DEPLOY_GUIDE.md`
- Vercel 文档：https://vercel.com/docs
- Supabase 文档：https://supabase.com/docs
