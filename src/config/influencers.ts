/**
 * 智能发现 - 大V配置
 * 预置常用加密货币和科技领域大V列表
 */

export interface Influencer {
  id: string;
  name: string;
  handle: string; // @username
  platform: 'twitter' | 'telegram' | 'weibo' | 'other';
  category: 'crypto' | 'tech' | 'defi' | 'meme' | 'founder';
  description: string;
  followers?: string;
  verified?: boolean;
  profileImage?: string;
  keywords?: string[]; // 常用关键词，用于AI分析
}

export const INFLUENCERS: Influencer[] = [
  // 币安生态
  {
    id: 'binance-cz',
    name: 'CZ',
    handle: '@cz_binance',
    platform: 'twitter',
    category: 'founder',
    description: '币安创始人，加密货币行业影响力人物',
    followers: '9.5M',
    verified: true,
    keywords: ['BNB', '币安', 'launchpool', '创新', '加密', '区块链']
  },

  // 马斯克相关
  {
    id: 'elon-musk',
    name: 'Elon Musk',
    handle: '@elonmusk',
    platform: 'twitter',
    category: 'tech',
    description: '特斯拉、SpaceX CEO，经常影响加密货币市场',
    followers: '210M',
    verified: true,
    keywords: ['Bitcoin', 'Dogecoin', 'DOGE', '加密', '火星', 'Tesla']
  },

  // Vitalik
  {
    id: 'vitalik',
    name: 'Vitalik Buterin',
    handle: '@VitalikButerin',
    platform: 'twitter',
    category: 'founder',
    description: '以太坊联合创始人，区块链技术先驱',
    followers: '5.7M',
    verified: true,
    keywords: ['ETH', 'Ethereum', 'DeFi', 'Layer2', ' zk-rollup', '智能合约']
  },

  // DeFi 领域
  {
    id: 'andreas-antonopoulos',
    name: 'Andreas Antonopoulos',
    handle: '@aantonop',
    platform: 'twitter',
    category: 'crypto',
    description: '比特币教育者和技术专家',
    followers: '760K',
    verified: true,
    keywords: ['Bitcoin', '去中心化', '加密教育', '私钥', '冷钱包']
  },

  {
    id: 'hayden-adams',
    name: 'Hayden Adams',
    handle: '@haydenzadams',
    platform: 'twitter',
    category: 'defi',
    description: 'Uniswap 创始人',
    followers: '420K',
    verified: true,
    keywords: ['Uniswap', 'DEX', 'AMM', 'DeFi', '流动性']
  },

  {
    id: 'stani-kulechov',
    name: 'Stani Kulechov',
    handle: '@StaniKulechov',
    platform: 'twitter',
    category: 'defi',
    description: 'Aave 创始人',
    followers: '190K',
    verified: true,
    keywords: ['Aave', '借贷', 'DeFi', '流动性挖矿', '利率']
  },

  // Meme 代币相关
  {
    id: 'billy-markus',
    name: 'Billy Markus',
    handle: '@BillyM2k',
    platform: 'twitter',
    category: 'meme',
    description: 'Dogecoin 联合创始人',
    followers: '2.1M',
    verified: true,
    keywords: ['DOGE', 'Dogecoin', 'Meme', '社区', '有趣']
  },

  {
    id: 'kabosu-doge',
    name: 'Kabosu',
    handle: '@kabosu_mama',
    platform: 'twitter',
    category: 'meme',
    description: 'Doge 狗狗原型主人',
    followers: '150K',
    verified: false,
    keywords: ['Doge', 'Kabosu', 'Meme', '社区']
  },

  // Solana 生态
  {
    id: 'anatoly-yakovenko',
    name: 'Anatoly Yakovenko',
    handle: '@aeyakovenko',
    platform: 'twitter',
    category: 'founder',
    description: 'Solana 联合创始人',
    followers: '500K',
    verified: true,
    keywords: ['Solana', 'SOL', '高性能', 'Proof of History', '速度']
  },

  {
    id: 'raj-gokal',
    name: 'Raj Gokal',
    handle: '@rajgokal',
    platform: 'twitter',
    category: 'founder',
    description: 'Solana 联合创始人',
    followers: '170K',
    verified: true,
    keywords: ['Solana', '生态', '开发', '创新']
  },

  // BSC 生态
  {
    id: 'justin-sun',
    name: 'Justin Sun',
    handle: '@justinsuntron',
    platform: 'twitter',
    category: 'founder',
    description: '波场创始人',
    followers: '3.5M',
    verified: true,
    keywords: ['TRX', '波场', 'BTT', 'USDD', '稳定币']
  },

  // 知名分析师
  {
    id: 'planb',
    name: 'PlanB',
    handle: '@100trillionUSD',
    platform: 'twitter',
    category: 'crypto',
    description: '知名比特币分析师，Stock-to-Flow模型提出者',
    followers: '2.2M',
    verified: true,
    keywords: ['Bitcoin', 'S2F', '市值', '价格预测', '减半']
  },

  {
    id: 'willem-witteveen',
    name: 'Willem Witteveen',
    handle: '@WillyWoo',
    platform: 'twitter',
    category: 'crypto',
    description: '知名链上分析师',
    followers: '1.1M',
    verified: true,
    keywords: ['链上数据', 'Whale', '机构', '趋势分析']
  },

  // 投资机构
  {
    id: 'binance-research',
    name: 'Binance Research',
    handle: '@binance_research',
    platform: 'twitter',
    category: 'crypto',
    description: '币安研究院，发布市场分析报告',
    followers: '420K',
    verified: true,
    keywords: ['研究报告', '市场分析', '新项目', '白皮书']
  },

  {
    id: 'a16z-crypto',
    name: 'a16z Crypto',
    handle: '@a16zcrypto',
    platform: 'twitter',
    category: 'crypto',
    description: 'Andreessen Horowitz 加密投资基金',
    followers: '1.5M',
    verified: true,
    keywords: ['投资', 'Web3', '区块链', '初创企业', '融资']
  },

  // Meme 社区
  {
    id: 'pepe-token',
    name: 'Pepe Token',
    handle: '@pepecoineth',
    platform: 'twitter',
    category: 'meme',
    description: 'PEPE 代币官方',
    followers: '700K',
    verified: true,
    keywords: ['PEPE', 'Meme', '青蛙', '社区驱动']
  },

  {
    id: 'shibainu',
    name: 'Shiba Inu',
    handle: '@Shibtoken',
    platform: 'twitter',
    category: 'meme',
    description: 'SHIB 代币官方',
    followers: '3.9M',
    verified: true,
    keywords: ['SHIB', 'Shiba', '柴犬', 'Meme', '社区']
  },

  // Telegram 频道
  {
    id: 'whale-alert',
    name: 'Whale Alert',
    handle: 'WhaleAlert.io',
    platform: 'telegram',
    category: 'crypto',
    description: '大额转账实时提醒',
    followers: '2.5M',
    verified: true,
    keywords: ['大额转账', 'Whale', '比特币', '以太坊', '链上']
  },

  {
    id: 'coin-an',
    name: 'CoinGape',
    handle: 'CoinGapeNews',
    platform: 'telegram',
    category: 'crypto',
    description: '加密货币新闻快讯',
    followers: '500K',
    verified: true,
    keywords: ['新闻', '快讯', '市场', '价格', '项目更新']
  },

  // 新增更多影响力人物
  {
    id: 'brian-armstrong',
    name: 'Brian Armstrong',
    handle: '@brian_armstrong',
    platform: 'twitter',
    category: 'founder',
    description: 'Coinbase CEO',
    followers: '2.8M',
    verified: true,
    keywords: ['Coinbase', '合规', '上市', '交易所', '加密']
  },

  {
    id: 'sam-bankman-fried',
    name: 'Sam Bankman-Fried',
    handle: '@SBF_FTX',
    platform: 'twitter',
    category: 'founder',
    description: 'FTX 前创始人（参考案例）',
    followers: '3.2M',
    verified: true,
    keywords: ['FTX', 'Alameda', 'Quant', '交易', '风险']
  },

  {
    id: 'do-kwon',
    name: 'Do Kwon',
    handle: '@stablekwon',
    platform: 'twitter',
    category: 'founder',
    description: 'Terraform Labs 前CEO',
    followers: '1.5M',
    verified: true,
    keywords: ['Terra', 'LUNA', 'UST', '算法稳定币', 'DeFi']
  },

  // 知名 YouTuber
  {
    id: 'bitboy',
    name: 'BitBoy Crypto',
    handle: '@Bitboy_Crypto',
    platform: 'twitter',
    category: 'crypto',
    description: '知名加密货币 YouTuber',
    followers: '2.1M',
    verified: true,
    keywords: ['新闻', '分析', '代币推荐', '投资建议']
  },

  // 中文社区
  {
    id: 'sun-yuchen-cn',
    name: '孙宇晨',
    handle: '@孙宇晨',
    platform: 'weibo',
    category: 'founder',
    description: '波场创始人，中文社区活跃',
    followers: '5M',
    verified: true,
    keywords: ['波场', 'TRX', '孙宇晨', '加密', '投资']
  },

  {
    id: 'chainnews',
    name: '链闻',
    handle: '@ChainNews',
    platform: 'twitter',
    category: 'crypto',
    description: '中文加密货币媒体',
    followers: '500K',
    verified: true,
    keywords: ['新闻', '分析', '深度报道', '中文', '项目']
  },
];

