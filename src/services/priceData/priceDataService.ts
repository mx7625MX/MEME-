/**
 * 真实价格数据服务
 * 集成多个价格数据源，确保最快速度和最高可靠性
 */

import { PRICE_DATA_CONFIG } from '@/config/rpcConfig';

export interface TokenPrice {
  price: number;
  change24h: number;
  volume24h?: number;
  marketCap?: number;
  liquidity?: number;
  timestamp: number;
}

export interface PriceUpdate {
  [tokenAddress: string]: {
    price: number;
    change: number;
  };
}

/**
 * 价格数据服务
 */
export class PriceDataService {
  private priceCache: Map<string, { data: TokenPrice; expiry: number }> = new Map();
  private CACHE_TTL = 2000; // 2秒缓存

  /**
   * 从 Jupiter 获取价格（Solana 最快）
   */
  async getPriceFromJupiter(tokenAddress: string): Promise<TokenPrice | null> {
    try {
      const response = await fetch(
        `${PRICE_DATA_CONFIG.jupiter.apiUrl}?ids=${tokenAddress}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(3000), // 3秒超时
        }
      );

      if (!response.ok) {
        console.error(`Jupiter API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const priceData = data.data?.[tokenAddress];

      if (!priceData) {
        return null;
      }

      return {
        price: parseFloat(priceData.price),
        change24h: 0, // Jupiter API 不提供 24h 变化
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get price from Jupiter:', error);
      return null;
    }
  }

  /**
   * 从 DexScreener 获取价格（多链支持）
   */
  async getPriceFromDexScreener(tokenAddress: string): Promise<TokenPrice | null> {
    try {
      const response = await fetch(
        `${PRICE_DATA_CONFIG.dexscreener.apiUrl}/tokens/${tokenAddress}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // 5秒超时
        }
      );

      if (!response.ok) {
        console.error(`DexScreener API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const pair = data.pairs?.[0];

      if (!pair) {
        return null;
      }

      return {
        price: parseFloat(pair.priceUsd),
        change24h: parseFloat(pair.priceChange?.h24 || '0'),
        volume24h: parseFloat(pair.volume?.h24 || '0'),
        liquidity: parseFloat(pair.liquidity?.usd || '0'),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get price from DexScreener:', error);
      return null;
    }
  }

  /**
   * 从 CoinGecko 获取价格
   */
  async getPriceFromCoinGecko(tokenSymbol: string): Promise<TokenPrice | null> {
    try {
      const url = `${PRICE_DATA_CONFIG.coingecko.apiUrl}/simple/price?ids=${tokenSymbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(PRICE_DATA_CONFIG.coingecko.apiKey && {
            'x-cg-demo-api-key': PRICE_DATA_CONFIG.coingecko.apiKey,
          }),
        },
        signal: AbortSignal.timeout(5000), // 5秒超时
      });

      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const priceData = data[tokenSymbol.toLowerCase()];

      if (!priceData) {
        return null;
      }

      return {
        price: parseFloat(priceData.usd),
        change24h: parseFloat(priceData.usd_24h_change || '0'),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get price from CoinGecko:', error);
      return null;
    }
  }

  /**
   * 获取代币价格（自动选择最快的数据源）
   */
  async getTokenPrice(
    tokenAddressOrSymbol: string,
    chain: string = 'solana'
  ): Promise<TokenPrice | null> {
    // 检查缓存
    const cached = this.priceCache.get(tokenAddressOrSymbol);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    let priceData: TokenPrice | null = null;

    // 根据链和代币类型选择数据源
    if (chain === 'solana') {
      // Solana 优先使用 Jupiter（最快）
      priceData = await this.getPriceFromJupiter(tokenAddressOrSymbol);

      if (!priceData) {
        // 备用：DexScreener
        priceData = await this.getPriceFromDexScreener(tokenAddressOrSymbol);
      }
    } else {
      // 其他链优先使用 DexScreener
      priceData = await this.getPriceFromDexScreener(tokenAddressOrSymbol);

      if (!priceData) {
        // 备用：CoinGecko（仅适用于主流代币）
        priceData = await this.getPriceFromCoinGecko(tokenAddressOrSymbol);
      }
    }

    // 缓存结果
    if (priceData) {
      this.priceCache.set(tokenAddressOrSymbol, {
        data: priceData,
        expiry: Date.now() + this.CACHE_TTL,
      });
    }

    return priceData;
  }

  /**
   * 批量获取价格
   */
  async getBatchPrices(
    tokenAddresses: string[],
    chain: string = 'solana'
  ): Promise<PriceUpdate> {
    const results: PriceUpdate = {};

    // 并行获取所有价格
    const promises = tokenAddresses.map(async (address) => {
      const priceData = await this.getTokenPrice(address, chain);
      if (priceData) {
        results[address] = {
          price: priceData.price,
          change: priceData.change24h,
        };
      }
    });

    await Promise.all(promises);

    return results;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.priceCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.priceCache.size,
      hitRate: 0, // 可以添加命中率统计
    };
  }
}

// 导出单例
export const priceDataService = new PriceDataService();
