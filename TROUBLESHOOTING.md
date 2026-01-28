# Vercel 部署问题排查指南

## 问题：部署成功但打不开网页

---

## 📋 排查步骤

### 步骤 1: 检查部署状态

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 点击 `Deployments` 标签
4. 查看最新部署的状态

**正常状态**:
- ✅ `Ready` - 部署成功
- ✅ 绿色图标 - 无错误

**异常状态**:
- ❌ `Build Failed` - 构建失败
- ❌ `Deployment Failed` - 部署失败
- ❌ 红色图标 - 有错误
- ⚠️ `Canceled` - 部署被取消

---

### 步骤 2: 查看部署日志

如果部署状态异常，查看详细日志：

1. 点击最新的部署
2. 滚动到底部查看日志
3. 寻找错误信息

#### 常见错误类型

##### 错误 1: Build Failed - 构建失败

**可能原因**:
- TypeScript 类型错误
- 依赖安装失败
- 构建脚本错误

**解决方法**:
```bash
# 本地测试构建
pnpm install
pnpm build
```

**常见错误示例**:
```
Error: Build failed with 1 error:
src/app/page.tsx:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.
```

---

##### 错误 2: Out of Memory - 内存不足

**错误信息**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**解决方法**:
在 `package.json` 中增加内存限制：
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

---

### 步骤 3: 查看函数日志

如果部署成功但网页打不开，查看运行时日志：

1. 在部署页面，点击 `Function Logs` 标签
2. 查看是否有运行时错误

#### 常见运行时错误

##### 错误 1: 数据库连接失败

**错误信息**:
```
Error: PGDATABASE_URL 环境变量未设置
```

**解决方法**:
1. 检查环境变量是否配置
2. 确认变量名正确（PGDATABASE_URL、POSTGRES_URL 或 DATABASE_URL）
3. 重新部署

---

##### 错误 2: 缺少必需的环境变量

**错误信息**:
```
Error: ENCRYPTION_KEY 环境变量未设置
```

**解决方法**:
添加缺少的环境变量：
- `ENCRYPTION_KEY`
- `ENCRYPTION_SALT`

**生成命令**:
```bash
# 生成 ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成 ENCRYPTION_SALT
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

##### 错误 3: 数据库表不存在

**错误信息**:
```
Error: relation "wallets" does not exist
```

**解决方法**:
运行数据库迁移，创建表结构：
```bash
# 使用 Drizzle Kit
pnpm exec drizzle-kit push:pg --config=drizzle.config.ts
```

---

##### 错误 4: 依赖缺失

**错误信息**:
```
Error: Cannot find module 'xxx'
```

**解决方法**:
1. 检查 `package.json` 中是否包含该依赖
2. 确认使用 `pnpm install` 安装
3. 重新部署

---

### 步骤 4: 测试特定路由

如果主页打不开，尝试访问特定路由：

#### 测试 API 路由

```bash
# 测试健康检查（如果有）
curl https://your-app.vercel.app/api/health

# 测试市场数据 API
curl https://your-app.vercel.app/api/market

# 测试钱包列表 API
curl https://your-app.vercel.app/api/wallets
```

#### 测试静态资源

```bash
# 测试首页 HTML
curl https://your-app.vercel.app/

