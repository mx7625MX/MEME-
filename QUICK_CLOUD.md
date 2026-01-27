# 🚀 5分钟快速部署到云平台

## 最简单的方式（推荐）

### 方案选择

**选择 1：Vercel + Supabase（最推荐）**
- ⏱️ 部署时间：2-3 分钟
- 💰 免费：完全免费
- 🔧 难度：⭐（非常简单）
- 🌐 速度：全球 CDN，极快

**选择 2：Railway**
- ⏱️ 部署时间：3-5 分钟
- 💰 免费：5美元/月额度
- 🔧 难度：⭐⭐（简单）
- 🌐 速度：快

---

## 📝 Vercel + Supabase 3 步部署

### 第1步：创建 Supabase 数据库（2分钟）

1. 访问 https://supabase.com
2. 点击 "New Project"
3. 填写：
   - Name: `meme-master`
   - Database Password: 设置一个密码
   - Region: 选择离你最近的区域
4. 点击 "Create new project"
5. 等待 2 分钟直到初始化完成

### 第2步：获取数据库连接（30秒）

1. 在 Supabase 项目中，点击左侧 "Settings"
2. 点击 "Database"
3. 找到 "Connection String" 部分
4. 选择 "URI" 标签
5. 点击复制按钮

连接字符串格式：
```
postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 第3步：部署到 Vercel（2分钟）

1. 访问 https://vercel.com
2. 点击 "Sign Up"，使用 GitHub 登录
3. 点击 "Add New" → "Project"
4. 导入你的 GitHub 仓库
5. 配置环境变量（重要！）：

   点击 "Environment Variables"，添加：

   ```
   DATABASE_URL = [粘贴你的 Supabase 连接字符串]
   WALLET_ENCRYPTION_KEY = [生成一个随机密钥，下面告诉你怎么生成]
   NODE_ENV = production
   ```

   **生成加密密钥：**
   在终端运行：
   ```bash
   openssl rand -base64 32
   ```
   复制生成的密钥

6. 点击 "Deploy" 按钮
7. 等待 2-3 分钟

### 完成！🎉

点击 Vercel 提供的访问链接，你的网站就上线了！

---

## 🎨 Railway 2 步部署（更简单）

### 第1步：连接 GitHub（1分钟）

1. 访问 https://railway.app
2. 点击 "New Project"
3. 点击 "Deploy from GitHub repo"
4. 授权 Railway 访问你的 GitHub
5. 选择你的仓库

### 第2步：配置并部署（2分钟）

1. 点击 "Add Database" → "PostgreSQL"
2. 在项目设置中，添加环境变量：

   ```
   WALLET_ENCRYPTION_KEY = [生成的随机密钥]
   ```

3. 点击 "Deploy"
4. 等待 3-5 分钟

### 完成！🎉

点击 Railway 提供的访问链接，你的网站就上线了！

---

## 💡 我的建议

**如果你是第一次部署：**
→ 使用 **Vercel + Supabase**
- 步骤清晰
- 文档完善
- 出问题容易解决

**如果你想要最简单：**
→ 使用 **Railway**
- 步骤最少
- 数据库自动配置
- 一站式管理

---

## 📚 更详细的文档

如果需要更详细的说明，请查看：
- [云平台完整部署指南](./CLOUD_DEPLOYMENT.md)
- [传统部署方式](./DEPLOYMENT.md)

---

## ⚠️ 重要提醒

1. **不要泄露你的数据库密码**
2. **保存好你的环境变量**
3. **定期备份 Supabase 数据**
4. **监控 Vercel/Railway 的使用量**

---

## 🎯 部署成功后的下一步

1. 创建你的第一个钱包
2. 配置 RPC 节点（可选）
3. 创建做市值策略
4. 开始使用！

---

**准备好开始了吗？**

选择上面的方案，按照步骤操作，5分钟内就能让您的网站上线！🚀
