import { NextRequest, NextResponse } from 'next/server';
import { multiDataSourceAggregator } from '@/services/data-sources';

/**
 * 分析热点并生成交易建议
 * POST /api/hotspots/analyze
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords = ['cryptocurrency', 'bitcoin', 'ethereum'] } = body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供关键词数组' },
        { status: 400 }
      );
    }

    const analysis = await multiDataSourceAggregator.analyzeHotspots(keywords);

    // 基于分析结果生成交易建议
    const generateTradingSuggestions = (
      hotTopics: any[],
      sources: any[]
    ) => {
      const suggestions: any[] = [];

      // 从热门话题提取代币建议
      hotTopics.slice(0, 3).forEach((topic, index) => {
        const tokenNames = {
          'bitcoin': 'Bitcoin',
          'ethereum': 'Ethereum',
          'defi': 'DeFi Blue Chip Index',
          'nft': 'NFT Market Leader',
          'solana': 'Solana',
          'layer2': 'L2 Ecosystem',
          'meme coin': 'Popular Meme Token',
        };

        const tokenName = tokenNames[topic.keyword as keyof typeof tokenNames] || `${topic.keyword.toUpperCase()} Token`;
        const sentiment = topic.growth > 20 ? 'bullish' : topic.growth < -10 ? 'bearish' : 'neutral';

        suggestions.push({
          type: 'trend',
          topic: topic.keyword,
          token: tokenName,
          action: sentiment === 'bullish' ? 'BUY' : sentiment === 'bearish' ? 'SELL' : 'HOLD',
          confidence: Math.min(95, 60 + topic.score * 0.3),
          reason: `热门趋势: ${topic.keyword} (热度: ${topic.score}, 增长: ${topic.growth > 0 ? '+' : ''}${topic.growth}%)`,
          sources: topic.sources,
        });
      });

      // 从数据源提取特定代币机会
      const tokenMentions = new Map<string, number>();
      sources.slice(0, 10).forEach(source => {
        const content = source.content.toLowerCase();
        const tokens = ['btc', 'bitcoin', 'eth', 'ethereum', 'sol', 'solana', 'bnb', 'binance', 'matic', 'polygon', 'avax', 'avalanche'];
        tokens.forEach(token => {
          if (content.includes(token)) {
            tokenMentions.set(token, (tokenMentions.get(token) || 0) + 1);
          }
        });
      });

      const topTokens = Array.from(tokenMentions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      topTokens.forEach(([token, count]) => {
        const tokenNameMap: Record<string, string> = {
          'btc': 'Bitcoin',
          'bitcoin': 'Bitcoin',
          'eth': 'Ethereum',
          'ethereum': 'Ethereum',
          'sol': 'Solana',
          'solana': 'Solana',
          'bnb': 'BNB',
          'binance': 'BNB',
          'matic': 'Polygon',
          'polygon': 'Polygon',
          'avax': 'Avalanche',
          'avalanche': 'Avalanche',
        };

        suggestions.push({
          type: 'token',
          token: tokenNameMap[token] || token.toUpperCase(),
          action: 'WATCH',
          confidence: Math.min(90, 50 + count * 10),
          reason: `在 ${count} 条信息中被提及，市场关注度较高`,
        });
      });

      return suggestions;
    };

    const suggestions = generateTradingSuggestions(analysis.hotTopics, analysis.sources);

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        suggestions,
      },
    });
  } catch (error: any) {
    console.error('Error analyzing hotspots:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '分析热点失败',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hotspots/analyze - 获取默认热点分析
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywordsParam = searchParams.get('keywords');
    const keywords = keywordsParam ? keywordsParam.split(',').map(k => k.trim()) : ['cryptocurrency', 'bitcoin', 'ethereum'];

    const analysis = await multiDataSourceAggregator.analyzeHotspots(keywords);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing hotspots:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '分析热点失败',
      },
      { status: 500 }
    );
  }
}
