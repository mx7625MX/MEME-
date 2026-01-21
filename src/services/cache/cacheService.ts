/**
 * 缓存服务
 * 提供高性能的内存缓存，减少重复的 API 调用
 */

export interface CacheEntry<T> {
  data: T;
  expiry: number;
  createdAt: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private stats = {
    hits: 0,
    misses: 0,
  };
  private defaultTTL: number;

  constructor(defaultTTL: number = 5000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;

    // 定期清理过期缓存
    this.startCleanupInterval();
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data: value,
      expiry,
      createdAt: Date.now(),
    });
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * 清除过期缓存
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  /**
   * 启动定时清理
   */
  private startCleanupInterval(): void {
    // 每 30 秒清理一次过期缓存
    setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  /**
   * 带缓存的异步函数包装器
   */
  async memoize<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 执行函数并缓存结果
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * 批量获取
   */
  mget<T>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();

    keys.forEach((key) => {
      result.set(key, this.get<T>(key));
    });

    return result;
  }

  /**
   * 批量设置
   */
  mset<T>(entries: Map<string, T>, ttl?: number): void {
    entries.forEach((value, key) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * 按前缀删除
   */
  deleteByPrefix(prefix: string): number {
    let deleted = 0;

    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    });

    return deleted;
  }

  /**
   * 按正则表达式删除
   */
  deleteByPattern(pattern: RegExp): number {
    let deleted = 0;

    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    });

    return deleted;
  }
}

// 创建全局缓存实例
export const globalCache = new CacheService();

// 特定用途的缓存实例
export const priceCache = new CacheService(2000); // 价格缓存 2 秒
export const tokenInfoCache = new CacheService(60000); // 代币信息缓存 1 分钟
export const rpcCache = new CacheService(10000); // RPC 响应缓存 10 秒
