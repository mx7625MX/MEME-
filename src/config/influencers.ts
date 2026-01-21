/**
 * 智能发现 - 大V配置
 * 预置常用加密货币和科技领域大V列表
 */

export interface Influencer {
  id: string;
  name: string;
  handle: string; // @username or channel name
  platform: 'twitter' | 'telegram' | 'weibo' | 'reddit' | 'youtube' | 'medium' | 'discord' | 'zhihu' | 'bihu' | 'news' | 'aggregator';
  category: 'crypto' | 'tech' | 'defi' | 'meme' | 'founder' | 'nft' | 'gamefi' | 'layer2' | 'ai' | 'institution';
  description: string;
  followers?: string;
  verified?: boolean;
  profileImage?: string;
  keywords?: string[]; // 常用关键词，用于AI分析
  url?: string; // 官方链接
  priority?: number; // 优先级，1-10，数字越大优先级越高
  region?: string; // 地区：global, cn, asia, europe, america
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

  // Reddit 热门社区
  {
    id: 'r-cryptocurrency',
    name: 'r/cryptocurrency',
    handle: 'r/cryptocurrency',
    platform: 'reddit',
    category: 'crypto',
    description: 'Reddit最大的加密货币社区',
    followers: '7M',
    verified: true,
    keywords: ['加密货币', '讨论', '新闻', 'BTC', 'ETH'],
    priority: 9,
    region: 'global',
    url: 'https://reddit.com/r/cryptocurrency'
  },

  {
    id: 'r-solana',
    name: 'r/Solana',
    handle: 'r/solana',
    platform: 'reddit',
    category: 'crypto',
    description: 'Solana生态讨论社区',
    followers: '500K',
    verified: true,
    keywords: ['Solana', 'SOL', 'DeFi', 'NFT', '开发'],
    priority: 8,
    region: 'global'
  },

  {
    id: 'r-ethereum',
    name: 'r/ethereum',
    handle: 'r/ethereum',
    platform: 'reddit',
    category: 'crypto',
    description: '以太坊官方社区',
    followers: '3M',
    verified: true,
    keywords: ['Ethereum', 'ETH', 'DeFi', '智能合约', 'Layer2'],
    priority: 9,
    region: 'global'
  },

  {
    id: 'r-defi',
    name: 'r/defi',
    handle: 'r/defi',
    platform: 'reddit',
    category: 'defi',
    description: 'DeFi去中心化金融讨论社区',
    followers: '300K',
    verified: true,
    keywords: ['DeFi', '流动性', '借贷', 'AMM', '收益'],
    priority: 8,
    region: 'global'
  },

  // YouTube 知名频道
  {
    id: 'ivan-on-tech',
    name: 'Ivan on Tech',
    handle: '@IvanOnTech',
    platform: 'youtube',
    category: 'tech',
    description: '知名加密货币教育YouTuber',
    followers: '500K',
    verified: true,
    keywords: ['教育', '智能合约', '开发', 'DeFi', '技术'],
    priority: 8,
    region: 'global',
    url: 'https://youtube.com/@IvanOnTech'
  },

  {
    id: 'bitboy-crypto',
    name: 'BitBoy Crypto',
    handle: '@Bitboy_Crypto',
    platform: 'youtube',
    category: 'crypto',
    description: '最受欢迎的加密货币分析频道',
    followers: '2M',
    verified: true,
    keywords: ['分析', '代币', '投资', '新闻', '市场'],
    priority: 9,
    region: 'global'
  },

  {
    id: 'lark-davis',
    name: 'The Lark Davis',
    handle: '@TheLarkDavis',
    platform: 'youtube',
    category: 'crypto',
    description: '知名加密货币分析师',
    followers: '1M',
    verified: true,
    keywords: ['比特币', '分析', '市场', '投资', '趋势'],
    priority: 8,
    region: 'global'
  },

  {
    id: 'altcoin-daily',
    name: 'Altcoin Daily',
    handle: '@AltcoinDailyio',
    platform: 'youtube',
    category: 'crypto',
    description: '每日加密货币新闻和价格分析',
    followers: '1.5M',
    verified: true,
    keywords: ['新闻', 'Altcoin', 'BTC', 'ETH', '分析'],
    priority: 9,
    region: 'global'
  },

