import { NextRequest, NextResponse } from 'next/server';
import { multiDataSourceAggregator } from '@/services/data-sources';

/**
 * 聚合多数据源热点信息
 * POST /api/hotspots/aggregate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords = ['cryptocurrency', 'bitcoin', 'ethereum'], options = {} } = body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供关键词数组' },
        { status: 400 }
      );
    }

    const results = await multiDataSourceAggregator.aggregateAllSources(keywords, options);

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        totalItems:
          results.news.length +
          results.reddit.length +
          results.aggregator.length +
          results.social.length +
          results.onChain.length,
        trendingCount: results.trending.length,
      },
    });
  } catch (error: any) {
    console.error('Error aggregating hotspots:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '聚合热点信息失败',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hotspots/aggregate - 获取默认热点聚合
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywordsParam = searchParams.get('keywords');
    const keywords = keywordsParam ? keywordsParam.split(',').map(k => k.trim()) : ['cryptocurrency', 'bitcoin', 'ethereum'];

    const results = await multiDataSourceAggregator.aggregateAllSources(keywords, {
      perSource: parseInt(searchParams.get('perSource') || '5'),
    });

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        keywords,
        totalItems:
          results.news.length +
          results.reddit.length +
          results.aggregator.length +
          results.social.length +
          results.onChain.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching hotspots:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '获取热点信息失败',
      },
      { status: 500 }
    );
  }
}
