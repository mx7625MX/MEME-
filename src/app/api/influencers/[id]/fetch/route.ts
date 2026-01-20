import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { aiSentiments } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { INFLUENCERS } from '@/config/influencers';

/**
 * 获取大V最新内容并进行分析
 * 支持两种模式：
 * 1. 真实API模式：调用社交媒体API获取真实内容
 * 2. AI模拟模式：使用大语言模型生成符合大V风格的模拟内容
 */

interface FetchContentRequest {
  mode?: 'real' | 'ai'; // real: 真实API, ai: AI模拟
  count?: number; // 获取内容数量
}

// Twitter API配置（需要申请开发者账号）
const TWITTER_API_CONFIG = {
  baseUrl: 'https://api.twitter.com/2',
  bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
};

// Telegram Bot API配置
const TELEGRAM_API_CONFIG = {
  baseUrl: 'https://api.telegram.org',
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
};

/**
 * 从Twitter API获取大V最新推文
 */
async function fetchFromTwitter(influencerHandle: string, count: number = 5) {
  try {
    if (!TWITTER_API_CONFIG.bearerToken) {
      throw new Error('Twitter API token not configured');
    }

    // 移除@符号
    const username = influencerHandle.replace('@', '');

    const response = await fetch(
      `${TWITTER_API_CONFIG.baseUrl}/users/by/username/${username}/tweets?max_results=${count}&tweet.fields=created_at,public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_API_CONFIG.bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data?.map((tweet: any) => ({
      id: tweet.id,
      content: tweet.text,
      platform: 'twitter',
      createdAt: tweet.created_at,
      metrics: tweet.public_metrics,
    })) || [];
  } catch (error) {
    console.error('Error fetching from Twitter:', error);
    throw error;
  }
}

/**
 * 从Telegram获取频道消息
 */
async function fetchFromTelegram(channelId: string, count: number = 5) {
  try {
    if (!TELEGRAM_API_CONFIG.botToken) {
      throw new Error('Telegram Bot token not configured');
    }

    const response = await fetch(
      `${TELEGRAM_API_CONFIG.baseUrl}/bot${TELEGRAM_API_CONFIG.botToken}/getUpdates`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 过滤出目标频道的消息
    const messages = data.result
      ?.filter((update: any) =>
        update.message?.chat?.username === channelId ||
        update.channel_post?.chat?.username === channelId
      )
      .slice(0, count)
      .map((update: any) => ({
        id: update.update_id,
        content: update.message?.text || update.channel_post?.text || '',
        platform: 'telegram',
        createdAt: new Date(update.message?.date * 1000).toISOString(),
      })) || [];

    return messages;
  } catch (error) {
    console.error('Error fetching from Telegram:', error);
    throw error;
  }
}

/**
 * 使用AI生成模拟大V内容
 * 基于大V的关键词和风格生成逼真的社交媒体内容
 */
async function generateSimulatedContent(influencer: any, count: number = 5) {
  try {
    // 构建提示词，让AI生成符合大V风格的模拟内容
    const prompt = `你是${influencer.name}（${influencer.handle}），${influencer.description}。

你的常用关键词包括：${influencer.keywords?.join(', ') || '加密货币, 区块链, 创新'}

请生成${count}条最近的社交媒体内容（推文风格），内容要：
1. 符合你的个人风格和语气
2. 涉及你的专业领域和常用关键词
3. 具有社交媒体的即时感和互动性
4. 每条内容50-200字
5. 可以包含emoji表情

请以JSON数组格式返回，每条包含content字段。

示例格式：
[
  {"content": "Bull run incoming! 🚀 #BTC breaking new ATH..."},
  {"content": "Just deployed a new smart contract on ETH mainnet..."}
]

直接返回JSON数组，不要有任何其他文字说明。`;

    // 使用系统内置的大语言模型调用方式
    // 这里使用简化的调用方式，通过环境变量或配置获取API端点
    const llmEndpoint = process.env.DOUBAO_API_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const llmApiKey = process.env.DOUBAO_API_KEY || '';

    if (!llmApiKey) {
      console.warn('LLM API key not configured, using fallback content generation');
      // 使用备用方案
      const fallbackContent = [];
      for (let i = 0; i < count; i++) {
        const keyword = influencer.keywords?.[i % (influencer.keywords?.length || 3)] || 'crypto';
        fallbackContent.push({
          content: `Exciting updates in the ${keyword} space! ${influencer.name} shares insights... 🚀 #${keyword.replace(/\s/g, '')}`
        });
      }
      return fallbackContent.map((item: any, index: number) => ({
        id: `sim-${index}`,
        content: item.content,
        platform: influencer.platform,
        createdAt: new Date().toISOString(),
        isSimulated: true,
      }));
    }

    // 调用大语言模型
    const response = await fetch(llmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-pro-4k',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // 增加创造性
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 解析AI生成的内容
    let generatedContent: any[] = [];
    try {
      const content = data.choices?.[0]?.message?.content || data.content || '';
      // 尝试解析JSON（不使用 dotAll 模式）
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        // 如果无法解析JSON，使用正则提取
        generatedContent = content.split('\n')
          .filter((line: string) => line.trim().length > 0)
          .map((line: string) => ({ content: line.trim() }));
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // 使用备用方案
      generatedContent = [
        { content: `Exciting news in the ${influencer.keywords?.[0] || 'crypto'} space! 🚀` },
        { content: `Just analyzed the ${influencer.keywords?.[1] || 'market'} trends...` },
      ];
    }

    return generatedContent.map((item: any, index: number) => ({
      id: `sim-${index}`,
      content: item.content,
      platform: influencer.platform,
      createdAt: new Date().toISOString(),
      isSimulated: true,
    }));
  } catch (error) {
    console.error('Error generating simulated content:', error);
    throw error;
  }
}

