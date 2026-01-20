'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  Zap, 
  TrendingUp, 
  Shield, 
  Brain, 
  AlertTriangle, 
  History, 
  Settings,
  Activity,
  Rocket,
  Flame,
  DollarSign,
  BarChart3,
  Loader2,
  RefreshCw,
  Send
} from 'lucide-react';

// API 基础路径
const API_BASE = '/api';

interface Wallet {
  id: string;
  name: string;
  chain: string;
  address: string;
  balance: string;
  isActive: boolean;
  createdAt: Date;
}

interface MarketData {
  id: string;
  tokenSymbol: string;
  price: string;
  change24h: string | null;
  volume24h: string | null;
  marketCap: string | null;
  isHot: boolean;
}

interface Stats {
  wallets: {
    total: number;
    active: number;
    byChain: Record<string, number>;
  };
  transactions: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalVolume: string;
  };
}

export default function MemeMasterPro() {
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline'>('online');
  const [isLoading, setIsLoading] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newWalletName, setNewWalletName] = useState('');
  const [selectedChain, setSelectedChain] = useState('solana');
  const [isCreatingWallet, setIsCreatingWallet] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 初始化数据
  useEffect(() => {
    initializeData();
  }, []);

  // 加载数据
  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      // 检查初始化状态
      const initRes = await fetch(`${API_BASE}/init`);
      const initData = await initRes.json();
      
      if (initData.success && !initData.data.initialized) {
        // 初始化示例数据
        await fetch(`${API_BASE}/init`, { method: 'POST' });
      }
      
      // 加载所有数据
      await Promise.all([
        loadWallets(),
        loadMarketData(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWallets = async () => {
    try {
      const res = await fetch(`${API_BASE}/wallets`);
      const data = await res.json();
      if (data.success) {
        setWallets(data.data);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      const res = await fetch(`${API_BASE}/market`);
      const data = await res.json();
      if (data.success) {
        setMarketData(data.data);
      }
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // 创建钱包
  const handleCreateWallet = async () => {
    if (!newWalletName) return;
    
    try {
      setIsCreatingWallet('creating');
      const res = await fetch(`${API_BASE}/wallets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWalletName, chain: selectedChain })
      });
      
      const data = await res.json();
      if (data.success) {
        setNewWalletName('');
        loadWallets();
        loadStats();
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setIsCreatingWallet('');
    }
  };

  // AI 情绪分析
  const handleAiAnalysis = async (tokenSymbol: string) => {
    try {
      setIsAnalyzing(true);
      const res = await fetch(`${API_BASE}/ai/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokenSymbol,
          context: `分析 ${tokenSymbol} 代币的市场情绪，包括价格走势、交易量、市场关注度等方面`
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setAiAnalysisResult(data.data);
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // SSE 实时数据流
  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE}/market/stream`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        setMarketData(data.data);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 顶部导航栏 */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Meme Master Pro</h1>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${systemStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-400">{systemStatus === 'online' ? '系统在线' : '系统离线'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-purple-500/50 text-purple-400">
              Web 版本 v2.0 - 完整集成
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-white"
              onClick={() => initializeData()}
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto p-4">
        {/* 统计数据卡片 */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">钱包数量</CardTitle>
              <Wallet className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.wallets.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{stats?.wallets.active || 0} 个活跃</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">总交易</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.transactions.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">总交易量</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">市场数据</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{marketData.length}</div>
              <p className="text-xs text-green-400 mt-1">实时更新</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">活跃链</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{Object.keys(stats?.wallets.byChain || {}).length}</div>
              <p className="text-xs text-gray-500 mt-1">支持多条链</p>
            </CardContent>
          </Card>
        </div>

        {/* 功能模块 Tab */}
        <Tabs defaultValue="dashboard" className="space-y-4" onValueChange={(v) => setActiveTab(v)}>
          <TabsList className="bg-black/20 border border-white/10 p-1 flex-wrap gap-1">
            <TabsTrigger value="dashboard">仪表盘</TabsTrigger>
            <TabsTrigger value="wallets">钱包管理</TabsTrigger>
            <TabsTrigger value="market">市场监控</TabsTrigger>
            <TabsTrigger value="sentiment">AI情绪分析</TabsTrigger>
          </TabsList>

          {/* 仪表盘 */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">欢迎使用 Meme Master Pro</CardTitle>
                <CardDescription className="text-gray-400">
                  一站式 Meme 代币管理平台 - 完整集成版本
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      已实现功能
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li>✅ PostgreSQL 数据库</li>
                      <li>✅ 钱包管理系统</li>
                      <li>✅ 区块链钱包生成</li>
                      <li>✅ 市场数据监控</li>
                      <li>✅ AI 情绪分析</li>
                      <li>✅ 实时价格更新</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      AI 智能分析
                    </h3>
                    <p className="text-sm text-gray-400">
                      集成大语言模型，实时分析市场情绪和趋势
                    </p>
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                      Doubao LLM 已集成
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      实时数据
                    </h3>
                    <p className="text-sm text-gray-400">
                      使用 SSE 技术实现实时价格推送，每 3 秒更新
                    </p>
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                      SSE 实时流已启动
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 钱包管理 */}
          <TabsContent value="wallets" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">钱包管理</CardTitle>
                <CardDescription className="text-gray-400">
                  管理多链钱包（Solana、BSC、ETH）- 支持创建新钱包
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-gray-400">钱包名称</Label>
                    <Input 
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="我的 Solana 钱包"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">选择链</Label>
                    <div className="flex gap-2 mt-1">
                      {['solana', 'bsc', 'eth'].map((chain) => (
                        <Button
                          key={chain}
                          variant={selectedChain === chain ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedChain(chain)}
                          className={selectedChain === chain ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/20 text-gray-300'}
                        >
                          {chain.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleCreateWallet}
                    disabled={isCreatingWallet === 'creating'}
                  >
                    {isCreatingWallet === 'creating' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        创建新钱包
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-white font-semibold">我的钱包</h3>
                  {wallets.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">暂无钱包，请创建新钱包</p>
                  ) : (
                    wallets.map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{wallet.name}</span>
                            <Badge variant={wallet.isActive ? 'default' : 'secondary'}>
                              {wallet.chain.toUpperCase()}
                            </Badge>
                            {wallet.isActive && (
                              <Badge className="bg-green-600">活跃</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{wallet.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">{wallet.balance}</p>
                          <p className="text-xs text-gray-500">余额</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 市场监控 */}
          <TabsContent value="market" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">市场监控</CardTitle>
                <CardDescription className="text-gray-400">
                  实时追踪 Meme 代币市场动态 - SSE 实时更新
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketData.map((token, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                          {token.tokenSymbol[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{token.tokenSymbol}</span>
                            {token.isHot && (
                              <Badge className="bg-red-500 hover:bg-red-600">
                                <Flame className="h-3 w-3 mr-1" />
                                热门
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                              实时
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            成交量: ${token.volume24h || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">${token.price}</p>
                        <p className={`text-sm ${token.change24h && parseFloat(token.change24h) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.change24h ? `${parseFloat(token.change24h) > 0 ? '+' : ''}${token.change24h}%` : '0%'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI 情绪分析 */}
          <TabsContent value="sentiment" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">AI 情绪分析</CardTitle>
                <CardDescription className="text-gray-400">
                  使用大语言模型分析市场情绪 - 集成 Doubao 模型
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    className="bg-black/50 border-white/10 text-white"
                    placeholder="输入代币符号，如 PEPE"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAiAnalysis((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="输入代币符号，如 PEPE"]') as HTMLInputElement;
                      if (input?.value) handleAiAnalysis(input.value);
                    }}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        分析
                      </>
                    )}
                  </Button>
                </div>
                
                {aiAnalysisResult && (
                  <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">{aiAnalysisResult.tokenSymbol} 情绪分析</h3>
                      <Badge 
                        variant="outline"
                        className={
                          aiAnalysisResult.sentiment === 'bullish' 
                            ? 'border-green-500/50 text-green-400' 
                            : aiAnalysisResult.sentiment === 'bearish'
                            ? 'border-red-500/50 text-red-400'
                            : 'border-gray-500/50 text-gray-400'
                        }
                      >
                        {aiAnalysisResult.sentiment === 'bullish' ? '看涨 📈' : 
                         aiAnalysisResult.sentiment === 'bearish' ? '看跌 📉' : '中性 ➡️'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">情绪评分</p>
                        <p className="text-lg font-bold text-white">{aiAnalysisResult.score}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">分析时间</p>
                        <p className="text-sm text-gray-300">
                          {new Date(aiAnalysisResult.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">分析结果</p>
                      <p className="text-white text-sm">{aiAnalysisResult.analysis}</p>
                    </div>
                  </div>
                )}
                
                {!aiAnalysisResult && !isAnalyzing && (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>输入代币符号开始 AI 情绪分析</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
