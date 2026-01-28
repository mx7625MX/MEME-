/**
 * 简化的搜索客户端实现
 * 用于在 Vercel 环境中替代 coze-coding-dev-sdk 的搜索功能
 */

export interface SearchOptions {
  searchType?: 'web' | 'image';
  count?: number;
  needContent?: boolean;
  needUrl?: boolean;
  timeRange?: string; // '1h', '1d', '1w', '1m'
  needSummary?: boolean;
}

export interface SearchResult {
  id?: string;
  title?: string;
  content?: string;
  snippet?: string;
  summary?: string;
  url?: string;
  site_name?: string;
  publish_time?: string;
}

export interface SearchResponse {
  web_items?: SearchResult[];
  status?: string;
  message?: string;
}

export class SearchClient {
  private config: any;

  constructor(config: any = {}) {
    this.config = config;
  }

  /**
   * 执行高级搜索
   * 注意：这是模拟实现，实际使用时需要集成真实的搜索服务
   */
  async advancedSearch(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    // 在 Vercel 环境中，返回模拟数据
    console.warn('SearchClient is using mock implementation in Vercel environment');

    const count = options.count || 5;

    // 返回模拟数据
    const mockResults: SearchResult[] = Array.from({ length: count }, (_, i) => ({
      id: `mock-${i}`,
      title: `Mock Result ${i + 1} for: ${query}`,
      content: `This is mock content for search query: ${query}`,
      snippet: `Mock snippet for result ${i + 1}`,
      summary: `Mock summary for result ${i + 1}`,
      url: `https://example.com/mock-${i}`,
      site_name: 'Mock Source',
      publish_time: new Date().toISOString(),
    }));

    return {
      web_items: mockResults,
      status: 'success',
    };
  }
}

export class Config {
  constructor() {
    // 配置初始化
  }
}

// 导出默认实例
export const defaultConfig = new Config();