# 测试 favicon
curl -I https://your-app.vercel.app/favicon.ico
```

---

### 步骤 5: 检查浏览器控制台

如果网页可以打开但显示错误：

1. 打开浏览器开发者工具（F12）
2. 查看 `Console` 标签
3. 查看是否有 JavaScript 错误

#### 常见浏览器错误

##### 错误 1: 404 Not Found

**原因**: 路由不存在

**解决方法**:
- 检查路由路径是否正确
- 确认文件存在于 `src/app/` 目录

---

##### 错误 2: 500 Internal Server Error

**原因**: 服务器内部错误

**解决方法**:
- 查看 Vercel Function Logs
- 检查是否有运行时错误
- 检查环境变量配置

---

##### 错误 3: 静态资源加载失败

**错误信息**:
```
GET https://your-app.vercel.app/_next/static/xxx net::ERR_CONNECTION_RESET
```

**解决方法**:
- 等待几分钟后重试
- 清除浏览器缓存
- 重新部署

---

### 步骤 6: 检查 Vercel 配置

#### 检查 `vercel.json`

确认 `vercel.json` 配置正确：

```json
{
  "buildCommand": "pnpm install && npx next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1", "sin1"],
  "functions": {
    "app/api/**": {
      "maxDuration": 60
    }
  }
}
```

#### 检查 `.next` 目录

确保构建输出正确：

```bash
# 本地测试
pnpm build
ls -la .next
```

应该看到以下文件：
- `BUILD_ID`
- `static/`
- `server/`
- 其他构建文件

---

## 🔧 快速修复方案

### 方案 1: 重新部署

如果部署成功但无法访问，尝试重新部署：

1. 在 Vercel Dashboard 中
2. 点击 `Deployments` 标签
3. 找到最新的部署
4. 点击 `...` 菜单
5. 选择 `Redeploy`

---

### 方案 2: 清除构建缓存

如果构建出现问题，清除缓存后重新构建：

1. 在 Vercel Dashboard 中
2. 点击 `Settings` > `Git`
3. 滚动到 `Ignored Build Step`
4. 添加：
   ```
   rm -rf .next
   ```
5. 保存并重新部署

---

### 方案 3: 使用本地构建

如果 Vercel 构建一直失败，可以：

1. 本地构建成功
2. 提交构建产物（不推荐，仅用于调试）

---

## 🚨 常见问题及解决方案

### 问题 1: 白屏（页面空白）

**原因**: JavaScript 错误导致页面无法渲染

**解决方法**:
1. 打开浏览器开发者工具（F12）
2. 查看 Console 中的错误信息
3. 修复错误后重新部署
4. 清除浏览器缓存

---

### 问题 2: 加载缓慢

**原因**: 区域配置不当或网络问题

**解决方法**:
1. 检查 `vercel.json` 中的 `regions` 配置
2. 选择离用户最近的区域
3. 启用缓存

---

### 问题 3: 部署超时

**错误信息**:
```
Error: Build time exceeded the maximum duration
```

**解决方法**:
1. 优化构建流程
2. 减少不必要的依赖
3. 升级到付费计划（增加构建时间）

---

### 问题 4: 环境变量未生效

**原因**: 环境变量配置后未重新部署

**解决方法**:
1. 添加环境变量后必须重新部署
2. 确认环境变量在正确的环境中（Production）
3. 检查变量名是否正确

---

## 📊 监控和调试

### 启用 Vercel Analytics

1. 在 Vercel Dashboard 中
2. 点击 `Analytics` 标签
3. 点击 `Enable Analytics`
4. 查看访问量、页面加载时间等指标

### 查看实时日志

使用 Vercel CLI 查看实时日志：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 查看实时日志
vercel logs --follow
```

---

## 🆘 获取帮助

### 查看官方文档

- [Vercel 部署文档](https://vercel.com/docs/deployments/overview)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 文档](https://vercel.com/docs)

### 联系支持

- [Vercel 支持论坛](https://vercel.com/support)
- [GitHub Issues](https://github.com/vercel/vercel/issues)

---

## ✅ 检查清单

在提交问题前，请确认：

- [ ] 部署状态为 `Ready`
- [ ] 无构建错误
- [ ] 环境变量已配置
- [ ] 数据库已创建并迁移
- [ ] 函数日志中无错误
- [ ] 浏览器控制台无错误
- [ ] 已尝试重新部署
- [ ] 已清除浏览器缓存

---

## 🎯 快速诊断流程

1. **部署状态异常？**
   → 查看 Deployments 日志，修复构建错误

2. **部署成功但 404？**
   → 检查路由配置，确认文件存在

3. **部署成功但 500？**
   → 查看 Function Logs，检查运行时错误

4. **网页打开但白屏？**
   → 查看浏览器 Console，修复 JavaScript 错误

5. **数据库相关错误？**
   → 检查环境变量，运行数据库迁移

6. **环境变量错误？**
   → 确认变量名正确，重新部署

---

## 📝 日志示例

### 正常日志

```
Build Completed in 2m 30s
Deployed to https://your-app.vercel.app
```

### 异常日志 - 构建失败

```
Error: Build failed with 2 errors:
src/app/page.tsx:10:5 - error TS2322
src/components/Header.tsx:15:3 - error TS2304
```

### 异常日志 - 运行时错误

```
Error: Cannot connect to database
at getDb (src/storage/database/db.ts:25:15)
at createWallet (src/app/api/wallets/create/route.ts:42:10)
```

---

**按照以上步骤排查，通常可以解决大多数部署问题。** 🚀
