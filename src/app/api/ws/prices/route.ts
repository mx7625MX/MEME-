import { NextRequest } from 'next/server';
import { priceDataService } from '@/services/priceData/priceDataService';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokens = url.searchParams.get('tokens')?.split(',') || [];
  const chain = url.searchParams.get('chain') || 'solana';

  if (tokens.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No tokens specified' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 设置 SSE 响应头
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const abortController = new AbortController();

      // 获取初始价格
      const loadInitialPrices = async () => {
        try {
          const initialPrices = await priceDataService.getBatchPrices(tokens, chain);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'initial',
                data: initialPrices,
                timestamp: Date.now(),
              })}\n\n`
            )
          );
        } catch (error) {
          console.error('Failed to load initial prices:', error);
          controller.error(error);
        }
      };

      // 加载初始价格
      loadInitialPrices();

      // 启动价格更新定时器
      const intervalId = setInterval(async () => {
        try {
          const updates = await priceDataService.getBatchPrices(tokens, chain);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'price_update',
                data: updates,
                timestamp: Date.now(),
              })}\n\n`
            )
          );
        } catch (error) {
          console.error('Failed to update prices:', error);
        }
      }, 1000); // 每秒更新一次

      // 清理函数
      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        abortController.abort();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