/**
 * 对获取的内容进行批量AI情绪分析
 */
async function analyzeContentSentiment(contents: any[]) {
  try {
    const db = await getDb();
    const analyses = [];

    // 获取当前请求的协议和主机名
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    for (const content of contents) {
      // 调用AI情绪分析API
      const analysisResponse = await fetch(`${baseUrl}/api/ai/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.content,
          platform: content.platform,
        }),
      });

      if (!analysisResponse.ok) {
        console.error('AI analysis failed for content:', content.content);
        continue;
      }

      const analysisData = await analysisResponse.json();

      if (analysisData.success) {
        // 保存分析结果到数据库
        // 使用metadata存储额外的分析数据
        const [sentiment] = await db.insert(aiSentiments).values({
          tokenSymbol: 'UNKNOWN', // 大V内容分析可能不针对特定代币
          sentiment: analysisData.data.sentiment.sentiment,
          score: analysisData.data.sentiment.score,
          analysis: analysisData.data.analysis?.summary || 'AI情绪分析',
          source: content.platform,
          metadata: {
            content: content.content,
            keywords: analysisData.data.keywords,
            suggestions: analysisData.data.suggestions,
            fullAnalysis: analysisData.data.analysis,
          },
        }).returning();

        analyses.push({
          content: content.content,
          contentId: content.id,
          analysis: analysisData.data,
          sentimentId: sentiment.id,
        });
      }
    }

    return analyses;
  } catch (error) {
    console.error('Error analyzing content sentiment:', error);
    throw error;
  }
}

/**
 * 主处理函数
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15+ 中 params 是一个 Promise
    const { id: influencerId } = await params;

    console.log('Fetching content for influencer:', influencerId);
    console.log('Available influencers:', INFLUENCERS.map(i => i.id).join(', '));

    // 查找大V配置
    const influencer = INFLUENCERS.find(i => i.id === influencerId);
    if (!influencer) {
      console.error('Influencer not found:', influencerId);
      return NextResponse.json(
        { success: false, error: '未找到该大V' },
        { status: 404 }
      );
    }

    // 解析请求参数
    const body = await request.json();
    const mode = body.mode || 'ai'; // 默认使用AI模拟模式
    const count = body.count || 5;

    let contents: any[] = [];

    // 根据模式获取内容
    if (mode === 'real') {
      // 真实API模式
      if (influencer.platform === 'twitter') {
        contents = await fetchFromTwitter(influencer.handle, count);
      } else if (influencer.platform === 'telegram') {
        contents = await fetchFromTelegram(influencer.handle.replace('@', ''), count);
      } else {
        return NextResponse.json(
          { success: false, error: `平台 ${influencer.platform} 的真实API暂未配置` },
          { status: 400 }
        );
      }

      if (contents.length === 0) {
        return NextResponse.json(
          { success: false, error: '未获取到内容，可能需要配置API密钥' },
          { status: 400 }
        );
      }
    } else {
      // AI模拟模式
      contents = await generateSimulatedContent(influencer, count);
    }

    // 对内容进行情绪分析
    const analyses = await analyzeContentSentiment(contents);

    // 计算整体建议
    const bullishCount = analyses.filter(a => a.analysis.sentiment.sentiment === 'bullish').length;
    const bearishCount = analyses.filter(a => a.analysis.sentiment.sentiment === 'bearish').length;
    const avgScore = analyses.reduce((sum, a) => sum + a.analysis.sentiment.score, 0) / analyses.length;

    // 生成整体建议
    let recommendation = 'HOLD';
    if (avgScore > 0.3 && bullishCount > bearishCount) {
      recommendation = 'BUY';
    } else if (avgScore < -0.3 && bearishCount > bullishCount) {
      recommendation = 'SELL';
    }

    // 提取所有关键词
    const allKeywords = analyses.flatMap(a => a.analysis.keywords);
    const topKeywords = allKeywords
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 5);

    // 生成代币建议
    const tokenSuggestions = analyses.flatMap(a => a.analysis.suggestions).slice(0, 3);

    return NextResponse.json({
      success: true,
      data: {
        influencer: {
          id: influencer.id,
          name: influencer.name,
          handle: influencer.handle,
          platform: influencer.platform,
        },
        mode: mode,
        contents: contents,
        analyses: analyses,
        summary: {
          totalContents: contents.length,
          bullishCount,
          bearishCount,
          avgScore: avgScore.toFixed(2),
          recommendation,
          topKeywords,
          tokenSuggestions,
        },
        message: mode === 'ai'
          ? `已生成${contents.length}条${influencer.name}的模拟内容并完成分析`
          : `已获取${contents.length}条${influencer.name}的最新内容并完成分析`,
      },
    });
  } catch (error: any) {
    console.error('Error fetching influencer content:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '获取大V内容失败',
      },
      { status: 500 }
    );
  }
}

// 支持GET请求获取大V信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: influencerId } = await params;
    const influencer = INFLUENCERS.find(i => i.id === influencerId);

    if (!influencer) {
      return NextResponse.json(
        { success: false, error: '未找到该大V' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...influencer,
        supportedModes: ['ai'], // AI模拟模式总是可用
        realApiSupported: influencer.platform === 'twitter' || influencer.platform === 'telegram',
      },
    });
  } catch (error: any) {
    console.error('Error getting influencer info:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取大V信息失败' },
      { status: 500 }
    );
  }
}
