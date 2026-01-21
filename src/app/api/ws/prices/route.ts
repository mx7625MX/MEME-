import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokens = url.searchParams.get('tokens')?.split(',') || [];

  // 设置 SSE 响应头
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // 价格缓存
      const priceCache = new Map<string, number>();

      // 初始化价格
      tokens.forEach((token) => {
        priceCache.set(token, Math.random() * 0.01);
      });

      // 发送初始价格
      const initialPrices = Object.fromEntries(priceCache);
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'initial',
            data: initialPrices,
            timestamp: Date.now(),
          })}\n\n`
        )
      );

      // 启动价格更新定时器
      const intervalId = setInterval(() => {
        const updates: Record<string, { price: number; change: number }> = {};

        tokens.forEach((token) => {
          const oldPrice = priceCache.get(token) || 0;
          const changePercent = (Math.random() - 0.5) * 2; // -1% 到 +1%
          const newPrice = oldPrice * (1 + changePercent / 100);

          priceCache.set(token, newPrice);
          updates[token] = {
            price: newPrice,
            change: changePercent,
          };
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'price_update',
              data: updates,
              timestamp: Date.now(),
            })}\n\n`
          )
        );
      }, 1000); // 每秒更新一次

      // 清理函数
      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
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