// 按类别分组
export const INFLUENCERS_BY_CATEGORY: Record<string, Influencer[]> = {
  all: INFLUENCERS,
  crypto: INFLUENCERS.filter(i => i.category === 'crypto'),
  tech: INFLUENCERS.filter(i => i.category === 'tech'),
  defi: INFLUENCERS.filter(i => i.category === 'defi'),
  meme: INFLUENCERS.filter(i => i.category === 'meme'),
  founder: INFLUENCERS.filter(i => i.category === 'founder'),
};

// 获取推荐关注列表
export function getRecommendedInfluencers(limit: number = 10): Influencer[] {
  return INFLUENCERS.slice(0, limit);
}

// 根据类别获取大V列表
export function getInfluencersByCategory(category: string, limit?: number): Influencer[] {
  const list = INFLUENCERS_BY_CATEGORY[category] || INFLUENCERS;
  return limit ? list.slice(0, limit) : list;
}

// 根据关键词搜索大V
export function searchInfluencers(keyword: string): Influencer[] {
  const lowerKeyword = keyword.toLowerCase();
  return INFLUENCERS.filter(influencer =>
    influencer.name.toLowerCase().includes(lowerKeyword) ||
    influencer.handle.toLowerCase().includes(lowerKeyword) ||
    influencer.description.toLowerCase().includes(lowerKeyword) ||
    influencer.keywords?.some(k => k.toLowerCase().includes(lowerKeyword))
  );
}
