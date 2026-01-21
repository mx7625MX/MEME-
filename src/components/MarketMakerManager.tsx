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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Activity,
  Plus,
  Trash2,
  Play,
  Pause,
  Edit,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  DollarSign,
} from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  walletId: string;
  tokenAddress: string;
  tokenSymbol: string;
  platform: string;
  strategyType: string;
  isEnabled: boolean;
  status: string;
  params: any;
  totalBuys: number;
  totalBuyAmount: string;
  totalSpent: string;
  maxSpend: string;
  stopLossPercent: string;
  lastExecutedAt: Date | null;
  nextExecuteAt: Date | null;
  createdAt: Date;
}

interface Wallet {
  id: string;
  name: string;
  chain: string;
  address: string;
  balance: string;
}

interface BotLog {
  id: string;
  walletAddress: string;
  tokenAddress: string;
  platform: string;
  detectionType: string;
  confidence: number;
  details: any;
  actionTaken: string;
  createdAt: Date;
}

export function MarketMakerManager() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBotLogs, setShowBotLogs] = useState(false);

  const [strategyForm, setStrategyForm] = useState({
    name: '',
    walletId: '',
    tokenAddress: '',
    tokenSymbol: '',
    platform: 'pump.fun',
    strategyType: 'price_floor',
    isEnabled: true,
    maxSpend: '100',
    stopLossPercent: '50',
    params: {
      floorPricePercent: '95',
      floorBuyAmount: '1000',
      floorMaxBuy: '10000',
      snipeEnabled: false,
      snipeDelay: 100,
      snipeAmount: '500',
      snipeThreshold: '0.5',
      stabilizationEnabled: false,
      stabilizationInterval: 10,
      stabilizationAmount: '200',
      stabilizationTargetGrowth: '5',
      antiDumpEnabled: false,
      dumpThreshold: '10000',
      antiDumpAmount: '2000',
    },
  });

  const API_BASE = '/api/market-maker';

  // 加载策略列表
  const loadStrategies = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/strategies`);
      const data = await res.json();
      if (data.success) {
        setStrategies(data.data);
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载钱包列表
  const loadWallets = async () => {
    try {
      const res = await fetch('/api/wallets');
      const data = await res.json();
      if (data.success) {
        setWallets(data.data);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  // 加载机器人检测日志
  const loadBotLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/detect-bot`);
      const data = await res.json();
      if (data.success) {
        setBotLogs(data.data);
      }
    } catch (error) {
      console.error('Error loading bot logs:', error);
    }
  };

  useEffect(() => {
    loadStrategies();
    loadWallets();
    loadBotLogs();
  }, []);

  // 创建策略
  const handleCreateStrategy = async () => {
    try {
      setIsCreating(true);
      const res = await fetch(`${API_BASE}/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategyForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateDialog(false);
        resetForm();
        loadStrategies();
      } else {
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Error creating strategy:', error);
      alert('创建策略失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 执行策略
  const handleExecuteStrategy = async (strategyId: string) => {
    try {
      setIsExecuting(strategyId);
      const res = await fetch(`${API_BASE}/execute/${strategyId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        loadStrategies();
      } else {
        alert(data.error || '执行失败');
      }
    } catch (error) {
      console.error('Error executing strategy:', error);
      alert('执行策略失败');
    } finally {
      setIsExecuting(null);
    }
  };

  // 切换策略启用状态
  const handleToggleStrategy = async (strategyId: string, isEnabled: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/strategies/${strategyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        loadStrategies();
      }
    } catch (error) {
      console.error('Error toggling strategy:', error);
    }
  };

  // 删除策略
  const handleDeleteStrategy = async (strategyId: string) => {
    try {
      const res = await fetch(`${API_BASE}/strategies/${strategyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadStrategies();
      }
    } catch (error) {
      console.error('Error deleting strategy:', error);
    }
  };

  // 重置表单
  const resetForm = () => {
    setStrategyForm({
      name: '',
      walletId: '',
      tokenAddress: '',
      tokenSymbol: '',
      platform: 'pump.fun',
      strategyType: 'price_floor',
      isEnabled: true,
      maxSpend: '100',
      stopLossPercent: '50',
      params: {
        floorPricePercent: '95',
        floorBuyAmount: '1000',
        floorMaxBuy: '10000',
        snipeEnabled: false,
        snipeDelay: 100,
        snipeAmount: '500',
        snipeThreshold: '0.5',
        stabilizationEnabled: false,
        stabilizationInterval: 10,
        stabilizationAmount: '200',
        stabilizationTargetGrowth: '5',
        antiDumpEnabled: false,
        dumpThreshold: '10000',
        antiDumpAmount: '2000',
      },
    });
  };

  // 获取策略类型图标
  const getStrategyTypeIcon = (type: string) => {
    switch (type) {
      case 'price_floor':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'bot_snipe':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'price_stabilization':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'anti_dump':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'comprehensive':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // 获取策略类型名称
  const getStrategyTypeName = (type: string) => {
    const names: Record<string, string> = {
      price_floor: '托底买入',
      bot_snipe: '机器人狙击',
      price_stabilization: '价格稳定',
      anti_dump: '防砸盘',
      comprehensive: '综合策略',
    };
    return names[type] || type;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      idle: 'bg-gray-500',
      running: 'bg-green-500',
      paused: 'bg-yellow-500',
      stopped: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  // 获取平台名称
  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      'pump.fun': 'pump.fun',
      'four.meme': 'four.meme',
      raydium: 'Raydium',
      uniswap: 'Uniswap',
      pancakeswap: 'PancakeSwap',
    };
    return names[platform] || platform;
  };

  // 获取检测类型名称
  const getDetectionTypeName = (type: string) => {
    const names: Record<string, string> = {
      rapid_buy_sell: '快速买卖',
      large_buy: '大额买入',
      pattern: '高频交易',
      dump: '砸盘',
    };
    return names[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-200">活跃策略</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {strategies.filter((s) => s.isEnabled).length}
              </div>
              <Activity className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-200">总买入次数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {strategies.reduce((sum, s) => sum + (s.totalBuys || 0), 0)}
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0">
          <CardHeader className="pb-2">
            <CardDescription className="green-200">总花费</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {strategies
                  .reduce((sum, s) => sum + parseFloat(s.totalSpent || '0'), 0)
                  .toFixed(2)}
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-800 text-white border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-red-200">机器人检测</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{botLogs.length}</div>
              <AlertTriangle className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 策略列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>做市值策略管理</CardTitle>
              <CardDescription>
                管理 Bonding Curve 内盘阶段的自动做市值策略
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadBotLogs()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新日志
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    创建策略
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>创建做市值策略</DialogTitle>
                    <DialogDescription>
                      为 Bonding Curve 平台创建自动做市值策略
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">策略名称</Label>
                        <Input
                          id="name"
                          value={strategyForm.name}
                          onChange={(e) =>
                            setStrategyForm({ ...strategyForm, name: e.target.value })
                          }
                          placeholder="我的做市值策略"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="walletId">执行钱包</Label>
                        <Select
                          value={strategyForm.walletId}
                          onValueChange={(value) =>
                            setStrategyForm({ ...strategyForm, walletId: value })
                          }
                        >
                          <SelectTrigger id="walletId">
                            <SelectValue placeholder="选择钱包" />
                          </SelectTrigger>
                          <SelectContent>
                            {wallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name} ({wallet.chain}) - {wallet.balance}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tokenSymbol">代币符号</Label>
                        <Input
                          id="tokenSymbol"
                          value={strategyForm.tokenSymbol}
                          onChange={(e) =>
                            setStrategyForm({
                              ...strategyForm,
                              tokenSymbol: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="PEPE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tokenAddress">代币地址</Label>
                        <Input
                          id="tokenAddress"
                          value={strategyForm.tokenAddress}
                          onChange={(e) =>
                            setStrategyForm({
                              ...strategyForm,
                              tokenAddress: e.target.value,
                            })
                          }
                          placeholder="0x..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="platform">发行平台</Label>
                        <Select
                          value={strategyForm.platform}
                          onValueChange={(value) =>
                            setStrategyForm({ ...strategyForm, platform: value })
                          }
                        >
                          <SelectTrigger id="platform">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pump.fun">pump.fun</SelectItem>
                            <SelectItem value="four.meme">four.meme</SelectItem>
                            <SelectItem value="raydium">Raydium</SelectItem>
                            <SelectItem value="uniswap">Uniswap</SelectItem>
                            <SelectItem value="pancakeswap">PancakeSwap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="strategyType">策略类型</Label>
                        <Select
                          value={strategyForm.strategyType}
                          onValueChange={(value) =>
                            setStrategyForm({ ...strategyForm, strategyType: value })
                          }
                        >
                          <SelectTrigger id="strategyType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price_floor">托底买入</SelectItem>
                            <SelectItem value="bot_snipe">机器人狙击</SelectItem>
                            <SelectItem value="price_stabilization">价格稳定</SelectItem>
                            <SelectItem value="anti_dump">防砸盘</SelectItem>
                            <SelectItem value="comprehensive">综合策略</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>策略参数</Label>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="floorPricePercent" className="text-sm">
                            托底价格下限 (%)
                          </Label>
                          <Input
                            id="floorPricePercent"
                            type="number"
                            value={strategyForm.params.floorPricePercent}
                            onChange={(e) =>
                              setStrategyForm({
                                ...strategyForm,
                                params: {
                                  ...strategyForm.params,
                                  floorPricePercent: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="floorBuyAmount" className="text-sm">
                            每次托底买入数量
                          </Label>
                          <Input
                            id="floorBuyAmount"
                            type="number"
                            value={strategyForm.params.floorBuyAmount}
                            onChange={(e) =>
                              setStrategyForm({
                                ...strategyForm,
                                params: {
                                  ...strategyForm.params,
                                  floorBuyAmount: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="floorMaxBuy" className="text-sm">
                            最大托底买入总量
                          </Label>
                          <Input
                            id="floorMaxBuy"
                            type="number"
                            value={strategyForm.params.floorMaxBuy}
                            onChange={(e) =>
                              setStrategyForm({
                                ...strategyForm,
                                params: {
                                  ...strategyForm.params,
                                  floorMaxBuy: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="snipeThreshold" className="text-sm">
                            大额买入触发阈值
                          </Label>
                          <Input
                            id="snipeThreshold"
                            type="number"
                            value={strategyForm.params.snipeThreshold}
                            onChange={(e) =>
                              setStrategyForm({
                                ...strategyForm,
                                params: {
                                  ...strategyForm.params,
                                  snipeThreshold: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxSpend">最大花费限制</Label>
                        <Input
                          id="maxSpend"
                          type="number"
                          value={strategyForm.maxSpend}
                          onChange={(e) =>
                            setStrategyForm({ ...strategyForm, maxSpend: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stopLossPercent">止损百分比 (%)</Label>
                        <Input
                          id="stopLossPercent"
                          type="number"
                          value={strategyForm.stopLossPercent}
                          onChange={(e) =>
                            setStrategyForm({
                              ...strategyForm,
                              stopLossPercent: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="isEnabled">启用策略</Label>
                      <Switch
                        id="isEnabled"
                        checked={strategyForm.isEnabled}
                        onCheckedChange={(checked) =>
                          setStrategyForm({ ...strategyForm, isEnabled: checked })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        resetForm();
                      }}
                    >
                      取消
                    </Button>
                    <Button onClick={handleCreateStrategy} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          创建中...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          创建策略
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : strategies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无策略，点击"创建策略"按钮开始
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>策略名称</TableHead>
                  <TableHead>代币</TableHead>
                  <TableHead>平台</TableHead>
                  <TableHead>策略类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>统计</TableHead>
                  <TableHead>花费</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategies.map((strategy) => (
                  <TableRow key={strategy.id}>
                    <TableCell className="font-medium">{strategy.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{strategy.tokenSymbol}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getPlatformName(strategy.platform)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStrategyTypeIcon(strategy.strategyType)}
                        {getStrategyTypeName(strategy.strategyType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            strategy.status
                          )}`}
                        />
                        <Badge variant="secondary">{strategy.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>买入: {strategy.totalBuys || 0}次</div>
                        <div className="text-muted-foreground">
                          数量: {parseFloat(strategy.totalBuyAmount || '0').toFixed(0)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {parseFloat(strategy.totalSpent || '0').toFixed(2)}
                        <span className="text-muted-foreground ml-1">
                          / {strategy.maxSpend}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={strategy.isEnabled}
                          onCheckedChange={(checked) =>
                            handleToggleStrategy(strategy.id, checked)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExecuteStrategy(strategy.id)}
                          disabled={isExecuting === strategy.id || !strategy.isEnabled}
                        >
                          {isExecuting === strategy.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>删除策略</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除策略 "{strategy.name}" 吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStrategy(strategy.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 机器人检测日志 */}
      {showBotLogs && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>机器人检测日志</CardTitle>
                <CardDescription>检测到的可疑交易行为</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBotLogs(false)}
              >
                关闭
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {botLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无机器人检测记录
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>检测类型</TableHead>
                    <TableHead>钱包地址</TableHead>
                    <TableHead>置信度</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {botLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {getDetectionTypeName(log.detectionType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.walletAddress.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${log.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm">{log.confidence.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.details.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* 查看日志按钮 */}
      {!showBotLogs && botLogs.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setShowBotLogs(true)}>
            查看机器人检测日志 ({botLogs.length})
          </Button>
        </div>
      )}
    </div>
  );
}