  // Medium 知名作者
  {
    id: 'a16z-blog',
    name: 'a16z Crypto Blog',
    handle: '@a16z',
    platform: 'medium',
    category: 'institution',
    description: 'Andreessen Horowitz加密投资博客',
    followers: '1M',
    verified: true,
    keywords: ['投资', 'Web3', '研究', '市场', '趋势'],
    priority: 9,
    region: 'global',
    url: 'https://a16z.com/crypto'
  },

  {
    id: 'paradigm-research',
    name: 'Paradigm Research',
    handle: '@paradigm',
    platform: 'medium',
    category: 'institution',
    description: 'Paradigm加密投资基金研究',
    followers: '500K',
    verified: true,
    keywords: ['研究', 'DeFi', '技术', '投资', '论文'],
    priority: 8,
    region: 'global'
  },

  {
    id: 'mirror-xyz',
    name: 'Mirror.xyz',
    handle: '@mirror',
    platform: 'medium',
    category: 'crypto',
    description: 'Web3发布平台，汇集大量加密文章',
    followers: '800K',
    verified: true,
    keywords: ['Web3', '文章', 'DAO', 'NFT', '创作'],
    priority: 8,
    region: 'global'
  },

  // Discord 热门社区
  {
    id: 'discord-defi',
    name: 'DeFi Llama Discord',
    handle: 'DeFi Llama',
    platform: 'discord',
    category: 'defi',
    description: 'DeFi Llama官方社区',
    followers: '200K',
    verified: true,
    keywords: ['DeFi', '数据', '协议', 'TVL', '分析'],
    priority: 8,
    region: 'global'
  },

  {
    id: 'discord-solana',
    name: 'Solana Discord',
    handle: 'Solana',
    platform: 'discord',
    category: 'crypto',
    description: 'Solana官方Discord社区',
    followers: '500K',
    verified: true,
    keywords: ['Solana', '开发', '生态', '项目', '技术'],
    priority: 9,
    region: 'global'
  },

  // 知乎（中文社区）
  {
    id: 'zhihu-crypto',
    name: '比特币吧',
    handle: '@bitcoinbar',
    platform: 'zhihu',
    category: 'crypto',
    description: '知乎比特币讨论吧',
    followers: '200K',
    verified: true,
    keywords: ['比特币', 'BTC', '投资', '技术', '讨论'],
    priority: 7,
    region: 'cn'
  },

  {
    id: 'zhihu-blockchain',
    name: '区块链技术',
    handle: '@blockchain',
    platform: 'zhihu',
    category: 'tech',
    description: '知乎区块链技术话题',
    followers: '300K',
    verified: true,
    keywords: ['区块链', '技术', '开发', '智能合约', '共识'],
    priority: 7,
    region: 'cn'
  },

  {
    id: 'zhihu-defi',
    name: 'DeFi去中心化金融',
    handle: '@defi',
    platform: 'zhihu',
    category: 'defi',
    description: '知乎DeFi话题讨论',
    followers: '150K',
    verified: true,
    keywords: ['DeFi', '去中心化', '金融', '收益', '流动性'],
    priority: 7,
    region: 'cn'
  },

  // 币乎（中文区块链社区）
  {
    id: 'bihu-news',
    name: '币乎快讯',
    handle: '@bihu-news',
    platform: 'bihu',
    category: 'crypto',
    description: '币乎新闻快讯',
    followers: '500K',
    verified: true,
    keywords: ['新闻', '快讯', '市场', '项目', '代币'],
    priority: 7,
    region: 'cn'
  },

  {
    id: 'bihu-analysis',
    name: '币乎深度分析',
    handle: '@bihu-analysis',
    platform: 'bihu',
    category: 'crypto',
    description: '币乎深度分析文章',
    followers: '300K',
    verified: true,
    keywords: ['分析', '深度', '项目', '白皮书', '技术'],
    priority: 7,
    region: 'cn'
  },

  // 新闻媒体网站
  {
    id: 'coindesk',
    name: 'CoinDesk',
    handle: '@CoinDesk',
    platform: 'news',
    category: 'crypto',
    description: '全球知名加密货币新闻媒体',
    followers: '2M',
    verified: true,
    keywords: ['新闻', '市场', '价格', '项目', '分析'],
    priority: 10,
    region: 'global',
    url: 'https://coindesk.com'
  },

