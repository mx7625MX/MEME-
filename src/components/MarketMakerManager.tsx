'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Loader2,
  TrendingUp,
  Shield,
  Activity,
  Zap,
  RefreshCw,
  Users,
  ArrowRight,
  Package,
  Wallet,
  CheckCircle2,
  AlertCircle,
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
  totalSpent: string;
  maxSpend: string;
  createdAt: Date;
}

interface Wallet {
  id: string;
  name: string;
  chain: string;
  address: string;
  balance: string;
}

export function MarketMakerManager() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // 批量操作相关状态
  const [activeBatchTab, setActiveBatchTab] = useState<'create-wallets' | 'batch-buy' | 'batch-collect' | 'batch-sell'>('create-wallets');
  const [isBatchOperating, setIsBatchOperating] = useState(false);
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [batchResult, setBatchResult] = useState<any>(null);
  const [showBatchResult, setShowBatchResult] = useState(false);

  // 批量创建钱包表单
  const [batchCreateForm, setBatchCreateForm] = useState({
    count: 10,
    chain: 'solana',
    prefix: 'MM'
  });

  // 批量买入表单
  const [batchBuyForm, setBatchBuyForm] = useState({
    tokenSymbol: '',
    tokenAddress: '',
    buyAmountPerWallet: '100',
    price: '0.000001',
    chain: 'solana'
  });

  // 批量归集表单
  const [batchCollectForm, setBatchCollectForm] = useState({
    targetWalletId: '',
    tokenSymbol: '',
    tokenAddress: '',
    chain: 'solana'
  });

  // 批量卖出表单
  const [batchSellForm, setBatchSellForm] = useState({
    tokenSymbol: '',
    tokenAddress: '',
    sellPercentage: 100,
    currentPrice: '0.000002',
    chain: 'solana'
  });

  const [strategyForm, setStrategyForm] = useState({
    name: '',
    walletId: '',
    tokenSymbol: '',
    tokenAddress: '',
    platform: 'pump.fun',
    strategyType: 'price_floor',
    isEnabled: true,
    maxSpend: '100',
    // 简化的策略参数
    param1: '1000', // 买入数量/阈值等
    param2: '50', // 百分比等
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

  // 批量创建钱包
  const handleBatchCreateWallets = async () => {
    if (!batchCreateForm.count || batchCreateForm.count <= 0) {
      alert('请输入有效的钱包数量');
      return;
    }

    setIsBatchOperating(true);
    setBatchResult(null);

    try {
      const res = await fetch(`${API_BASE}/batch-create-wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchCreateForm),
      });

      const data = await res.json();
      setBatchResult(data);
      setShowBatchResult(true);

      if (data.success) {
        await loadWallets();
      }
    } catch (error) {
      setBatchResult({ success: false, error: '批量创建失败' });
      setShowBatchResult(true);
    } finally {
      setIsBatchOperating(false);
    }
  };

  // 批量买入
  const handleBatchBuy = async () => {
    if (selectedWallets.size === 0) {
      alert('请至少选择一个钱包');
      return;
    }
    if (!batchBuyForm.tokenAddress || !batchBuyForm.buyAmountPerWallet) {
      alert('请填写必填字段');
      return;
    }

    setIsBatchOperating(true);
    setBatchResult(null);

    try {
      const res = await fetch(`${API_BASE}/batch-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...batchBuyForm,
          walletIds: Array.from(selectedWallets),
        }),
      });

      const data = await res.json();
      setBatchResult(data);
      setShowBatchResult(true);
    } catch (error) {
      setBatchResult({ success: false, error: '批量买入失败' });
      setShowBatchResult(true);
    } finally {
      setIsBatchOperating(false);
    }
  };

  // 批量归集
  const handleBatchCollect = async () => {
    if (selectedWallets.size === 0) {
      alert('请至少选择一个钱包');
      return;
    }
    if (!batchCollectForm.targetWalletId || !batchCollectForm.tokenAddress) {
      alert('请填写必填字段');
      return;
    }

    setIsBatchOperating(true);
    setBatchResult(null);

    try {
      const res = await fetch(`${API_BASE}/batch-collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...batchCollectForm,
          walletIds: Array.from(selectedWallets),
        }),
      });

      const data = await res.json();
      setBatchResult(data);
      setShowBatchResult(true);

      if (data.success) {
        await loadWallets();
      }
    } catch (error) {
      setBatchResult({ success: false, error: '批量归集失败' });
      setShowBatchResult(true);
    } finally {
      setIsBatchOperating(false);
    }
  };

  // 批量卖出
  const handleBatchSell = async () => {
    if (selectedWallets.size === 0) {
      alert('请至少选择一个钱包');
      return;
    }
    if (!batchSellForm.tokenAddress) {
      alert('请填写必填字段');
      return;
    }

    setIsBatchOperating(true);
    setBatchResult(null);

    try {
      const res = await fetch(`${API_BASE}/batch-sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...batchSellForm,
          walletIds: Array.from(selectedWallets),
        }),
      });

      const data = await res.json();
      setBatchResult(data);
      setShowBatchResult(true);

      if (data.success) {
        await loadWallets();
      }
    } catch (error) {
      setBatchResult({ success: false, error: '批量卖出失败' });
      setShowBatchResult(true);
    } finally {
      setIsBatchOperating(false);
    }
  };

  // 切换钱包选择
  const toggleWalletSelection = (walletId: string) => {
    const newSelected = new Set(selectedWallets);
    if (newSelected.has(walletId)) {
      newSelected.delete(walletId);
    } else {
      newSelected.add(walletId);
    }
    setSelectedWallets(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedWallets.size === wallets.length) {
      setSelectedWallets(new Set());
    } else {
      setSelectedWallets(new Set(wallets.map(w => w.id)));
    }
  };

  useEffect(() => {
    loadStrategies();
    loadWallets();
  }, []);

  // 创建策略
  const handleCreateStrategy = async () => {
    if (!strategyForm.name || !strategyForm.walletId || !strategyForm.tokenSymbol) {
      alert('请填写必填字段');
      return;
    }

    try {
      setIsCreating(true);
      
      // 根据策略类型构建参数
      const params: any = {};
      if (strategyForm.strategyType === 'price_floor') {
        params.floorPricePercent = strategyForm.param2;
        params.floorBuyAmount = strategyForm.param1;
        params.floorMaxBuy = '10000';
      } else if (strategyForm.strategyType === 'bot_snipe') {
        params.snipeEnabled = true;
        params.snipeAmount = strategyForm.param1;
        params.snipeThreshold = strategyForm.param2;
      } else if (strategyForm.strategyType === 'price_stabilization') {
        params.stabilizationEnabled = true;
        params.stabilizationAmount = strategyForm.param1;
        params.stabilizationTargetGrowth = strategyForm.param2;
      } else if (strategyForm.strategyType === 'anti_dump') {
        params.antiDumpEnabled = true;
        params.antiDumpAmount = strategyForm.param1;
        params.dumpThreshold = strategyForm.param2;
      }

      const res = await fetch(`${API_BASE}/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...strategyForm,
          params,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setShowCreateDialog(false);
        resetForm();
        loadStrategies();
        alert('策略创建成功！');
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
        alert('策略执行成功！');
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
        alert('策略删除成功！');
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Error deleting strategy:', error);
      alert('删除失败');
    }
  };

  // 重置表单
  const resetForm = () => {
    setStrategyForm({
      name: '',
      walletId: '',
      tokenSymbol: '',
      tokenAddress: '',
      platform: 'pump.fun',
      strategyType: 'price_floor',
      isEnabled: true,
      maxSpend: '100',
      param1: '1000',
      param2: '50',
    });
  };

  // 获取策略类型信息
  const getStrategyTypeInfo = (type: string) => {
    const types: Record<string, { name: string; icon: React.ReactNode; color: string; desc: string }> = {
      price_floor: {
        name: '托底买入',
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        desc: '价格下跌时自动买入托底'
      },
      bot_snipe: {
        name: '机器人狙击',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        desc: '跟随大额买入快速买入'
      },
      price_stabilization: {
        name: '价格稳定',
        icon: <Activity className="w-4 h-4" />,
        color: 'text-green-500 bg-green-500/10 border-green-500/20',
        desc: '定期买入稳定价格'
      },
      anti_dump: {
        name: '防砸盘',
        icon: <Shield className="w-4 h-4" />,
        color: 'text-red-500 bg-red-500/10 border-red-500/20',
        desc: '大额卖出时反向买入'
      },
    };
    return types[type] || { name: type, icon: null, color: '', desc: '' };
  };

  // 获取参数标签
  const getParamLabels = (type: string) => {
    const labels: Record<string, { param1: string; param2: string }> = {
      price_floor: {
        param1: '每次买入数量',
        param2: '价格下限 (%)',
      },
      bot_snipe: {
        param1: '买入数量',
        param2: '触发阈值 (SOL)',
      },
      price_stabilization: {
        param1: '每次买入数量',
        param2: '目标增长率 (%)',
      },
      anti_dump: {
        param1: '反制买入数量',
        param2: '卖出阈值 (代币)',
      },
    };
    return labels[type] || { param1: '参数1', param2: '参数2' };
  };

  const selectedWallet = wallets.find(w => w.id === strategyForm.walletId);
  const strategyTypeInfo = getStrategyTypeInfo(strategyForm.strategyType);
  const paramLabels = getParamLabels(strategyForm.strategyType);

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">做市值策略</h2>
          <p className="text-gray-400 text-sm">自动管理代币价格，防止砸盘</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          创建策略
        </Button>
      </div>

      {/* 策略统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/20 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">总策略数</p>
                <p className="text-2xl font-bold text-white">{strategies.length}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">启用中</p>
                <p className="text-2xl font-bold text-green-400">
                  {strategies.filter(s => s.isEnabled).length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">总花费</p>
                <p className="text-2xl font-bold text-white">
                  {strategies.reduce((sum, s) => sum + parseFloat(s.totalSpent || '0'), 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">执行次数</p>
                <p className="text-2xl font-bold text-white">
                  {strategies.reduce((sum, s) => sum + (s.totalBuys || 0), 0)}
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 策略和批量操作 Tabs */}
      <Tabs defaultValue="strategies" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-black/30 border border-white/10">
          <TabsTrigger value="strategies" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            策略管理
          </TabsTrigger>
          <TabsTrigger value="create-wallets" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            批量创建钱包
          </TabsTrigger>
          <TabsTrigger value="batch-buy" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            批量买入
          </TabsTrigger>
          <TabsTrigger value="batch-collect" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            批量归集
          </TabsTrigger>
          <TabsTrigger value="batch-sell" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            批量卖出
          </TabsTrigger>
        </TabsList>

        {/* 策略管理 */}
        <TabsContent value="strategies" className="mt-4">
          {/* 策略列表 */}
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">策略列表</CardTitle>
                  <CardDescription className="text-gray-400">
                    管理您的做市值策略
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadStrategies();
                    loadWallets();
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              ) : strategies.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">暂无策略</p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    variant="outline"
                  >
                    创建第一个策略
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {strategies.map((strategy) => {
                    const info = getStrategyTypeInfo(strategy.strategyType);
                    return (
                      <Card
                        key={strategy.id}
                        className={`bg-black/30 border ${
                          strategy.isEnabled ? 'border-purple-500/30' : 'border-white/10'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${info.color}`}>
                                  {info.icon}
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white">
                                    {strategy.name}
                              </h3>
                              <p className="text-sm text-gray-400">{info.desc}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="secondary">{info.name}</Badge>
                            <Badge variant="outline">{strategy.platform}</Badge>
                            <Badge variant="outline">{strategy.tokenSymbol}</Badge>
                            {strategy.isEnabled ? (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                运行中
                              </Badge>
                            ) : (
                              <Badge variant="secondary">已暂停</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">总花费</p>
                              <p className="text-white font-semibold">
                                {parseFloat(strategy.totalSpent || '0').toFixed(2)} / {strategy.maxSpend}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">执行次数</p>
                              <p className="text-white font-semibold">{strategy.totalBuys || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">创建时间</p>
                              <p className="text-white font-semibold">
                                {new Date(strategy.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={strategy.isEnabled}
                            onCheckedChange={(checked) =>
                              handleToggleStrategy(strategy.id, checked)
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExecuteStrategy(strategy.id)}
                            disabled={
                              isExecuting === strategy.id || !strategy.isEnabled
                            }
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
                                <Trash2 className="w-4 h-4 text-red-400" />
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
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* 批量创建钱包 */}
        <TabsContent value="create-wallets" className="mt-4">
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <div>
                <CardTitle className="text-white">批量创建钱包</CardTitle>
                <CardDescription className="text-gray-400">
                  快速创建多个做市值钱包
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>创建数量 *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={batchCreateForm.count}
                      onChange={(e) => setBatchCreateForm({ ...batchCreateForm, count: parseInt(e.target.value) || 1 })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>链 *</Label>
                    <Select
                      value={batchCreateForm.chain}
                      onValueChange={(value) => setBatchCreateForm({ ...batchCreateForm, chain: value })}
                    >
                      <SelectTrigger className="bg-black/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solana">Solana</SelectItem>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>钱包前缀</Label>
                  <Input
                    placeholder="MM"
                    value={batchCreateForm.prefix}
                    onChange={(e) => setBatchCreateForm({ ...batchCreateForm, prefix: e.target.value })}
                    className="bg-black/50 border-white/10"
                  />
                </div>
                <Button
                  onClick={handleBatchCreateWallets}
                  disabled={isBatchOperating}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isBatchOperating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      批量创建钱包
                    </>
                  )}
                </Button>
              </div>

              {batchResult && showBatchResult && (
                <div className={`p-4 rounded-lg border ${batchResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-start gap-2">
                    {batchResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${batchResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {batchResult.success ? '创建成功' : '创建失败'}
                      </p>
                      {batchResult.data && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-300">
                            成功创建: {batchResult.data.successCount} 个钱包
                          </p>
                          <p className="text-sm text-gray-300">
                            失败: {batchResult.data.failedCount} 个钱包
                          </p>
                          {batchResult.data.wallets && batchResult.data.wallets.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                                查看创建的钱包列表
                              </summary>
                              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {batchResult.data.wallets.map((wallet: any, idx: number) => (
                                  <div key={idx} className="text-xs text-gray-300 flex justify-between">
                                    <span>{wallet.name}: {wallet.address}</span>
                                    <Badge variant="outline" className="text-xs">{wallet.chain}</Badge>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                      {batchResult.error && (
                        <p className="text-sm text-red-300 mt-1">{batchResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 批量买入 */}
        <TabsContent value="batch-buy" className="mt-4">
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <div>
                <CardTitle className="text-white">批量买入</CardTitle>
                <CardDescription className="text-gray-400">
                  使用多个钱包同时买入指定代币
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 钱包选择 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>选择钱包 *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedWallets.size === wallets.length ? '取消全选' : '全选'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-black/30 rounded-lg">
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      onClick={() => toggleWalletSelection(wallet.id)}
                      className={`p-2 rounded cursor-pointer border transition-all ${
                        selectedWallets.has(wallet.id)
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-black/50 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedWallets.has(wallet.id)}
                          disabled
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{wallet.name}</p>
                          <p className="text-xs text-gray-400 truncate">{wallet.address.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">已选择 {selectedWallets.size} 个钱包</p>
              </div>

              {/* 买入参数 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>代币符号 *</Label>
                    <Input
                      placeholder="PEPE"
                      value={batchBuyForm.tokenSymbol}
                      onChange={(e) => setBatchBuyForm({ ...batchBuyForm, tokenSymbol: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>代币地址 *</Label>
                    <Input
                      placeholder="0x..."
                      value={batchBuyForm.tokenAddress}
                      onChange={(e) => setBatchBuyForm({ ...batchBuyForm, tokenAddress: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>每钱包买入金额 *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="100"
                      value={batchBuyForm.buyAmountPerWallet}
                      onChange={(e) => setBatchBuyForm({ ...batchBuyForm, buyAmountPerWallet: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>代币价格 *</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="0.000001"
                      value={batchBuyForm.price}
                      onChange={(e) => setBatchBuyForm({ ...batchBuyForm, price: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>链 *</Label>
                  <Select
                    value={batchBuyForm.chain}
                    onValueChange={(value) => setBatchBuyForm({ ...batchBuyForm, chain: value })}
                  >
                    <SelectTrigger className="bg-black/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solana">Solana</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleBatchBuy}
                  disabled={isBatchOperating || selectedWallets.size === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isBatchOperating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      买入中...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      批量买入 ({selectedWallets.size} 个钱包)
                    </>
                  )}
                </Button>
              </div>

              {batchResult && showBatchResult && (
                <div className={`p-4 rounded-lg border ${batchResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-start gap-2">
                    {batchResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${batchResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {batchResult.success ? '批量买入成功' : '批量买入失败'}
                      </p>
                      {batchResult.data && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-300">
                            成功: {batchResult.data.successCount} 笔
                          </p>
                          <p className="text-sm text-gray-300">
                            失败: {batchResult.data.failedCount} 笔
                          </p>
                        </div>
                      )}
                      {batchResult.error && (
                        <p className="text-sm text-red-300 mt-1">{batchResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 批量归集 */}
        <TabsContent value="batch-collect" className="mt-4">
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <div>
                <CardTitle className="text-white">批量归集</CardTitle>
                <CardDescription className="text-gray-400">
                  将多个钱包的代币归集到一个目标钱包
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 目标钱包 */}
              <div className="space-y-2">
                <Label>目标钱包 *</Label>
                <Select
                  value={batchCollectForm.targetWalletId}
                  onValueChange={(value) => setBatchCollectForm({ ...batchCollectForm, targetWalletId: value })}
                >
                  <SelectTrigger className="bg-black/50 border-white/10">
                    <SelectValue placeholder="选择目标钱包" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} - {wallet.address.slice(0, 8)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 源钱包选择 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>选择源钱包 *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedWallets.size === wallets.length ? '取消全选' : '全选'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-black/30 rounded-lg">
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      onClick={() => toggleWalletSelection(wallet.id)}
                      className={`p-2 rounded cursor-pointer border transition-all ${
                        selectedWallets.has(wallet.id)
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-black/50 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedWallets.has(wallet.id)}
                          disabled
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{wallet.name}</p>
                          <p className="text-xs text-gray-400 truncate">{wallet.address.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">已选择 {selectedWallets.size} 个源钱包</p>
              </div>

              {/* 归集参数 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>代币符号 *</Label>
                    <Input
                      placeholder="PEPE"
                      value={batchCollectForm.tokenSymbol}
                      onChange={(e) => setBatchCollectForm({ ...batchCollectForm, tokenSymbol: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>代币地址 *</Label>
                    <Input
                      placeholder="0x..."
                      value={batchCollectForm.tokenAddress}
                      onChange={(e) => setBatchCollectForm({ ...batchCollectForm, tokenAddress: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>链 *</Label>
                  <Select
                    value={batchCollectForm.chain}
                    onValueChange={(value) => setBatchCollectForm({ ...batchCollectForm, chain: value })}
                  >
                    <SelectTrigger className="bg-black/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solana">Solana</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleBatchCollect}
                  disabled={isBatchOperating || selectedWallets.size === 0 || !batchCollectForm.targetWalletId}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isBatchOperating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      归集中...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      批量归集 ({selectedWallets.size} 个钱包)
                    </>
                  )}
                </Button>
              </div>

              {batchResult && showBatchResult && (
                <div className={`p-4 rounded-lg border ${batchResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-start gap-2">
                    {batchResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${batchResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {batchResult.success ? '批量归集成功' : '批量归集失败'}
                      </p>
                      {batchResult.data && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-300">
                            成功: {batchResult.data.successCount} 笔
                          </p>
                          <p className="text-sm text-gray-300">
                            失败: {batchResult.data.failedCount} 笔
                          </p>
                        </div>
                      )}
                      {batchResult.error && (
                        <p className="text-sm text-red-300 mt-1">{batchResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 批量卖出 */}
        <TabsContent value="batch-sell" className="mt-4">
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <div>
                <CardTitle className="text-white">批量卖出</CardTitle>
                <CardDescription className="text-gray-400">
                  使用多个钱包同时卖出指定代币
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 钱包选择 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>选择钱包 *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedWallets.size === wallets.length ? '取消全选' : '全选'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-black/30 rounded-lg">
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      onClick={() => toggleWalletSelection(wallet.id)}
                      className={`p-2 rounded cursor-pointer border transition-all ${
                        selectedWallets.has(wallet.id)
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-black/50 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedWallets.has(wallet.id)}
                          disabled
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{wallet.name}</p>
                          <p className="text-xs text-gray-400 truncate">{wallet.address.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">已选择 {selectedWallets.size} 个钱包</p>
              </div>

              {/* 卖出参数 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>代币符号 *</Label>
                    <Input
                      placeholder="PEPE"
                      value={batchSellForm.tokenSymbol}
                      onChange={(e) => setBatchSellForm({ ...batchSellForm, tokenSymbol: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>代币地址 *</Label>
                    <Input
                      placeholder="0x..."
                      value={batchSellForm.tokenAddress}
                      onChange={(e) => setBatchSellForm({ ...batchSellForm, tokenAddress: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>卖出比例: {batchSellForm.sellPercentage}%</Label>
                  <Slider
                    value={[batchSellForm.sellPercentage]}
                    onValueChange={(value) => setBatchSellForm({ ...batchSellForm, sellPercentage: value[0] })}
                    max={100}
                    min={1}
                    step={1}
                    className="py-4"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>当前价格 *</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="0.000002"
                      value={batchSellForm.currentPrice}
                      onChange={(e) => setBatchSellForm({ ...batchSellForm, currentPrice: e.target.value })}
                      className="bg-black/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>链 *</Label>
                    <Select
                      value={batchSellForm.chain}
                      onValueChange={(value) => setBatchSellForm({ ...batchSellForm, chain: value })}
                    >
                      <SelectTrigger className="bg-black/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solana">Solana</SelectItem>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleBatchSell}
                  disabled={isBatchOperating || selectedWallets.size === 0}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isBatchOperating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      卖出中...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      批量卖出 ({selectedWallets.size} 个钱包)
                    </>
                  )}
                </Button>
              </div>

              {batchResult && showBatchResult && (
                <div className={`p-4 rounded-lg border ${batchResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-start gap-2">
                    {batchResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${batchResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {batchResult.success ? '批量卖出成功' : '批量卖出失败'}
                      </p>
                      {batchResult.data && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-300">
                            成功: {batchResult.data.successCount} 笔
                          </p>
                          <p className="text-sm text-gray-300">
                            失败: {batchResult.data.failedCount} 笔
                          </p>
                        </div>
                      )}
                      {batchResult.error && (
                        <p className="text-sm text-red-300 mt-1">{batchResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 创建策略对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-black/90 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建做市值策略</DialogTitle>
            <DialogDescription className="text-gray-400">
              配置自动做市值参数，保护代币价格
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>策略名称 *</Label>
                <Input
                  placeholder="托底策略-PEPE"
                  value={strategyForm.name}
                  onChange={(e) => setStrategyForm({ ...strategyForm, name: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>选择钱包 *</Label>
                <Select
                  value={strategyForm.walletId}
                  onValueChange={(value) => setStrategyForm({ ...strategyForm, walletId: value })}
                >
                  <SelectTrigger className="bg-black/50 border-white/10">
                    <SelectValue placeholder="选择钱包" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.chain.toUpperCase()}) - {wallet.balance}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>代币符号 *</Label>
                <Input
                  placeholder="PEPE"
                  value={strategyForm.tokenSymbol}
                  onChange={(e) => setStrategyForm({ ...strategyForm, tokenSymbol: e.target.value.toUpperCase() })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>代币地址（可选）</Label>
                <Input
                  placeholder="0x..."
                  value={strategyForm.tokenAddress}
                  onChange={(e) => setStrategyForm({ ...strategyForm, tokenAddress: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
            </div>

            {/* 策略类型 */}
            <div className="space-y-3">
              <Label>策略类型 *</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['price_floor', 'bot_snipe', 'price_stabilization', 'anti_dump'] as const).map((type) => {
                  const info = getStrategyTypeInfo(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setStrategyForm({ ...strategyForm, strategyType: type })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        strategyForm.strategyType === type
                          ? `${info.color} border-current`
                          : 'border-white/10 hover:border-white/20 bg-black/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {info.icon}
                        <span className="font-semibold text-white">{info.name}</span>
                      </div>
                      <p className="text-xs text-gray-400">{info.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 平台和最大花费 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>发行平台</Label>
                <Select
                  value={strategyForm.platform}
                  onValueChange={(value) => setStrategyForm({ ...strategyForm, platform: value })}
                >
                  <SelectTrigger className="bg-black/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pump.fun">pump.fun</SelectItem>
                    <SelectItem value="four.meme">four.meme</SelectItem>
                    <SelectItem value="raydium">Raydium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>最大花费 (SOL)</Label>
                <Input
                  type="number"
                  value={strategyForm.maxSpend}
                  onChange={(e) => setStrategyForm({ ...strategyForm, maxSpend: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
            </div>

            {/* 策略参数 */}
            <div className="space-y-4 p-4 bg-black/30 rounded-lg border border-white/10">
              <div className="flex items-center gap-2">
                {strategyTypeInfo.icon}
                <Label className="text-white font-semibold">{strategyTypeInfo.name}参数</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">{paramLabels.param1}</Label>
                  <Input
                    type="number"
                    value={strategyForm.param1}
                    onChange={(e) => setStrategyForm({ ...strategyForm, param1: e.target.value })}
                    className="bg-black/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">{paramLabels.param2}</Label>
                  <Input
                    type="number"
                    value={strategyForm.param2}
                    onChange={(e) => setStrategyForm({ ...strategyForm, param2: e.target.value })}
                    className="bg-black/50 border-white/10"
                  />
                </div>
              </div>
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
            <Button
              onClick={handleCreateStrategy}
              disabled={isCreating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建策略'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
