'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, CheckCircle, Search, Eye, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrackingAnalysis {
  hasDirectLink: boolean;
  suspiciousPattern: boolean;
  riskScore: number;
  detectedChains: string[];
  warnings: string[];
}

interface WalletPrivacyReport {
  walletId: string;
  privacyScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trackingAnalysis: TrackingAnalysis;
  recommendations: string[];
  lastAnalyzed: Date;
}

export default function PrivacyAnalyzePage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<WalletPrivacyReport | null>(null);

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
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/privacy/analyze?walletId=${selectedWallet}`);
      const data = await response.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (error) {
      console.error('Failed to analyze wallet:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-500 border-green-500/30';
      case 'MEDIUM': return 'text-yellow-500 border-yellow-500/30';
      case 'HIGH': return 'text-orange-500 border-orange-500/30';
      case 'CRITICAL': return 'text-red-500 border-red-500/30';
      default: return 'text-gray-500 border-gray-500/30';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'MEDIUM': return <Info className="w-6 h-6 text-yellow-500" />;
      case 'HIGH': return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'CRITICAL': return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Eye className="w-10 h-10 text-purple-400" />
          <h1 className="text-3xl font-bold">钱包追踪分析</h1>
        </div>

        {/* 钱包选择 */}
        <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
          <CardHeader>
            <CardTitle>选择要分析的钱包</CardTitle>
            <CardDescription>
              分析钱包的追踪风险，获取隐私保护建议
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                <SelectTrigger className="flex-1 bg-slate-900/50 border-purple-500/30">
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
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !selectedWallet}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {analyzing ? '分析中...' : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    开始分析
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 分析结果 */}
        {report && (
          <>
            {/* 隐私评分 */}
            <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle>隐私评分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className={`p-6 rounded-lg border ${getRiskColor(report.riskLevel)} bg-slate-900/50`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400">隐私评分</span>
                      {getRiskIcon(report.riskLevel)}
                    </div>
                    <div className="text-5xl font-bold mb-2">{report.privacyScore}/100</div>
                    <div className={`text-lg font-semibold`}>
                      风险级别: {report.riskLevel}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">追踪风险评分</span>
                        <span className="text-2xl font-bold text-red-400">
                          {report.trackingAnalysis.riskScore}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            report.trackingAnalysis.riskScore < 40
                              ? 'bg-green-500'
                              : report.trackingAnalysis.riskScore < 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${report.trackingAnalysis.riskScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">最后分析时间</p>
                      <p className="font-medium">
                        {new Date(report.lastAnalyzed).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 追踪分析详情 */}
            <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle>追踪风险分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg bg-slate-900/50 flex items-center gap-3`}>
                    <Shield className={`w-8 h-8 ${report.trackingAnalysis.hasDirectLink ? 'text-red-500' : 'text-green-500'}`} />
                    <div>
                      <p className="text-sm text-gray-400">直接关联</p>
                      <p className={`font-semibold ${report.trackingAnalysis.hasDirectLink ? 'text-red-400' : 'text-green-400'}`}>
                        {report.trackingAnalysis.hasDirectLink ? '检测到' : '未检测到'}
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg bg-slate-900/50 flex items-center gap-3`}>
                    <AlertTriangle className={`w-8 h-8 ${report.trackingAnalysis.suspiciousPattern ? 'text-orange-500' : 'text-green-500'}`} />
                    <div>
                      <p className="text-sm text-gray-400">可疑模式</p>
                      <p className={`font-semibold ${report.trackingAnalysis.suspiciousPattern ? 'text-orange-400' : 'text-green-400'}`}>
                        {report.trackingAnalysis.suspiciousPattern ? '检测到' : '未检测到'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900/50 flex items-center gap-3">
                    <Info className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">跨链关联</p>
                      <p className="font-semibold text-purple-400">
                        {report.trackingAnalysis.detectedChains.length > 0
                          ? report.trackingAnalysis.detectedChains.join(', ')
                          : '未检测到'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 警告信息 */}
                {report.trackingAnalysis.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      风险警告
                    </h3>
                    {report.trackingAnalysis.warnings.map((warning, index) => (
                      <div key={index} className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-300">
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 隐私保护建议 */}
            <Card className="mb-6 bg-slate-800/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  隐私保护建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-900/10 border border-green-500/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button
                  onClick={() => window.location.href = `/privacy/config?walletId=${selectedWallet}`}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  配置隐私保护
                </Button>
                <Button
                  onClick={() => window.location.href = '/privacy/transfer'}
                  variant="outline"
                  className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                >
                  使用隐私转账
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
