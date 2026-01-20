import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config } from "coze-coding-dev-sdk";
import { aiSentimentManager } from "@/storage/database";

// POST /api/ai/sentiment - 分析市场情绪
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenSymbol, source = "general", context } = body;

    if (!tokenSymbol) {
      return NextResponse.json(
        {
          success: false,
          error: "Token symbol is required",
        },
        { status: 400 }
      );
    }

    // Initialize LLM client
    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      {
        role: "system" as const,
        content: `你是一个专业的加密货币市场情绪分析师。请分析以下信息，给出对 ${tokenSymbol} 代币的市场情绪判断。

请从以下维度进行分析：
1. 市场情绪（bullish/看涨、bearish/看跌、neutral/中性）
2. 情绪强度评分（-1 到 1，其中 -1 表示极度看跌，1 表示极度看涨，0 表示中性）
3. 详细分析理由

请以 JSON 格式返回结果，格式如下：
{
  "sentiment": "bullish|bearish|neutral",
  "score": -1 到 1 之间的数字,
  "analysis": "详细的分析说明（3-5句话）"
}`,
      },
      {
        role: "user" as const,
        content: context || `分析 ${tokenSymbol} 的当前市场情绪`,
      },
    ];

    // Use thinking model for better analysis
    const response = await client.invoke(messages, {
      model: "doubao-seed-1-6-thinking-250715",
      thinking: "enabled",
      temperature: 0.7,
    });

    // Parse the JSON response
    let sentimentData: {
      sentiment: string;
      score: number;
      analysis: string;
    };

    try {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentimentData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: parse manually
        const sentimentMatch = response.content.match(/sentiment["\s:]+(bullish|bearish|neutral)/i);
        const scoreMatch = response.content.match(/score["\s:]+(-?[\d.]+)/i);
        
        sentimentData = {
          sentiment: sentimentMatch?.[1]?.toLowerCase() || "neutral",
          score: parseFloat(scoreMatch?.[1] || "0"),
          analysis: response.content,
        };
      }
    } catch (parseError) {
      console.error("Error parsing sentiment response:", parseError);
      // Fallback values
      sentimentData = {
        sentiment: "neutral",
        score: 0,
        analysis: response.content,
      };
    }

    // Save to database
    const saved = await aiSentimentManager.createSentiment({
      tokenSymbol,
      sentiment: sentimentData.sentiment,
      score: sentimentData.score.toString(),
      analysis: sentimentData.analysis,
      source,
      metadata: {
        model: "doubao-seed-1-6-thinking-250715",
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...saved,
        analysis: sentimentData.analysis,
      },
    });
  } catch (error: any) {
    console.error("Error analyzing sentiment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze sentiment",
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/sentiment - 获取历史情绪分析
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenSymbol = searchParams.get("tokenSymbol");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!tokenSymbol) {
      return NextResponse.json(
        {
          success: false,
          error: "Token symbol is required",
        },
        { status: 400 }
      );
    }

    const sentiments = await aiSentimentManager.getSentimentHistory(
      tokenSymbol,
      limit
    );

    const stats = await aiSentimentManager.getSentimentStats({ tokenSymbol });

    return NextResponse.json({
      success: true,
      data: {
        sentiments,
        stats,
      },
    });
  } catch (error: any) {
    console.error("Error fetching sentiments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch sentiments",
      },
      { status: 500 }
    );
  }
}
