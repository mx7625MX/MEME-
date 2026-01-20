import { NextRequest } from "next/server";
import { marketDataManager } from "@/storage/database";

// SSE 端点 - 实时市场数据流
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // 创建 SSE 响应
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let counter = 0;

        // 每 3 秒推送一次数据
        const intervalId = setInterval(async () => {
          try {
            counter++;

            // 获取市场数据
            const marketData = await marketDataManager.getMarketData({
              limit: 10,
            });

            // 模拟价格变化（实际项目中应该从外部 API 获取实时数据）
            const simulatedData = marketData.map((token) => ({
              ...token,
              price: (
                parseFloat(token.price) * (1 + (Math.random() - 0.5) * 0.01)
              ).toFixed(8),
              change24h: (
                parseFloat(token.change24h || "0") +
                (Math.random() - 0.5) * 0.5
              ).toFixed(2),
            }));

            // 发送数据
            const data = JSON.stringify({
              type: "update",
              timestamp: new Date().toISOString(),
              data: simulatedData,
            });

            controller.enqueue(
              encoder.encode(`data: ${data}\n\n`)
            );

            // 每 30 秒发送一次心跳
            if (counter % 10 === 0) {
              controller.enqueue(encoder.encode(`: heartbeat\n\n`));
            }
          } catch (error) {
            console.error("Error sending SSE data:", error);
          }
        }, 3000);

        // 处理客户端断开连接
        request.signal.addEventListener("abort", () => {
          clearInterval(intervalId);
          controller.close();
        });
      } catch (error) {
        console.error("SSE stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // 禁用 nginx 缓冲
    },
  });
}
