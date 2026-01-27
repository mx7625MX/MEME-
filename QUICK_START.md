# 🚀 单人用户快速开始指南

## 📋 最简部署流程（3 步）

### 步骤 1：准备工作（5 分钟）

```bash
# 1. 注册账号（免费）
- Vercel: https://vercel.com
- GitHub: https://github.com
- Supabase: https://supabase.com

# 2. 获取密钥
- Supabase DATABASE_URL（在 Supabase Dashboard > Project Settings > API）
- 你的钱包私钥（0x...，仅用于服务端签名）
```

### 步骤 2：部署（15 分钟）

```bash
# 1. 运行快速部署脚本
./quick-deploy.sh

# 2. 按照提示操作：
   - 输入 GitHub 用户名和仓库名
   - 输入环境变量
   - 等待部署完成

# 3. 访问你的应用
https://meme-master-pro.vercel.app
```

### 步骤 3：初始化数据库（10 分钟）

```bash
# 访问 Supabase Dashboard: https://app.supabase.com
# 创建新项目，然后执行以下 SQL：

-- 复制并粘贴完整的 SQL 脚本
-- （见 PERSONAL_DEPLOYMENT_GUIDE.md 的"数据库初始化"部分）
```

---

## ✅ 完成后的清单

- [ ] 应用可以访问（Vercel URL）
- [ ] 环境变量已配置
- [ ] 数据库表已创建
- [ ] 钱包已添加
- [ ] 测试交易成功

---

## 🎯 启用真实交易

### 1. 配置 Jito（可选）

```
1. 访问应用 > 设置
2. 输入 Jito Shred Key
3. 保存
```

### 2. 修改代码

编辑 `src/app/api/portfolios/monitor/route.ts`，将模拟代码替换为真实调用。

### 3. 测试

- 创建测试钱包
- 充入少量 SOL（0.01）
- 执行小额交易
- 在 Solana Explorer 验证

---

## 📝 更新应用

```bash
# 修改代码后，只需：
git add .
git commit -m "描述你的修改"
git push origin main

# Vercel 自动部署，1-2 分钟完成
```

---

## 🔍 查看日志

```bash
# Vercel Dashboard
https://vercel.com/dashboard

# 或使用 CLI
vercel logs
```

---

## 💰 费用

| 服务 | 费用 |
|------|------|
| Vercel | 免费（个人使用） |
| Supabase | 免费（个人使用） |
| Solana 交易 | 约 $0.001/笔 |

**总费用：$0/月（除了实际交易费）**

---

## 🆘 遇到问题？

### 常见问题

1. **部署失败**
   ```bash
   # 检查配置
   ./check-config.sh

   # 查看日志
   vercel logs
   ```

2. **数据库连接失败**
   - 检查 DATABASE_URL 格式
   - 确认 Supabase 项目正在运行

3. **交易失败**
   - 检查钱包余额
   - 验证 RPC URL
   - 查看 Solana Explorer

### 获取帮助

- 查看 [PERSONAL_DEPLOYMENT_GUIDE.md](./PERSONAL_DEPLOYMENT_GUIDE.md) 了解详细信息
- 查看 [JITO_INTEGRATION_STATUS.md](./JITO_INTEGRATION_STATUS.md) 了解 Jito 集成

---

## 🎉 开始使用

**准备好了吗？**

```bash
# 立即开始部署
./quick-deploy.sh
```

**30 分钟后，你就可以使用真实交易了！** 🚀