  {
    id: 'cointelegraph',
    name: 'Cointelegraph',
    handle: '@Cointelegraph',
    platform: 'news',
    category: 'crypto',
    description: '领先的加密货币新闻和分析平台',
    followers: '3M',
    verified: true,
    keywords: ['新闻', '分析', '市场', '技术', '趋势'],
    priority: 10,
    region: 'global',
    url: 'https://cointelegraph.com'
  },

  {
    id: 'theblock',
    name: 'The Block',
    handle: '@TheBlock__',
    platform: 'news',
    category: 'crypto',
    description: '专注于深度研究的加密媒体',
    followers: '1M',
    verified: true,
    keywords: ['研究', '深度', '数据', '机构', '投资'],
    priority: 9,
    region: 'global',
    url: 'https://theblock.co'
  },

  {
    id: 'decrypt',
    name: 'Decrypt',
    handle: '@DecryptMedia',
    platform: 'news',
    category: 'crypto',
    description: '专注于DeFi和Web3的新闻媒体',
    followers: '800K',
    verified: true,
    keywords: ['DeFi', 'Web3', 'NFT', '新闻', '教育'],
    priority: 9,
    region: 'global',
    url: 'https://decrypt.co'
  },

  {
    id: 'coinmarketcap',
    name: 'CoinMarketCap',
    handle: '@CoinMarketCap',
    platform: 'aggregator',
    category: 'crypto',
    description: '全球最大的加密货币数据聚合平台',
    followers: '10M',
    verified: true,
    keywords: ['价格', '市值', '排名', '数据', '图表'],
    priority: 10,
    region: 'global',
    url: 'https://coinmarketcap.com'
  },

  {
    id: 'coingecko',
    name: 'CoinGecko',
    handle: '@coingecko',
    platform: 'aggregator',
    category: 'crypto',
    description: '知名的加密货币数据聚合平台',
    followers: '5M',
    verified: true,
    keywords: ['价格', '数据', '市场', '排名', '趋势'],
    priority: 9,
    region: 'global',
    url: 'https://coingecko.com'
  },

  {
    id: 'dexscreener',
    name: 'DexScreener',
    handle: '@DexScreener',
    platform: 'aggregator',
    category: 'defi',
    description: '实时DEX价格追踪平台',
    followers: '1M',
    verified: true,
    keywords: ['DEX', '价格', '流动性', '新币', '趋势'],
    priority: 9,
    region: 'global',
    url: 'https://dexscreener.com'
  },

  {
    id: 'dextools',
    name: 'Dextools',
    handle: '@Dextools_io',
    platform: 'aggregator',
    category: 'defi',
    description: '专业的DEX数据分析工具',
    followers: '800K',
    verified: true,
    keywords: ['DEX', '分析', '图表', '数据', '交易'],
    priority: 9,
    region: 'global',
    url: 'https://www.dextools.io'
  },

  // 更多Twitter大V
  {
    id: 'michael-saylor',
    name: 'Michael Saylor',
    handle: '@saylor',
    platform: 'twitter',
    category: 'founder',
    description: 'MicroStrategy CEO，比特币坚定信仰者',
    followers: '3.5M',
    verified: true,
    keywords: ['Bitcoin', 'BTC', '投资', '公司', '持有'],
    priority: 10,
    region: 'global'
  },

  {
    id: 'barry-silbert',
    name: 'Barry Silbert',
    handle: '@BarrySilbert',
    platform: 'twitter',
    category: 'institution',
    description: 'Digital Currency Group创始人',
    followers: '1.5M',
    verified: true,
    keywords: ['投资', 'DCG', '灰度', 'GBTC', '机构'],
    priority: 8,
    region: 'global'
  },

  {
    id: 'naval-ravikant',
    name: 'Naval Ravikant',
    handle: '@naval',
    platform: 'twitter',
    category: 'tech',
    description: 'AngelList创始人，加密货币思想家',
    followers: '2.5M',
    verified: true,
    keywords: ['哲学', '投资', 'Web3', '技术', '未来'],
    priority: 9,
    region: 'global'
  },

