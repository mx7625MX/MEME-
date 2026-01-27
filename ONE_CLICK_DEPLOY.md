[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/meme-master-pro)

[![Deploy with Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-username/meme-master-pro)

[![Deploy with Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-username/meme-master-pro)

---

# 一键部署到云平台

点击上面的按钮，按照提示操作，几分钟内即可完成部署！

## 🚀 Vercel 部署（推荐）

点击 "Deploy with Vercel" 按钮，然后：

1. 连接你的 GitHub 账号
2. 导入仓库或克隆模板
3. 配置环境变量：
   - `DATABASE_URL`: 你的 Supabase 数据库连接字符串
   - `WALLET_ENCRYPTION_KEY`: 生成的随机密钥（`openssl rand -base64 32`）
4. 点击 "Deploy"

## 🎨 Railway 部署

点击 "Deploy with Railway" 按钮，然后：

1. 连接你的 GitHub 账号
2. 选择仓库或克隆模板
3. 添加 PostgreSQL 数据库
4. 配置 `WALLET_ENCRYPTION_KEY` 环境变量
5. 点击 "Deploy"

## 🎯 Render 部署

点击 "Deploy with Render" 按钮，然后：

1. 连接你的 GitHub 账号
2. 选择仓库或克隆模板
3. 配置构建设置
4. 添加 PostgreSQL 数据库
5. 配置环境变量
6. 点击 "Create Web Service"

---

## 📚 详细文档

- [5分钟快速部署](./QUICK_CLOUD.md)
- [云平台完整指南](./CLOUD_DEPLOYMENT.md)
