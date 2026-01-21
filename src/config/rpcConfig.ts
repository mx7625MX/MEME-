/**
 * 区块链 RPC 配置
 * 优先使用高性能的付费节点，确保最快速度
 */

export interface RPCConfig {
  solana: {
    mainnet: string;
    websocket: string;
    jito: string;
  };
  ethereum: {
    mainnet: string;
    websocket: string;
  };
  bsc: {
    mainnet: string;
    websocket: string;
  };
  apiKeys?: {
    infura?: string;
    alchemy?: string;
    moralis?: string;
    quicknode?: string;
    helius?: string;
    jito?: string;
  };
}

/**
 * 默认 RPC 配置
 * 使用公共节点作为备选，但生产环境建议使用付费节点
 */
export const DEFAULT_RPC_CONFIG: RPCConfig = {
  // Solana - 使用 Helius（快速可靠）
  solana: {
    mainnet: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=' + (process.env.HELIUS_API_KEY || ''),
    websocket: process.env.SOLANA_WS_URL || 'wss://mainnet.helius-rpc.com/?api-key=' + (process.env.HELIUS_API_KEY || ''),
    jito: process.env.JITO_RPC_URL || 'https://mainnet.block-engine.jito.wtf/api/v1/transactions',
  },

  // Ethereum - 使用 Alchemy（快速可靠）
  ethereum: {
    mainnet: process.env.ETHEREUM_RPC_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || ''}`,
    websocket: process.env.ETHEREUM_WS_URL || `wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || ''}`,
  },

  // BSC - 使用 BSC 官方节点
  bsc: {
    mainnet: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    websocket: process.env.BSC_WS_URL || 'wss://bsc-dataseed.binance.org/ws',
  },
};

/**
 * DEX 平台配置
 */
export const DEX_CONFIG = {
  // pump.fun 配置
  pumpfun: {
    programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    bondingCurveAccount: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    apiUrl: 'https://api.pump.fun',
  },

  // four.meme 配置
  fourMeme: {
    programId: '4s3k2XQ1G7K7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y',
    apiUrl: 'https://api.four.meme',
  },

  // Raydium 配置
  raydium: {
    programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    liquidityProgramId: '27haf9L1qN3uVsHPAKvjWpixZpdRXL5YkfGCe2o7g5t',
    apiUrl: 'https://api.raydium.io/v2',
  },

  // Uniswap 配置
  uniswap: {
    routerV2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    routerV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    apiUrl: 'https://api.uniswap.org/v1',
  },

  // PancakeSwap 配置
  pancakeswap: {
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    apiUrl: 'https://api.pancakeswap.info/api/v2',
  },
};

/**
 * 价格数据源配置
 */
export const PRICE_DATA_CONFIG = {
  // Jupiter - Solana 最佳价格聚合器（速度最快）
  jupiter: {
    apiUrl: 'https://price.jup.ag/v6/price',
  },

  // CoinGecko - 免费价格数据
  coingecko: {
    apiUrl: 'https://api.coingecko.com/api/v3',
    apiKey: process.env.COINGECKO_API_KEY || '',
  },

  // Birdeye - 实时加密货币数据
  birdeye: {
    apiUrl: 'https://public-api.birdeye.so',
    apiKey: process.env.BIRDEYE_API_KEY || '',
  },

  // DexScreener - 多链代币价格
  dexscreener: {
    apiUrl: 'https://api.dexscreener.com/latest/dex',
  },
};

/**
 * 获取 RPC 配置
 */
export function getRPCConfig(): RPCConfig {
  return DEFAULT_RPC_CONFIG;
}

/**
 * 验证 RPC 配置
 */
export function validateRPCConfig(config: RPCConfig): boolean {
  if (!config.solana.mainnet) {
    console.warn('Solana RPC URL 未配置');
  }
  if (!config.ethereum.mainnet) {
    console.warn('Ethereum RPC URL 未配置');
  }
  if (!config.bsc.mainnet) {
    console.warn('BSC RPC URL 未配置');
  }
  return true;
}