  {
    id: 'balaji-srinivasan',
    name: 'Balaji Srinivasan',
    handle: '@balajis',
    platform: 'twitter',
    category: 'tech',
    description: '前Coinbase CTO，加密货币思想家',
    followers: '1M',
    verified: true,
    keywords: ['网络国家', 'Web3', '技术', '未来', '去中心化'],
    priority: 9,
    region: 'global'
  },

  // NFT 领域
  {
    id: 'punk6529',
    name: 'punk6529',
    handle: '@punk6529',
    platform: 'twitter',
    category: 'nft',
    description: '知名NFT收藏家和教育者',
    followers: '500K',
    verified: true,
    keywords: ['NFT', 'CryptoPunks', '元宇宙', '艺术', '文化'],
    priority: 8,
    region: 'global'
  },

  {
    id: 'gary-vee',
    name: 'Gary Vaynerchuk',
    handle: '@garyvee',
    platform: 'twitter',
    category: 'nft',
    description: 'VaynerNFT创始人，NFT倡导者',
    followers: '15M',
    verified: true,
    keywords: ['NFT', 'VeeFriends', '品牌', '营销', '社区'],
    priority: 10,
    region: 'global'
  },

  // GameFi 领域
  {
    id: 'axie-infinity',
    name: 'Axie Infinity',
    handle: '@AxieInfinity',
    platform: 'twitter',
    category: 'gamefi',
    description: '知名GameFi项目',
    followers: '2.5M',
    verified: true,
    keywords: ['GameFi', 'Play2Earn', 'NFT', '游戏', 'Ronin'],
    priority: 9,
    region: 'global'
  },

  {
    id: 'sandbox',
    name: 'The Sandbox',
    handle: '@TheSandboxGame',
    platform: 'twitter',
    category: 'gamefi',
    description: '元宇宙游戏平台',
    followers: '1M',
    verified: true,
    keywords: ['元宇宙', 'GameFi', 'NFT', '创作', 'LAND'],
    priority: 8,
    region: 'global'
  },

  // Layer2 生态
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    handle: '@Arbitrum',
    platform: 'twitter',
    category: 'layer2',
    description: '以太坊Layer2扩容方案',
    followers: '800K',
    verified: true,
    keywords: ['Arbitrum', 'Layer2', 'Optimistic', '扩容', '以太坊'],
    priority: 9,
    region: 'global'
  },

  {
    id: 'optimism',
    name: 'Optimism',
    handle: '@optimismFND',
    platform: 'twitter',
    category: 'layer2',
    description: '以太坊Layer2扩容方案',
    followers: '700K',
    verified: true,
    keywords: ['Optimism', 'Layer2', 'OP', '扩容', '以太坊'],
    priority: 9,
    region: 'global'
  },

  {
    id: 'polygon',
    name: 'Polygon',
    handle: '@0xPolygon',
    platform: 'twitter',
    category: 'layer2',
    description: '以太坊侧链和Layer2方案',
    followers: '2.5M',
    verified: true,
    keywords: ['Polygon', 'MATIC', 'Layer2', '扩容', '以太坊'],
    priority: 9,
    region: 'global'
  },

  // AI + Crypto 领域
  {
    id: 'worldcoin',
    name: 'Worldcoin',
    handle: '@worldcoin',
    platform: 'twitter',
    category: 'ai',
    description: 'Sam Altman的AI+加密项目',
    followers: '1M',
    verified: true,
    keywords: ['AI', 'Worldcoin', '身份', 'UBI', '加密'],
    priority: 10,
    region: 'global'
  },

  {
    id: 'near-protocol',
    name: 'NEAR Protocol',
    handle: '@NEARProtocol',
    platform: 'twitter',
    category: 'ai',
    description: '支持AI应用的区块链平台',
    followers: '1.5M',
    verified: true,
    keywords: ['NEAR', 'AI', '区块链', '开发', '生态'],
    priority: 8,
    region: 'global'
  },

  // 更多Telegram频道
  {
    id: 'cctip-telegram',
    name: 'CCTip',
    handle: 'CCTip_io',
    platform: 'telegram',
    category: 'crypto',
    description: '加密货币快讯和空投信息',
    followers: '1M',
    verified: true,
    keywords: ['快讯', '空投', '新闻', '市场', '代币'],
    priority: 8,
    region: 'global'
  },

  {
    id: 'whale-insider',
    name: 'Whale Insider',
    handle: 'Whale_Insider',
    platform: 'telegram',
    category: 'crypto',
    description: '巨鲸交易实时监控',
    followers: '500K',
    verified: true,
    keywords: ['巨鲸', '交易', '监控', '大户', '链上'],
    priority: 8,
    region: 'global'
  },

  // 更多中文社区
  {
    id: 'weibo-cctip',
    name: '币圈情报',
    handle: '@币圈情报',
    platform: 'weibo',
    category: 'crypto',
    description: '微博加密货币快讯',
    followers: '2M',
    verified: true,
    keywords: ['快讯', '新闻', '市场', '代币', '行情'],
    priority: 8,
    region: 'cn'
  },

  {
    id: 'weibo-btcking',
    name: '比特币之王',
    handle: '@比特币之王',
    platform: 'weibo',
    category: 'crypto',
    description: '微博比特币分析',
    followers: '500K',
    verified: true,
    keywords: ['比特币', 'BTC', '分析', '行情', '投资'],
    priority: 7,
    region: 'cn'
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
    keywords: ['波场', 'TRX', '孙宇晨', '加密', '投资'],
    priority: 8,
    region: 'cn'
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
    keywords: ['新闻', '分析', '深度报道', '中文', '项目'],
    priority: 8,
    region: 'cn'
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
  nft: INFLUENCERS.filter(i => i.category === 'nft'),
  gamefi: INFLUENCERS.filter(i => i.category === 'gamefi'),
  layer2: INFLUENCERS.filter(i => i.category === 'layer2'),
  ai: INFLUENCERS.filter(i => i.category === 'ai'),
  institution: INFLUENCERS.filter(i => i.category === 'institution'),
};

