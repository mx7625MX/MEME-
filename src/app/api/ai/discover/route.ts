import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, platform = 'twitter' } = body;
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: '请提供要分析的内容' },
        { status: 400 }
      );
    }

    // 这里应该调用大语言模型进行关键词提取
    // 由于我们没有集成的 LLM 服务，我们使用简单的关键词提取算法
    // 实际应用中应该调用 AI API
    
    // 简单的关键词提取逻辑
    const extractKeywords = (text: string) => {
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
      
      // 提取单词
      const words = text.toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留中文
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
      
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
    
    const keywords = extractKeywords(content);
    
    // 生成代币建议
    const generateTokenSuggestions = (keywords: Array<{ word: string; freq: number }>) => {
      if (keywords.length === 0) return [];
      
      return keywords.slice(0, 5).map((item, index) => {
        const word = item.word;
        
        // 生成代币符号（取前4个字母并大写）
        let symbol = word.substring(0, 4).toUpperCase();
        
        // 如果符号太短，添加数字
        if (symbol.length < 2) symbol = word.substring(0, 2).toUpperCase() + (index + 1);
        
        // 确保符号格式正确
        symbol = symbol.replace(/[^A-Z0-9]/g, '');
        
        // 生成总供应量建议（基于关键词频率）
        const baseSupply = 1000000000; // 10亿
        const multiplier = item.freq > 3 ? 10 : item.freq > 1 ? 5 : 1;
        const totalSupply = baseSupply * multiplier;
        
        // 生成价格建议
        const price = 0.000001 * (index + 1);
        
        // 生成描述
        const description = `${word} - 基于 ${platform} 热点分析的代币`;
        
        return {
          name: word.charAt(0).toUpperCase() + word.slice(1),
          symbol,
          totalSupply: totalSupply.toString(),
          price: price.toString(),
          liquidity: (Math.random() * 20 + 5).toFixed(2), // 5-25的随机流动性
          description,
          relevance: Math.round((item.freq / keywords[0].freq) * 100)
        };
      });
    };
    
    const suggestions = generateTokenSuggestions(keywords);
    
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
