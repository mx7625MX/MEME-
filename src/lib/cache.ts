/**
 * 简单的内存缓存实现
 * 用于缓存 API 响应，减少数据库查询和冷启动时间
 *
 * ⚠️ Vercel Serverless 环境限制：
 * - 内存缓存只对单个函数实例有效
 * - Vercel 可能有多个函数实例并行运行
 * - 缓存命中率可能低于预期（30-50%）
 * - 如需更好的缓存性能，建议使用 Redis
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 60000; // 默认 60 秒

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取或设置缓存（类似 Redis GETSET）
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// 导出单例
export const cache = new MemoryCache();

/**
 * 缓存装饰器 - 用于包装 API 响应
 */
export function cached<T>(
  keyFn: (...args: any[]) => string,
  ttl: number = 60000
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyFn(...args);
      
      const cached = cache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}

/**
 * 生成缓存键的辅助函数
 */
export function generateCacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.map(p => JSON.stringify(p)).join(':')}`;
}
