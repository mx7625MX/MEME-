/**
 * 做市值策略模板配置
 * 预定义的策略配置模板，方便快速创建策略
 */

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'conservative' | 'moderate' | 'aggressive' | 'custom';
  strategyType: 'price_floor' | 'bot_snipe' | 'price_stabilization' | 'anti_dump' | 'comprehensive';
  platform: 'pump.fun' | 'four.meme' | 'raydium' | 'uniswap' | 'pancakeswap' | 'all';
  params: {
    // 托底买入参数
    floorPricePercent?: string;
    floorBuyAmount?: string;
    floorMaxBuy?: string;

    // 机器人狙击参数
    snipeEnabled?: boolean;
    snipeDelay?: number;
    snipeAmount?: string;
    snipeThreshold?: string;

    // 价格稳定参数
    stabilizationEnabled?: boolean;
    stabilizationInterval?: number;
    stabilizationAmount?: string;
    stabilizationTargetGrowth?: string;

    // 防砸盘参数
    antiDumpEnabled?: boolean;
    dumpThreshold?: string;
    antiDumpAmount?: string;
  };
  riskLevel: 'low' | 'medium' | 'high';
  maxSpend: string;
  stopLossPercent: string;
  tags: string[];
  recommendedFor: string[];
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  // ====== 保守型策略 ======
  {
    id: 'conservative-floor',
    name: '保守托底策略',
    description: '设置较低的托底价格，仅在价格大幅下跌时才介入，适合稳健投资者',
    category: 'conservative',
    strategyType: 'price_floor',
    platform: 'all',
    params: {
      floorPricePercent: '90', // 价格下跌10%时开始托底
      floorBuyAmount: '500',
      floorMaxBuy: '5000',
    },
    riskLevel: 'low',
    maxSpend: '50',
    stopLossPercent: '30',
    tags: ['保守', '低风险', '稳定'],
    recommendedFor: ['新手', '长期持有'],
  },
  {
    id: 'conservative-stabilization',
    name: '保守价格稳定',
    description: '定期少量买入，温和推动价格上涨，避免大额投入',
    category: 'conservative',
    strategyType: 'price_stabilization',
    platform: 'all',
    params: {
      stabilizationEnabled: true,
      stabilizationInterval: 30, // 每30秒买入一次
      stabilizationAmount: '100',
      stabilizationTargetGrowth: '3', // 目标每分钟增长3%
    },
    riskLevel: 'low',
    maxSpend: '30',
    stopLossPercent: '20',
    tags: ['保守', '价格稳定', '低频'],
    recommendedFor: ['稳健投资', '长期持有'],
  },

  // ====== 中等风险策略 ======
  {
    id: 'moderate-comprehensive',
    name: '综合做市策略',
    description: '结合托底买入和价格稳定，平衡风险与收益，适合大多数场景',
    category: 'moderate',
    strategyType: 'comprehensive',
    platform: 'all',
    params: {
      floorPricePercent: '95',
      floorBuyAmount: '1000',
      floorMaxBuy: '10000',
      snipeEnabled: true,
      snipeDelay: 100,
      snipeAmount: '500',
      snipeThreshold: '0.5',
      stabilizationEnabled: true,
      stabilizationInterval: 10,
      stabilizationAmount: '200',
      stabilizationTargetGrowth: '5',
    },
    riskLevel: 'medium',
    maxSpend: '100',
    stopLossPercent: '40',
    tags: ['综合', '平衡', '全能'],
    recommendedFor: ['一般投资者', '平衡策略'],
  },
  {
    id: 'moderate-floor',
    name: '标准托底策略',
    description: '在价格下跌5%时开始托底，及时支撑价格',
    category: 'moderate',
    strategyType: 'price_floor',
    platform: 'all',
    params: {
      floorPricePercent: '95',
      floorBuyAmount: '1000',
      floorMaxBuy: '10000',
    },
    riskLevel: 'medium',
    maxSpend: '100',
    stopLossPercent: '40',
    tags: ['标准', '托底', '中等风险'],
    recommendedFor: ['一般投资者', '价格支撑'],
  },
  {
    id: 'moderate-bot-snipe',
    name: '机器人狙击策略',
    description: '检测到大额买入时快速跟进，跟随市场热度',
    category: 'moderate',
    strategyType: 'bot_snipe',
    platform: 'pump.fun',
    params: {
      snipeEnabled: true,
      snipeDelay: 100,
      snipeAmount: '500',
      snipeThreshold: '0.5', // 0.5 SOL 大额买入触发
    },
    riskLevel: 'medium',
    maxSpend: '80',
    stopLossPercent: '35',
    tags: ['狙击', '机器人', '跟风'],
    recommendedFor: ['短期交易', '跟风策略'],
  },

  // ====== 激进型策略 ======
  {
    id: 'aggressive-floor',
    name: '激进托底策略',
    description: '设置较高的托底价格，积极维护价格，适合有经验的投资者',
    category: 'aggressive',
    strategyType: 'price_floor',
    platform: 'pump.fun',
    params: {
      floorPricePercent: '98', // 仅下跌2%就托底
      floorBuyAmount: '2000',
      floorMaxBuy: '20000',
    },
    riskLevel: 'high',
    maxSpend: '200',
    stopLossPercent: '50',
    tags: ['激进', '高投入', '积极托底'],
    recommendedFor: ['资深投资者', '快速拉升'],
  },
  {
    id: 'aggressive-comprehensive',
    name: '全能激进策略',
    description: '启用所有策略功能，全方位维护代币价格和流动性',
    category: 'aggressive',
    strategyType: 'comprehensive',
    platform: 'pump.fun',
    params: {
      floorPricePercent: '97',
      floorBuyAmount: '1500',
      floorMaxBuy: '15000',
      snipeEnabled: true,
      snipeDelay: 50, // 快速响应
      snipeAmount: '800',
      snipeThreshold: '0.3', // 更敏感
      stabilizationEnabled: true,
      stabilizationInterval: 5, // 频繁买入
      stabilizationAmount: '300',
      stabilizationTargetGrowth: '8', // 目标高增长
      antiDumpEnabled: true,
      dumpThreshold: '5000',
      antiDumpAmount: '3000',
    },
    riskLevel: 'high',
    maxSpend: '300',
    stopLossPercent: '60',
    tags: ['全能', '激进', '高频'],
    recommendedFor: ['专业投资者', '全面维护'],
  },
  {
    id: 'aggressive-anti-dump',
    name: '强力防砸盘策略',
    description: '对大额卖出进行强力反制，保护代币价格',
    category: 'aggressive',
    strategyType: 'anti_dump',
    platform: 'four.meme',
    params: {
      antiDumpEnabled: true,
      dumpThreshold: '8000',
      antiDumpAmount: '5000', // 大额反制
    },
    riskLevel: 'high',
    maxSpend: '250',
    stopLossPercent: '55',
    tags: ['防砸盘', '反制', '强力'],
    recommendedFor: ['价格保护', '防止砸盘'],
  },

  // ====== 平台专用策略 ======
  {
    id: 'pumpfun-standard',
    name: 'pump.fun 标准策略',
    description: '针对 pump.fun 平台优化的标准做市策略',
    category: 'moderate',
    strategyType: 'comprehensive',
    platform: 'pump.fun',
    params: {
      floorPricePercent: '95',
      floorBuyAmount: '1000',
      floorMaxBuy: '10000',
      snipeEnabled: true,
      snipeDelay: 100,
      snipeAmount: '500',
      snipeThreshold: '0.5',
      stabilizationEnabled: true,
      stabilizationInterval: 10,
      stabilizationAmount: '200',
      stabilizationTargetGrowth: '5',
    },
    riskLevel: 'medium',
    maxSpend: '100',
    stopLossPercent: '40',
    tags: ['pump.fun', '标准', '优化'],
    recommendedFor: ['pump.fun', '通用场景'],
  },
  {
    id: 'fourmeme-standard',
    name: 'four.meme 标准策略',
    description: '针对 four.meme 平台优化的标准做市策略',
    category: 'moderate',
    strategyType: 'comprehensive',
    platform: 'four.meme',
    params: {
      floorPricePercent: '95',
      floorBuyAmount: '1000',
      floorMaxBuy: '10000',
      snipeEnabled: true,
      snipeDelay: 100,
      snipeAmount: '500',
      snipeThreshold: '0.5',
      stabilizationEnabled: true,
      stabilizationInterval: 10,
      stabilizationAmount: '200',
      stabilizationTargetGrowth: '5',
    },
    riskLevel: 'medium',
    maxSpend: '100',
    stopLossPercent: '40',
    tags: ['four.meme', '标准', '优化'],
    recommendedFor: ['four.meme', '通用场景'],
  },

  // ====== 特殊场景策略 ======
  {
    id: 'sniper-only',
    name: '纯狙击策略',
    description: '仅检测和狙击机器人，不主动托底或稳定价格',
    category: 'aggressive',
    strategyType: 'bot_snipe',
    platform: 'pump.fun',
    params: {
      snipeEnabled: true,
      snipeDelay: 50,
      snipeAmount: '1000',
      snipeThreshold: '0.3',
    },
    riskLevel: 'high',
    maxSpend: '150',
    stopLossPercent: '45',
    tags: ['狙击', '被动', '跟随'],
    recommendedFor: ['跟风交易', '被动策略'],
  },
  {
    id: 'starter-template',
    name: '新手入门模板',
    description: '适合新手的简单策略，仅需托底买入，降低风险',
    category: 'conservative',
    strategyType: 'price_floor',
    platform: 'all',
    params: {
      floorPricePercent: '90',
      floorBuyAmount: '300',
      floorMaxBuy: '3000',
    },
    riskLevel: 'low',
    maxSpend: '30',
    stopLossPercent: '20',
    tags: ['新手', '简单', '入门'],
    recommendedFor: ['新手', '首次使用'],
  },
];

// 获取策略模板
export function getStrategyTemplate(id: string): StrategyTemplate | undefined {
  return STRATEGY_TEMPLATES.find((template) => template.id === id);
}

// 应用策略模板（返回可以用于创建策略的字段）
export function applyStrategyTemplate(template: StrategyTemplate): Partial<StrategyTemplate> {
  return {
    strategyType: template.strategyType,
    platform: template.platform,
    params: template.params,
    maxSpend: template.maxSpend,
    stopLossPercent: template.stopLossPercent,
  };
}
