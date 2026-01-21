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
  // ====== 保守托底策略 ======
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

  // ====== 综合做市策略 ======
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
