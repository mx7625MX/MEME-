'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Shield, CheckCircle, Clock, Zap, AlertTriangle, Info } from 'lucide-react';
import { PrivacyLevel, PrivacyTransferPath } from '@/services/privacy-protection/types';

export default function PrivacyTransferPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('SOL');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.MEDIUM);
  const [plannedPath, setPlannedPath] = useState<PrivacyTransferPath | null>(null);
  const [planning, setPlanning] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [transferResult, setTransferResult] = useState<any>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await fetch('/api/wallets');
      const data = await response.json();
      if (data.wallets) {
        setWallets(data.wallets);
        if (data.wallets.length > 0) {
          setSelectedWallet(data.wallets[0].id);
          setTokenSymbol(data.wallets[0].chain === 'solana' ? 'SOL' : data.wallets[0].chain === 'bsc' ? 'BNB' : 'ETH');
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    }
  };

  const handlePlan = async () => {
    setPlanning(true);
    try {
      const response = await fetch('/api/privacy/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWalletId: selectedWallet,
          toAddress,
          amount,
          tokenSymbol,
          chain: tokenSymbol,
          privacyLevel,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPlannedPath(data.path);
      }
    } catch (error) {
      console.error('Failed to plan transfer:', error);
    } finally {
      setPlanning(false);
    }
  };

  const handleExecute = async () => {
    setTransferring(true);
    setCurrentStep(0);
    try {
      const response = await fetch('/api/privacy/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWalletId: selectedWallet,
          toAddress,
          amount,
          tokenSymbol,
          chain: tokenSymbol,
          privacyLevel,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTransferResult(data.transfer);
        setCurrentStep(data.transfer.actualHops.length);
      }
    } catch (error) {
      console.error('Failed to execute transfer:', error);
    } finally {
      setTransferring(false);
    }
  };

  const getPrivacyColor = (level: PrivacyLevel) => {
    switch (level) {
      case 'LOW': return 'text-green-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'HIGH': return 'text-orange-500';
      case 'EXTREME': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-purple-400" />
          <h1 className="text-3xl font-bold">隐私保护转账</h1>
        </div>

        {!transferResult ? (
          <>
            {/* 转账表单 */}
            <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle>转账信息</CardTitle>
                <CardDescription>
                  填写转账详情，系统将自动规划隐私保护路径
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>源钱包</Label>
                    <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name} ({wallet.address.slice(0, 8)}...)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>代币</Label>
                    <Select value={tokenSymbol} onValueChange={setTokenSymbol}>
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOL">SOL</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="BNB">BNB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>目标地址</Label>
                  <Input
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="输入接收地址"
                    className="bg-slate-900/50 border-purple-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>转账金额</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`输入 ${tokenSymbol} 金额`}
                    className="bg-slate-900/50 border-purple-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>隐私级别</Label>
                  <Select value={privacyLevel} onValueChange={(v) => setPrivacyLevel(v as PrivacyLevel)}>
                    <SelectTrigger className="bg-slate-900/50 border-purple-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">LOW - 低级</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-500">MEDIUM - 中级（推荐）</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="HIGH">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-500">HIGH - 高级</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="EXTREME">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-500">EXTREME - 极端</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handlePlan}
                  disabled={planning || !toAddress || !amount}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {planning ? '规划中...' : '规划转账路径'}
                </Button>
              </CardContent>
            </Card>

            {/* 路径可视化 */}
            {plannedPath && (
              <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle>转账路径规划</CardTitle>
                  <CardDescription>
                    隐私评分：<span className={`font-bold ${getPrivacyColor(privacyLevel)}`}>
                      {plannedPath.privacyScore}/100
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 统计信息 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg text-center">
                      <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">总跳数</p>
                      <p className="text-2xl font-bold">{plannedPath.totalHops}</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg text-center">
                      <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">预计时间</p>
                      <p className="text-2xl font-bold">{plannedPath.estimatedTime}</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg text-center">
                      <Info className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">预计手续费</p>
                      <p className="text-2xl font-bold">{plannedPath.estimatedTotalFee} {tokenSymbol}</p>
                    </div>
                  </div>

                  {/* 路径可视化 */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">转账路径</h3>
                    {plannedPath.hops.map((hop, index) => (
                      <div key={index} className="relative">
                        <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">从</span>
                              <span className="font-mono text-sm">{hop.fromAddress.slice(0, 8)}...</span>
                              <ArrowRight className="w-4 h-4 text-purple-400" />
                              <span className="text-sm text-gray-400">到</span>
                              <span className="font-mono text-sm">{hop.toAddress.slice(0, 8)}...</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                              <span>金额: {hop.amount} {hop.tokenSymbol}</span>
                              <span>手续费: {hop.estimatedFee} {hop.tokenSymbol}</span>
                              {hop.delayMs && hop.delayMs > 0 && (
                                <span>延迟: {(hop.delayMs / 1000).toFixed(1)} 秒</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {index < plannedPath.hops.length - 1 && (
                          <div className="absolute left-4 top-16 w-px h-6 bg-purple-500/30" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 执行按钮 */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleExecute}
                      disabled={transferring}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {transferring ? '执行中...' : '执行隐私转账'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPlannedPath(null)}
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      重新规划
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 警告信息 */}
            <Card className="bg-yellow-900/20 border-yellow-500/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-yellow-500">重要提示</p>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>隐私转账将通过多个临时中转钱包进行，可能需要数分钟完成</li>
                      <li>每次跳转都会产生额外的 Gas 费用</li>
                      <li>系统将自动创建临时钱包，转账完成后这些钱包将被保留 24 小时</li>
                      <li>请确保目标地址正确，隐私转账一旦开始无法撤销</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* 转账结果 */
          <Card className="bg-slate-800/50 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                转账完成
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium">隐私保护转账已成功完成！</p>
                <p className="text-sm text-gray-400 mt-2">
                  转账 ID: {transferResult.transferId}
                </p>
                <p className="text-sm text-gray-400">
                  隐私评分: {transferResult.privacyScore}/100
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">执行详情</h3>
                {transferResult.actualHops.map((hop: any, index: number) => (
                  <div key={index} className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">跳 {index + 1}:</span>
                      <span className="font-mono">{hop.fromAddress.slice(0, 8)}... → {hop.toAddress.slice(0, 8)}...</span>
                      <span className="text-purple-400">{hop.amount} {hop.tokenSymbol}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                返回仪表盘
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
