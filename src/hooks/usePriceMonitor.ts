'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface PriceData {
  price: number;
  change: number;
}

interface PriceUpdateMessage {
  type: 'initial' | 'price_update';
  data: Record<string, PriceData>;
  timestamp: number;
}

interface UsePriceMonitorOptions {
  tokens: string[];
  enabled?: boolean;
  onPriceUpdate?: (token: string, data: PriceData) => void;
  onError?: (error: Event) => void;
}

interface UsePriceMonitorReturn {
  prices: Record<string, PriceData>;
  isConnected: boolean;
  lastUpdate: number | null;
  reconnect: () => void;
  disconnect: () => void;
}

export function usePriceMonitor({
  tokens,
  enabled = true,
  onPriceUpdate,
  onError,
}: UsePriceMonitorOptions): UsePriceMonitorReturn {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  const connect = useCallback(() => {
    if (!enabled || tokens.length === 0) {
      return;
    }

    // 清理现有连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const url = `/api/ws/prices?tokens=${tokens.join(',')}`;
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0;
        console.log('价格监控连接已建立');
      };

      eventSource.onmessage = (event) => {
        try {
          const message: PriceUpdateMessage = JSON.parse(event.data);

          if (message.type === 'initial') {
            setPrices(message.data);
            setLastUpdate(message.timestamp);
          } else if (message.type === 'price_update') {
            setPrices((prevPrices) => ({
              ...prevPrices,
              ...message.data,
            }));
            setLastUpdate(message.timestamp);

            // 触发回调
            Object.entries(message.data).forEach(([token, data]) => {
              onPriceUpdate?.(token, data);
            });
          }
        } catch (error) {
          console.error('解析价格更新消息失败:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('价格监控连接错误:', error);
        setIsConnected(false);
        onError?.(error);

        // 自动重连
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000); // 指数退避
          console.log(`${delay}ms 后尝试重连...`);
          setTimeout(() => {
            connect();
          }, delay);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('创建价格监控连接失败:', error);
      setIsConnected(false);
    }
  }, [tokens, enabled, onPriceUpdate, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log('价格监控连接已关闭');
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    prices,
    isConnected,
    lastUpdate,
    reconnect,
    disconnect,
  };
}