// 按平台分组
export const INFLUENCERS_BY_PLATFORM: Record<string, Influencer[]> = {
  all: INFLUENCERS,
  twitter: INFLUENCERS.filter(i => i.platform === 'twitter'),
  telegram: INFLUENCERS.filter(i => i.platform === 'telegram'),
  weibo: INFLUENCERS.filter(i => i.platform === 'weibo'),
  reddit: INFLUENCERS.filter(i => i.platform === 'reddit'),
  youtube: INFLUENCERS.filter(i => i.platform === 'youtube'),
  medium: INFLUENCERS.filter(i => i.platform === 'medium'),
  discord: INFLUENCERS.filter(i => i.platform === 'discord'),
  zhihu: INFLUENCERS.filter(i => i.platform === 'zhihu'),
  bihu: INFLUENCERS.filter(i => i.platform === 'bihu'),
  news: INFLUENCERS.filter(i => i.platform === 'news'),
  aggregator: INFLUENCERS.filter(i => i.platform === 'aggregator'),
};

// 按地区分组
export const INFLUENCERS_BY_REGION: Record<string, Influencer[]> = {
  all: INFLUENCERS,
  global: INFLUENCERS.filter(i => i.region === 'global' || !i.region),
  cn: INFLUENCERS.filter(i => i.region === 'cn'),
  asia: INFLUENCERS.filter(i => i.region === 'asia'),
  europe: INFLUENCERS.filter(i => i.region === 'europe'),
  america: INFLUENCERS.filter(i => i.region === 'america'),
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

// 根据优先级获取大V列表
export function getInfluencersByPriority(minPriority: number = 5, limit?: number): Influencer[] {
  const filtered = INFLUENCERS.filter(i => (i.priority || 0) >= minPriority);
  // 按优先级降序排序
  filtered.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return limit ? filtered.slice(0, limit) : filtered;
}

// 获取热门数据源（高优先级+多粉丝）
export function getHotSources(limit: number = 20): Influencer[] {
  return INFLUENCERS
    .filter(i => (i.priority || 0) >= 8)
    .sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      // 如果优先级相同，按粉丝数排序
      const aFollowers = parseInt((a.followers || '0').replace(/[^0-9]/g, ''));
      const bFollowers = parseInt((b.followers || '0').replace(/[^0-9]/g, ''));
      return bFollowers - aFollowers;
    })
    .slice(0, limit);
}
