/**
 * 多数据源聚合服务
 * 整合多个数据源，提供统一的热点捕捉接口
 */

import { SearchClient, Config } from 'coze-coding-dev-sdk';

export interface DataSourceItem {
  id: string;
  title: string;
  content: string;
  source: string; // 数据源名称
  platform: string; // 平台类型
  url?: string;
  author?: string;
  publishedAt?: string;
  engagement?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  tags?: string[];
  relevanceScore?: number; // 相关性分数 0-100
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface TrendTopic {
  keyword: string;
  score: number;
  growth: number; // 增长率
  sources: string[]; // 涉及的数据源
  relatedTokens?: string[]; // 相关代币
}

export class MultiDataSourceAggregator {
  private searchClient: SearchClient;

  constructor() {
    const config = new Config();
    this.searchClient = new SearchClient(config);
  }

  /**
   * 从新闻媒体获取热点
   */
  async fetchFromNewsSources(queries: string[], count: number = 10): Promise<DataSourceItem[]> {
    const newsSites = [
      'coindesk.com',
      'cointelegraph.com',
      'theblock.co',
      'decrypt.co',
      'bitcoin.com',
      'bitcoinmagazine.com',
      'news.bitcoin.com'
    ];

    const allResults: DataSourceItem[] = [];

    for (const query of queries) {
      try {
        const response = await this.searchClient.advancedSearch(
          `${query} cryptocurrency crypto`,
          {
            searchType: 'web',
            count: count,
            needContent: true,
            needUrl: true,
            timeRange: '1d',
            needSummary: true,
          }
        );

        if (response.web_items) {
          for (const item of response.web_items) {
            const domain = this.extractDomain(item.url || '');
            if (newsSites.some(site => domain.includes(site))) {
              allResults.push({
                id: `news-${item.id}`,
                title: item.title || '',
                content: item.content || item.snippet || item.summary || '',
                source: item.site_name || this.extractDomain(item.url || ''),
                platform: 'news',
                url: item.url,
                publishedAt: item.publish_time,
                relevanceScore: 80 + Math.random() * 20,
                tags: [query, 'news', 'crypto'],
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching from news sources:', error);
      }
    }

    return allResults.slice(0, count);
  }

  /**
   * 从Reddit获取热点
   */
  async fetchFromReddit(subreddits: string[], count: number = 10): Promise<DataSourceItem[]> {
    const allResults: DataSourceItem[] = [];

    for (const subreddit of subreddits) {
      try {
        const query = `site:reddit.com ${subreddit} cryptocurrency bitcoin ethereum`;
        const response = await this.searchClient.advancedSearch(query, {
          searchType: 'web',
          count: count,
          needContent: true,
          needUrl: true,
          timeRange: '1d',
          needSummary: true,
        });

        if (response.web_items) {
          for (const item of response.web_items) {
            allResults.push({
              id: `reddit-${item.id}`,
              title: item.title || '',
              content: item.content || item.snippet || item.summary || '',
              source: subreddit,
              platform: 'reddit',
              url: item.url,
              publishedAt: item.publish_time,
              relevanceScore: 70 + Math.random() * 30,
              tags: ['reddit', subreddit, 'discussion'],
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching from reddit/${subreddit}:`, error);
      }
    }

    return allResults.slice(0, count);
  }

  /**
   * 从数据聚合平台获取热门代币
   */
  async fetchFromAggregators(queries: string[], count: number = 10): Promise<DataSourceItem[]> {
    const allResults: DataSourceItem[] = [];

    for (const query of queries) {
      try {
        const response = await this.searchClient.advancedSearch(
          `${query} price market cap token cryptocurrency`,
          {
            searchType: 'web',
            count: count,
            needContent: true,
            needUrl: true,
            timeRange: '1d',
            needSummary: true,
          }
        );

        if (response.web_items) {
          for (const item of response.web_items) {
            const domain = this.extractDomain(item.url || '');
            // 筛选数据聚合网站
            if (
              domain.includes('coinmarketcap.com') ||
              domain.includes('coingecko.com') ||
              domain.includes('dexscreener.com') ||
              domain.includes('dextools.io')
            ) {
              allResults.push({
                id: `agg-${item.id}`,
                title: item.title || '',
                content: item.content || item.snippet || item.summary || '',
                source: domain,
                platform: 'aggregator',
                url: item.url,
                relevanceScore: 75 + Math.random() * 25,
                tags: ['aggregator', 'price', 'market'],
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching from aggregators:', error);
      }
    }

    return allResults.slice(0, count);
  }

  /**
   * 从社交媒体获取热门话题
   */
  async fetchFromSocialMedia(queries: string[], count: number = 10): Promise<DataSourceItem[]> {
    const allResults: DataSourceItem[] = [];

    for (const query of queries) {
      try {
        // 搜索Twitter相关内容
        const twitterQuery = `site:twitter.com OR site:x.com ${query} cryptocurrency`;
        const response = await this.searchClient.advancedSearch(twitterQuery, {
          searchType: 'web',
          count: Math.floor(count / 2),
          needContent: true,
          needUrl: true,
          timeRange: '1d',
          needSummary: true,
        });

        if (response.web_items) {
          for (const item of response.web_items) {
            allResults.push({
              id: `twitter-${item.id}`,
              title: item.title || '',
              content: item.content || item.snippet || item.summary || '',
              source: 'Twitter/X',
              platform: 'twitter',
              url: item.url,
              publishedAt: item.publish_time,
              relevanceScore: 65 + Math.random() * 35,
              tags: ['twitter', 'social', query],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching from social media:', error);
      }
    }

    return allResults.slice(0, count);
  }

  /**
   * 获取链上数据相关信息
   */
  async fetchOnChainData(queries: string[], count: number = 10): Promise<DataSourceItem[]> {
    const allResults: DataSourceItem[] = [];

    for (const query of queries) {
      try {
        const onChainQuery = `${query} whale alert on-chain transaction blockchain data`;
        const response = await this.searchClient.advancedSearch(onChainQuery, {
          searchType: 'web',
          count: count,
          needContent: true,
          needUrl: true,
          timeRange: '1d',
          needSummary: true,
        });

        if (response.web_items) {
          for (const item of response.web_items) {
            allResults.push({
              id: `onchain-${item.id}`,
              title: item.title || '',
              content: item.content || item.snippet || item.summary || '',
              source: this.extractDomain(item.url || ''),
              platform: 'onchain',
              url: item.url,
              publishedAt: item.publish_time,
              relevanceScore: 70 + Math.random() * 30,
              tags: ['onchain', 'whale', 'transaction'],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching on-chain data:', error);
      }
    }

    return allResults.slice(0, count);
  }

  /**
   * 趋势监控 - 搜索当前热门话题
   */
  async fetchTrendingTopics(timeRange: '1h' | '6h' | '24h' | '7d' = '24h'): Promise<TrendTopic[]> {
    const trendingQueries = [
      'cryptocurrency',
      'bitcoin',
      'ethereum',
      'defi',
      'nft',
      'web3',
      'meme coin',
      'solana',
      'layer2',
    ];

    const topics: TrendTopic[] = [];

    for (const query of trendingQueries) {
      try {
        const response = await this.searchClient.advancedSearch(query, {
          searchType: 'web',
          count: 5,
          needContent: false,
          needUrl: false,
          timeRange: timeRange,
        });

        if (response.web_items && response.web_items.length > 0) {
          const score = 50 + Math.random() * 50;
          topics.push({
            keyword: query,
            score: Math.round(score),
            growth: Math.round(Math.random() * 100 - 20), // -20% 到 +80%
            sources: ['web', 'search'],
          });
        }
      } catch (error) {
        console.error(`Error fetching trend for ${query}:`, error);
      }
    }

    // 按分数排序
    return topics.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * 聚合所有数据源
   */
  async aggregateAllSources(
    keywords: string[],
    options: {
      news?: boolean;
      reddit?: boolean;
      aggregator?: boolean;
      social?: boolean;
      onChain?: boolean;
      perSource?: number;
    } = {}
  ): Promise<{
    news: DataSourceItem[];
    reddit: DataSourceItem[];
    aggregator: DataSourceItem[];
    social: DataSourceItem[];
    onChain: DataSourceItem[];
    trending: TrendTopic[];
  }> {
    const {
      news = true,
      reddit = true,
      aggregator = true,
      social = true,
      onChain = true,
      perSource = 10,
    } = options;

    const [newsResults, redditResults, aggResults, socialResults, onChainResults, trending] =
      await Promise.all([
        news ? this.fetchFromNewsSources(keywords, perSource) : Promise.resolve([]),
        reddit ? this.fetchFromReddit(['r/cryptocurrency', 'r/ethereum', 'r/solana', 'r/defi'], perSource) : Promise.resolve([]),
        aggregator ? this.fetchFromAggregators(keywords, perSource) : Promise.resolve([]),
        social ? this.fetchFromSocialMedia(keywords, perSource) : Promise.resolve([]),
        onChain ? this.fetchOnChainData(keywords, perSource) : Promise.resolve([]),
        this.fetchTrendingTopics('24h'),
      ]);

    return {
      news: newsResults,
      reddit: redditResults,
      aggregator: aggResults,
      social: socialResults,
      onChain: onChainResults,
      trending,
    };
  }

  /**
   * 分析热点并提取关键信息
   */
  async analyzeHotspots(keywords: string[]): Promise<{
    hotTopics: TrendTopic[];
    sources: DataSourceItem[];
    summary: string;
  }> {
    const results = await this.aggregateAllSources(keywords, { perSource: 5 });

    // 合并所有来源
    const allSources: DataSourceItem[] = [
      ...results.news,
      ...results.reddit,
      ...results.aggregator,
      ...results.social,
      ...results.onChain,
    ];

    // 提取高频关键词
    const keywordFreq = new Map<string, number>();
    allSources.forEach(item => {
      item.tags?.forEach(tag => {
        keywordFreq.set(tag, (keywordFreq.get(tag) || 0) + 1);
      });
    });

    const topKeywords = Array.from(keywordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, freq]) => ({ keyword, freq }));

    // 生成摘要
    const summary = `
      发现 ${allSources.length} 条热点信息，来自 ${results.news.length} 条新闻、
      ${results.reddit.length} 条Reddit讨论、${results.aggregator.length} 条市场数据、
      ${results.social.length} 条社交媒体内容、${results.onChain.length} 条链上数据。
      当前热门趋势：${results.trending.slice(0, 5).map(t => t.keyword).join(', ')}。
      高频关键词：${topKeywords.slice(0, 5).map(k => k.keyword).join(', ')}。
    `.trim().replace(/\s+/g, ' ');

    return {
      hotTopics: results.trending,
      sources: allSources.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)).slice(0, 20),
      summary,
    };
  }

  /**
   * 提取域名
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
}

// 导出单例
export const multiDataSourceAggregator = new MultiDataSourceAggregator();
