# 云平台一键部署指南

## 🚀 推荐方案

### 方案一：Vercel + Supabase（最推荐）

**优点：**
- ✅ 零配置，自动化部署
- ✅ 全球 CDN，速度快
- ✅ 自动 HTTPS
- ✅ 免费额度充足
- ✅ Supabase 提供完整的数据库服务

**适用场景：** 个人项目、小型团队

---

## 📦 方案一：Vercel + Supabase

### 第一步：准备 Supabase 数据库

1. 访问 [Supabase](https://supabase.com)
2. 注册账号并创建新项目
3. 等待数据库初始化完成
4. 在项目设置中获取数据库连接字符串

**格式：**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 第二步：部署到 Vercel

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "Add New Project"
4. 导入你的 GitHub 仓库

### 第三步：配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
WALLET_ENCRYPTION_KEY=[生成一个随机密钥]
NODE_ENV=production
```

生成加密密钥：
```bash
openssl rand -base64 32
```

### 第四步：部署

点击 "Deploy" 按钮，等待 2-3 分钟即可完成！

**访问地址：** `https://your-project.vercel.app`

---

## 🚀 方案二：Railway（全栈托管）

**优点：**
- ✅ 一键部署，包含数据库
- ✅ 自动配置环境
- ✅ 无需额外配置数据库
- ✅ 支持多种语言

**适用场景：** 快速原型开发

### 部署步骤

1. 访问 [Railway](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库
5. 添加 PostgreSQL 插件
6. 配置环境变量
7. 点击 "Deploy"

**访问地址：** `https://your-app.railway.app`

---

## 🎨 方案三：Render（简单易用）

**优点：**
- ✅ 界面简洁，易于使用
- ✅ 免费层支持
- ✅ 自动 HTTPS
- ✅ 持续部署

**适用场景：** 初学者、小型项目

### 部署步骤

1. 访问 [Render](https://render.com)
2. 点击 "New +"
3. 选择 "Web Service"
4. 连接 GitHub 仓库
5. 配置构建设置
6. 添加 PostgreSQL 数据库
7. 点击 "Create Web Service"

**访问地址：** `https://your-app.onrender.com`

---

## ⚡ 方案四：Netlify + Supabase

**优点：**
- ✅ 部署速度快
- ✅ 免费额度大
- ✅ 支持多种功能
- ✅ 表单、函数等附加服务

**适用场景：** 静态为主的应用

### 部署步骤

1. 访问 [Netlify](https://netlify.com)
2. 连接 GitHub 仓库
3. 配置构建设置
4. 添加环境变量
5. 点击 "Deploy site"

---

## 📊 方案对比

| 平台 | 部署难度 | 免费额度 | 数据库 | 推荐度 |
|------|---------|---------|--------|--------|
| Vercel + Supabase | ⭐⭐ | 100GB/月 | 需要 | ⭐⭐⭐⭐⭐ |
| Railway | ⭐ | 512MB/月 | 内置 | ⭐⭐⭐⭐ |
| Render | ⭐⭐ | 750小时/月 | 需要 | ⭐⭐⭐⭐ |
| Netlify | ⭐⭐ | 100GB/月 | 需要 | ⭐⭐⭐ |

---

## 🎯 我的推荐

**如果你想要最简单的方案：**
→ **Vercel + Supabase**
- 部署最快（2-3分钟）
- 环境配置最简单
- 全球 CDN 速度最快
- 免费额度最充足

**如果你想要一劳永逸：**
→ **Railway**
- 数据库自动配置
- 所有服务都在一个平台
- 管理最简单

---

## 📝 详细部署步骤（Vercel + Supabase）

### 1. 创建 Supabase 项目

```bash
# 访问 https://supabase.com
# 1. 点击 "New Project"
# 2. 填写项目信息
# 3. 设置数据库密码
# 4. 选择区域（建议选择离你最近的）
# 5. 等待初始化完成（约 2 分钟）
```

### 2. 获取数据库连接字符串

在 Supabase 项目中：
```
Settings → Database → Connection String → URI
```

复制连接字符串，格式如下：
```
postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 3. 部署到 Vercel

```bash
# 访问 https://vercel.com
# 1. 使用 GitHub 登录
# 2. 点击 "Add New"
# 3. 选择 "Project"
# 4. 导入你的仓库
# 5. 配置环境变量
```

### 4. 配置环境变量

在 Vercel 项目设置中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| DATABASE_URL | 你的 Supabase 连接字符串 | 必填 |
| WALLET_ENCRYPTION_KEY | 生成的随机密钥 | 必填 |
| NODE_ENV | production | 推荐 |

### 5. 部署

点击 "Deploy" 按钮，等待 2-3 分钟。

### 6. 访问应用

部署成功后，点击访问链接即可使用！

---

## 🔧 常见问题

### Q1: Vercel 部署失败怎么办？

**A:** 检查以下几点：
- 确保根目录有 `package.json`
- 确保 `vercel.json` 配置正确
- 检查环境变量是否配置

### Q2: 数据库连接失败？

**A:**
- 检查 DATABASE_URL 格式是否正确
- 确认 Supabase 项目已启动
- 检查防火墙设置

### Q3: 如何更新应用？

**A:** 只需要推送到 GitHub，Vercel 会自动重新部署。

### Q4: 免费额度够用吗？

**A:** 个人使用完全够用：
- Vercel: 100GB 带宽/月
- Supabase: 500MB 数据库/月

---

## 🎉 部署成功后

1. 访问你的应用 URL
2. 创建第一个钱包
3. 开始使用做市值功能

祝您使用愉快！

---

## 📞 需要帮助？

- Vercel 文档: https://vercel.com/docs
- Supabase 文档: https://supabase.com/docs
- 提交 Issue 获取帮助
