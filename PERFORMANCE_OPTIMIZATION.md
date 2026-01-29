# 性能优化总结

## 优化内容

### 1. 数据库连接池优化

**修改文件**: `src/storage/database/db.ts`

- 增加 `max` 连接数: 1 → 10
- 启用 `prepare: true` - 预编译语句缓存
- 增加 `max_lifetime: 30 分钟` - 避免连接长时间存活

**预期效果**:
- 减少冷启动时间
- 提高并发处理能力
- 降低数据库连接建立开销

### 2. API 响应缓存机制

**新建文件**: `src/lib/cache.ts`

实现内存缓存功能:
- TTL 过期机制
- 自动清理过期数据
- 支持 GET/SET/DELETE 操作
- 装饰器模式支持

**应用场景**:
- 交易列表查询 (缓存 30 秒)
- 钱包列表查询 (缓存 60 秒)
- 市场数据查询 (缓存 15 秒)

### 3. Vercel 配置优化

**修改文件**: `vercel.json`

- 区域设置: 仅保留香港 (hkg1) 以降低延迟
- 函数超时: 30-60 秒 (不同 API 不同超时)
- 内存分配: 512-1024 MB
- 添加 HTTP 缓存头

### 4. 缓存失效策略

**修改文件**: 
- `src/app/api/wallets/create/route.ts` - 创建钱包后清除缓存
- `src/app/api/transactions/route.ts` - 创建交易后清除缓存

**实现方式**:
```typescript
// 清除用户钱包缓存
cache.delete(`user_wallets:${userId}`);
```

## 性能指标

### 优化前
- 首次响应: 3-5 秒
- 冷启动: 5-8 秒
- 数据库查询: 1-2 秒

### 优化后 (预期)
- 首次响应: 1-2 秒
- 冷启动: 2-3 秒
- 数据库查询: 0.3-0.5 秒 (缓存命中时)
- 缓存命中率: 70-80%

## 使用指南

### 1. 在 API 中使用缓存

```typescript
import { cache } from '@/lib/cache';
import { generateCacheKey } from '@/lib/cache';

// 获取数据
const cacheKey = generateCacheKey('my_resource', param1, param2);
const cached = cache.get(cacheKey);

if (cached) {
  return cached;
}

const data = await fetchData();
cache.set(cacheKey, data, 60000); // 缓存 60 秒
```

### 2. 清除缓存

```typescript
// 删除特定缓存
cache.delete(`user_wallets:${userId}`);

// 清空所有缓存
cache.clear();
```

### 3. 使用装饰器

```typescript
import { cached, generateCacheKey } from '@/lib/cache';

class MyService {
  @cached(
    (id) => generateCacheKey('resource', id),
    60000
  )
  async getResource(id: string) {
    return await fetchData(id);
  }
}
```

## 监控建议

### 1. 添加缓存日志

```typescript
console.log('缓存命中:', cacheKey);
console.log('缓存未命中，查询数据库');
```

### 2. 监控缓存命中率

在 API 响应中添加缓存标识:
```typescript
return NextResponse.json({
  success: true,
  data: result,
  cached: cached !== null
});
```

### 3. Vercel Analytics

- 监控函数执行时间
- 监控冷启动频率
- 监控内存使用情况

## 注意事项

### 1. 缓存过期时间

| 数据类型 | 推荐缓存时间 | 原因 |
|---------|------------|------|
| 用户数据 | 30-60 秒 | 频繁变更 |
| 交易列表 | 15-30 秒 | 实时性要求高 |
| 市场数据 | 5-15 秒 | 价格快速变化 |
| 配置数据 | 300-600 秒 | 变更频率低 |

### 2. 缓存键设计

- 使用前缀分类: `user_transactions:`, `market_data:`, `wallets:`
- 包含参数: `user_transactions:${userId}:${limit}:${offset}`
- 避免冲突: 不同数据类型使用不同前缀

### 3. 缓存失效

- 写入操作后立即清除相关缓存
- 避免缓存雪崩: 设置不同的过期时间
- 定期清理: 系统会自动清理过期数据

## 后续优化

### 1. Redis 集成

当前使用内存缓存，未来可以升级到 Redis:
- 支持分布式部署
- 持久化存储
- 更强大的数据结构

### 2. CDN 缓存

对静态数据和公开 API 使用 CDN:
- 减少服务器负载
- 提高全球访问速度

### 3. 数据库查询优化

- 添加合适的索引
- 优化复杂查询
- 使用物化视图

## 部署检查清单

- [x] 数据库连接池配置
- [x] 缓存机制实现
- [x] Vercel 配置优化
- [ ] 推送代码到 Git
- [ ] Vercel 重新部署
- [ ] 测试性能指标
- [ ] 监控缓存命中率
