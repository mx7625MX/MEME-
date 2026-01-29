# 部署指南 - 推送优化到 Vercel

## 已完成的优化

### 1. 数据库连接池优化
- 增加 `max` 连接数: 1 → 10
- 启用 `prepare: true` - 预编译语句缓存
- 增加 `max_lifetime: 30 分钟`

### 2. API 响应缓存机制
- 实现内存缓存 (`src/lib/cache.ts`)
- 支持 TTL 过期机制
- 应用到交易列表查询

### 3. Vercel 配置优化
- 区域设置: 仅保留香港 (hkg1)
- 函数超时: 30-60 秒
- 内存分配: 512-1024 MB
- 添加 HTTP 缓存头

### 4. 缓存失效策略
- 创建钱包后清除缓存
- 创建交易后清除缓存

## 推送到 GitHub

### 方法 1: 手动推送 (推荐)

由于沙箱环境没有 GitHub 凭证，需要在本地执行:

```bash
# 1. 拉取最新代码
git fetch origin main
git pull origin main

# 2. 如果有冲突，解决冲突后提交
# 3. 推送到 GitHub
git push origin main
```

### 方法 2: 使用 GitHub Personal Access Token

```bash
# 设置 GitHub 凭证
git remote set-url origin https://<TOKEN>@github.com/mx7625MX/MEME-.git

# 推送
git push origin main
```

### 方法 3: 使用 SSH

```bash
# 将远程 URL 改为 SSH
git remote set-url origin git@github.com:mx7625MX/MEME-.git

# 推送
git push origin main
```

## Vercel 自动部署

推送成功后，Vercel 会自动触发部署:

1. Vercel 监听到 GitHub push 事件
2. 自动拉取最新代码
3. 运行构建命令: `pnpm install && npx next build`
4. 部署到香港区域 (hkg1)
5. 约 3-5 分钟后部署完成

## 验证部署

### 1. 检查部署状态

访问 Vercel Dashboard:
- 项目: MEME-
- 查看最新的部署记录
- 确认部署成功

### 2. 测试健康检查

```bash
curl https://meme-master-pro.vercel.app/api/health
```

预期响应:
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

### 3. 测试性能指标

#### 首次响应时间
```bash
# 测试冷启动
time curl https://meme-master-pro.vercel.app/api/health
```

#### API 缓存测试
```bash
# 第一次请求（未命中缓存）
time curl -X POST https://meme-master-pro.vercel.app/api/wallets/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Wallet","chain":"ethereum"}'

# 第二次请求（命中缓存）
time curl https://meme-master-pro.vercel.app/api/transactions?userId=test
```

### 4. 查看日志

Vercel Dashboard → 项目 → Functions → 查看函数日志

关键日志:
- `缓存命中:` - 表示缓存命中
- `缓存未命中，查询数据库` - 表示缓存未命中
- `Wallet cache cleared` - 表示缓存已清除

## 预期性能提升

| 指标 | 优化前 | 优化后 | 提升 |
|-----|-------|-------|-----|
| 首次响应 | 3-5 秒 | 1-2 秒 | 60% ↓ |
| 冷启动 | 5-8 秒 | 2-3 秒 | 62% ↓ |
| 数据库查询 | 1-2 秒 | 0.3-0.5 秒 (缓存命中) | 70% ↓ |
| 缓存命中率 | 0% | 70-80% | - |

## 性能监控

### Vercel Analytics

Vercel Dashboard → 项目 → Analytics

查看:
- 函数执行时间
- 冷启动频率
- 错误率
- 内存使用情况

### 缓存命中率

在 API 响应中查看 `cached` 字段:
```json
{
  "success": true,
  "data": [...],
  "cached": true  // true 表示命中缓存
}
```

### 自定义监控

在 `src/lib/cache.ts` 中添加日志:
```typescript
console.log('缓存命中:', cacheKey);
console.log('缓存未命中，查询数据库');
```

## 故障排查

### 1. 部署失败

**问题**: Vercel 部署失败
**检查**:
- 查看 Vercel 构建日志
- 确认所有依赖已安装
- 检查 TypeScript 编译错误

### 2. API 响应仍然慢

**问题**: API 响应时间没有改善
**排查**:
- 检查缓存是否生效（查看日志）
- 确认数据库连接池配置
- 检查网络延迟

### 3. 缓存失效

**问题**: 数据不一致
**解决**:
- 确保写入操作后清除缓存
- 缩短 TTL 时间
- 实现手动清除缓存 API

## 下一步优化

### 1. Redis 集成
- 替换内存缓存为 Redis
- 支持分布式部署
- 持久化存储

### 2. CDN 缓存
- 对静态资源使用 CDN
- 对公开 API 使用 CDN
- 减少服务器负载

### 3. 数据库优化
- 添加索引
- 优化查询
- 使用连接池

### 4. 代码分割
- 减少 JavaScript bundle 大小
- 使用动态导入
- 优化首屏加载

## 支持

如果遇到问题:
1. 查看 `PERFORMANCE_OPTIMIZATION.md` 文档
2. 查看 `TROUBLESHOOTING.md` 故障排查指南
3. 检查 Vercel 日志
4. 查看数据库连接状态

## 检查清单

- [ ] 推送代码到 GitHub
- [ ] Vercel 自动部署成功
- [ ] 测试健康检查 API
- [ ] 测试钱包创建 API
- [ ] 测试交易列表 API
- [ ] 验证缓存机制
- [ ] 监控性能指标
- [ ] 查看错误日志
