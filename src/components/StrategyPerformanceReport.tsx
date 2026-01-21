'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Shield,
  Target,
  Clock,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface PerformanceData {
  strategy: any;
  performance: any;
  transactions: any[];
  timeRange: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
}

export function StrategyPerformanceReport({ strategyId }: { strategyId: string }) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState('7');

  const loadPerformance = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/market-maker/performance/${strategyId}?days=${days}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('加载性能报告失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, [strategyId, days]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无性能数据
      </div>
    );
  }

  const { performance, transactions } = data;

  return (
    <div className="space-y-6">
      {/* 头部控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">性能分析报告</h3>
          <p className="text-sm text-muted-foreground">
            策略: {data.strategy.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">最近 1 天</SelectItem>
              <SelectItem value="7">最近 7 天</SelectItem>
              <SelectItem value="30">最近 30 天</SelectItem>
              <SelectItem value="90">最近 90 天</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPerformance}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 总收益 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              总收益
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(performance.totalPnL) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {performance.totalPnL}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              收益率: {performance.totalReturn}
            </div>
          </CardContent>
        </Card>

        {/* 胜率 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              胜率
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {performance.winRate}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              总交易: {performance.totalTrades}次
            </div>
          </CardContent>
        </Card>

        {/* 最大回撤 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              最大回撤
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {performance.maxDrawdown}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              夏普比率: {performance.sharpeRatio}
            </div>
          </CardContent>
        </Card>

        {/* 执行效率 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              执行效率
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {performance.executionEfficiency}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              成功率: {performance.successRate}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细指标 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            详细指标
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 盈亏分析 */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                盈亏分析
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总盈利:</span>
                  <span className="text-green-500">{performance.totalProfit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总亏损:</span>
                  <span className="text-red-500">{performance.totalLoss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总手续费:</span>
                  <span>{performance.totalFees}</span>
                </div>
              </div>
            </div>

            {/* 持仓分析 */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                持仓分析
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">剩余数量:</span>
                  <span>{performance.remainingAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">持仓价值:</span>
                  <span>{performance.positionValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">当前价格:</span>
                  <span>{performance.currentPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">价格变动:</span>
                  <Badge variant={performance.priceChange.startsWith('+') ? 'default' : 'destructive'}>
                    {performance.priceChange}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 风险指标 */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                风险指标
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VaR (95%):</span>
                  <span className="text-orange-500">{performance.riskMetrics.var95}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">波动率:</span>
                  <span>{performance.riskMetrics.volatility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最大回撤:</span>
                  <span className="text-red-500">{performance.maxDrawdown}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            交易记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无交易记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>手续费</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        {new Date(tx.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'buy' ? 'default' : 'destructive'}>
                          {tx.type === 'buy' ? '买入' : '卖出'}
                        </Badge>
                      </TableCell>
                      <TableCell>{parseFloat(tx.amount).toFixed(2)}</TableCell>
                      <TableCell>{parseFloat(tx.price).toFixed(8)}</TableCell>
                      <TableCell>{parseFloat(tx.fee || '0').toFixed(4)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 时间分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            时间分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">首次交易:</span>
                <span>
                  {performance.firstTradeDate
                    ? new Date(performance.firstTradeDate).toLocaleString()
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">最近交易:</span>
                <span>
                  {performance.lastTradeDate
                    ? new Date(performance.lastTradeDate).toLocaleString()
                    : '-'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">时间范围:</span>
                <span>{data.timeRange.days} 天</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">日均交易:</span>
                <span>{performance.avgTradesPerDay} 次</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
