import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, platform = 'twitter', influencerName } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: '请提供要分析的内容' },
        { status: 400 }
      );
    }

    // 构建要排除的名字列表（包括中英文）
    const excludeNames: string[] = [];
    if (influencerName) {
      excludeNames.push(influencerName);

      // 常见的中英文名映射
      const nameMappings: Record<string, string[]> = {
        'Elon Musk': ['马斯克', '埃隆马斯克'],
        'CZ': ['币安', '赵长鹏'],
        'Vitalik Buterin': ['Vitalik', 'V神', '维塔利克'],
        'Justin Sun': ['孙宇晨', '波场'],
      };

      const mappings = nameMappings[influencerName] || [];
      excludeNames.push(...mappings);
    }

    // 这里应该调用大语言模型进行关键词提取
    // 由于我们没有集成的 LLM 服务，我们使用简单的关键词提取算法
    // 实际应用中应该调用 AI API

    // 简单的关键词提取逻辑
    const extractKeywords = (text: string, excludeNames: string[] = []) => {
      // 移除常见的停用词
      const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for',
        'of', 'with', 'as', 'by', 'it', 'that', 'this', 'be', 'are', 'was',
        'will', 'have', 'from', 'or', 'but', 'not', 'we', 'you', 'they', 'he',
        'she', 'his', 'her', 'their', 'my', 'your', 'our', 'its', 'can', 'do',
        'so', 'if', 'out', 'up', 'all', 'what', 'when', 'where', 'who', 'why',
        'how', 'just', 'like', 'get', 'got', 'going', 'go', 'me', 'now', 'very',
        'well', 'much', 'more', 'some', 'would', 'could', 'should', 'may', 'might',
        '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一',
        '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有',
        '看', '好', '自己', '这'
      ]);

      // 添加要排除的大V名字
      const excludeWords = new Set(excludeNames.map(n => n.toLowerCase()));

      // 提取单词
      const words = text.toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留中文
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word) && !excludeWords.has(word));

      // 统计词频
      const wordFreq: Record<string, number> = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      // 排序并返回前10个高频词
      return Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, freq]) => ({ word, freq }));
    };

    // 提取关键词，排除大V名字
    const keywords = extractKeywords(content, excludeNames);

    // 生成代币建议
    const generateTokenSuggestions = (keywords: Array<{ word: string; freq: number }>, platform: string) => {
      if (keywords.length === 0) return [];

      // 创意代币命名前缀
      const prefixes = ['Super', 'Mega', 'Ultra', 'Hyper', 'Meta', 'Neo', 'Cyber', 'Moon', 'Rocket', 'Chad', 'WAGMI', 'HODL', 'Alpha', 'Beta', 'Prime', 'Max', 'Pro', 'Elite'];
      const suffixes = ['Coin', 'Token', 'Fi', 'Verse', 'Verse', 'World', 'Land', 'Verse', 'DAO', 'Labs', 'X', 'Z'];

      return keywords.slice(0, 5).map((item, index) => {
        const word = item.word;

        // 创意命名组合
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

        // 多种命名策略
        let name: string;
        const namingStrategy = index % 4;

        switch (namingStrategy) {
          case 0:
            // 前缀+关键词
            name = `${prefix}${word.charAt(0).toUpperCase() + word.slice(1)}`;
            break;
          case 1:
            // 关键词+后缀
            name = `${word.charAt(0).toUpperCase() + word.slice(1)}${suffix}`;
            break;
          case 2:
            // 纯关键词（大写）
            name = word.toUpperCase();
            break;
          case 3:
            // 组合词
            name = `${word}${suffix}`;
            break;
          default:
            name = word.charAt(0).toUpperCase() + word.slice(1);
        }

        // 生成代币符号
        let symbol = word.substring(0, 4).toUpperCase();
        if (symbol.length < 2) {
          symbol = word.substring(0, 2).toUpperCase() + (index + 1);
        }
        symbol = symbol.replace(/[^A-Z0-9]/g, '');

        // 生成总供应量建议
        const baseSupply = 1000000000; // 10亿
        const multiplier = item.freq > 3 ? 10 : item.freq > 1 ? 5 : 1;
        const totalSupply = baseSupply * multiplier;

        // 生成价格建议
        const price = 0.000001 * (index + 1);

        // 生成更有吸引力的描述
        const descriptions = [
          `🚀 ${word} - ${platform}热门概念代币，捕捉市场热点`,
          `💎 ${word} - ${platform}热议话题，价值潜力巨大`,
          `🌙 ${word} - ${platform}焦点项目，值得关注`,
          `⚡ ${word} - ${platform}快速崛起概念，抢占先机`,
          `🔥 ${word} - ${platform}火爆话题，社区热情高涨`,
        ];

        const description = descriptions[index % descriptions.length];

        return {
          name,
          symbol,
          totalSupply: totalSupply.toString(),
          price: price.toString(),
          liquidity: (Math.random() * 20 + 5).toFixed(2), // 5-25的随机流动性
          description,
          relevance: Math.round((item.freq / keywords[0].freq) * 100),
          namingStrategy,
        };
      });
    };

    const suggestions = generateTokenSuggestions(keywords, platform);

    // 分析内容特征
    const analyzeSentiment = (text: string) => {
      const positiveWords = ['good', 'great', 'amazing', 'awesome', 'love', 'bull', 'moon', 'pump', 'good', '好', '棒', '牛', '涨', '爱', '火'];
      const negativeWords = ['bad', 'terrible', 'hate', 'bear', 'dump', 'crash', 'scam', 'rug', '坏', '差', '熊', '跌', '骗局', '跑路'];

      let positiveCount = 0;
      let negativeCount = 0;

      const lowerText = text.toLowerCase();
      positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeCount++;
      });

      let sentiment = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'bullish';
      else if (negativeCount > positiveCount) sentiment = 'bearish';

      return {
        sentiment,
        score: (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount),
        positiveCount,
        negativeCount
      };
    };

    const sentiment = analyzeSentiment(content);

    return NextResponse.json({
      success: true,
      data: {
        platform,
        keywords,
        suggestions,
        sentiment,
        analysis: {
          contentLength: content.length,
          keywordCount: keywords.length,
          summary: `从 ${platform} 内容中提取了 ${keywords.length} 个关键词，生成了 ${suggestions.length} 个代币建议。${sentiment.sentiment === 'bullish' ? '整体情绪偏看涨' : sentiment.sentiment === 'bearish' ? '整体情绪偏看跌' : '整体情绪中性'}。`
        }
      }
    });

  } catch (error) {
    console.error('Discover error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '智能分析失败'
      },
      { status: 500 }
    );
  }
}
