'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  BarChart3
} from 'lucide-react';

export default function MemeMasterPro() {
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline'>('online');

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
              Web 版本 v2.0
            </Badge>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Settings className="h-5 w-5" />
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
              <div className="text-2xl font-bold text-white">5</div>
              <p className="text-xs text-gray-500 mt-1">2 个活跃</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">活跃任务</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">3</div>
              <p className="text-xs text-gray-500 mt-1">进行中</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">总收益</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">$12,450</div>
              <p className="text-xs text-green-400 mt-1">+23.5% 本周</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">交易次数</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">156</div>
              <p className="text-xs text-gray-500 mt-1">今日</p>
            </CardContent>
          </Card>
        </div>

        {/* 功能模块 Tab */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-black/20 border border-white/10 p-1 flex-wrap gap-1">
            <TabsTrigger value="dashboard">仪表盘</TabsTrigger>
            <TabsTrigger value="wallets">钱包管理</TabsTrigger>
            <TabsTrigger value="launch">代币发行</TabsTrigger>
            <TabsTrigger value="market">市场监控</TabsTrigger>
            <TabsTrigger value="flashsell">闪电卖出</TabsTrigger>
            <TabsTrigger value="profit">收益分析</TabsTrigger>
            <TabsTrigger value="hotspot">热点追踪</TabsTrigger>
            <TabsTrigger value="mev">MEV保护</TabsTrigger>
            <TabsTrigger value="sentiment">AI情绪</TabsTrigger>
            <TabsTrigger value="autotrading">自动交易</TabsTrigger>
            <TabsTrigger value="alerts">风险预警</TabsTrigger>
            <TabsTrigger value="history">交易历史</TabsTrigger>
          </TabsList>

          {/* 仪表盘 */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">欢迎使用 Meme Master Pro</CardTitle>
                <CardDescription className="text-gray-400">
                  一站式 Meme 代币管理平台
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      快速操作
                    </h3>
                    <div className="space-y-2">
                      <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                        <Rocket className="mr-2 h-4 w-4" />
                        发行新代币
                      </Button>
                      <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        查看市场趋势
                      </Button>
                      <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                        <Wallet className="mr-2 h-4 w-4" />
                        管理钱包
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      AI 智能分析
                    </h3>
                    <p className="text-sm text-gray-400">
                      基于 AI 情绪分析和市场数据，智能推荐最佳交易机会
                    </p>
                    <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                      启动 AI 分析
                    </Button>
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
                  管理多链钱包（Solana、BSC、ETH）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Wallet className="mr-2 h-4 w-4" />
                      创建新钱包
                    </Button>
                    <Button variant="outline" className="border-white/20 text-gray-300">
                      导入现有钱包
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Solana 主钱包', balance: '1,234.56 SOL', address: '5x...k9P2', status: 'active' },
                      { name: 'BSC 钱包', balance: '2.5 ETH', address: '0x7a...3fB9', status: 'active' },
                      { name: '备用钱包', balance: '0', address: '0x3d...8cA1', status: 'inactive' }
                    ].map((wallet, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{wallet.name}</span>
                            <Badge variant={wallet.status === 'active' ? 'default' : 'secondary'}>
                              {wallet.status === 'active' ? '活跃' : '未激活'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{wallet.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">{wallet.balance}</p>
                          <p className="text-xs text-gray-500">余额</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 代币发行 */}
          <TabsContent value="launch" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">代币发行</CardTitle>
                <CardDescription className="text-gray-400">
                  一键在 Solana 或 BSC 链上发行代币
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-black/30 border-purple-500/50">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Solana 链</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-400">代币名称</label>
                          <input 
                            className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-md text-white"
                            placeholder="Meme Token"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">代币符号</label>
                          <input 
                            className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-md text-white"
                            placeholder="MEME"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">总供应量</label>
                          <input 
                            className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-md text-white"
                            placeholder="1,000,000,000"
                          />
                        </div>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          <Rocket className="mr-2 h-4 w-4" />
                          发行 Solana 代币
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/30 border-yellow-500/50">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">BSC 链</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-400">代币名称</label>
                          <input 
                            className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-md text-white"
                            placeholder="Meme Token"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">代币符号</label>
                          <input 
                            className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-md text-white"
                            placeholder="MEME"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">总供应量</label>
                          <input 
                            className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-md text-white"
                            placeholder="1,000,000,000"
                          />
                        </div>
                        <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                          <Rocket className="mr-2 h-4 w-4" />
                          发行 BSC 代币
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                  实时追踪 Meme 代币市场动态
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { symbol: 'PEPE', price: '$0.00001234', change: '+15.2%', volume: '$45.6M', hot: true },
                    { symbol: 'DOGE', price: '$0.0823', change: '+8.7%', volume: '$1.2B', hot: true },
                    { symbol: 'SHIB', price: '$0.0000245', change: '-2.3%', volume: '$890M', hot: false },
                    { symbol: 'WIF', price: '$3.45', change: '+25.6%', volume: '$123M', hot: true },
                    { symbol: 'BONK', price: '$0.0000189', change: '+5.4%', volume: '$67M', hot: false }
                  ].map((token, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{token.symbol}</span>
                            {token.hot && (
                              <Badge className="bg-red-500 hover:bg-red-600">
                                <Flame className="h-3 w-3 mr-1" />
                                热门
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">成交量: {token.volume}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{token.price}</p>
                        <p className={`text-sm ${token.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                          {token.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 其他功能模块 - 简化展示 */}
          {['flashsell', 'profit', 'hotspot', 'mev', 'sentiment', 'autotrading', 'alerts', 'history'].map((tab) => {
            const titles: Record<string, { title: string; desc: string; icon: any }> = {
              flashsell: { title: '闪电卖出', desc: '快速卖出代币，保护收益', icon: Zap },
              profit: { title: '收益分析', desc: '查看交易收益和统计数据', icon: DollarSign },
              hotspot: { title: '热点追踪', desc: '追踪社交媒体和市场热点', icon: Flame },
              mev: { title: 'MEV 保护', desc: '防止夹子攻击和抢跑', icon: Shield },
              sentiment: { title: 'AI 情绪分析', desc: '分析市场情绪和趋势', icon: Brain },
              autotrading: { title: '自动交易', desc: '配置自动化交易策略', icon: Activity },
              alerts: { title: '风险预警', desc: '实时风险监控和预警', icon: AlertTriangle },
              history: { title: '交易历史', desc: '查看所有交易记录', icon: History }
            };
            
            const { title, desc, icon: Icon } = titles[tab];
            
            return (
              <TabsContent key={tab} value={tab} className="space-y-4">
                <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Icon className="h-5 w-5 text-purple-400" />
                      {title}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Icon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">功能正在开发中...</p>
                      <p className="text-sm text-gray-500 mt-2">此模块将在后续版本中推出</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
}
