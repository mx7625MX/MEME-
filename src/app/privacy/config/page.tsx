'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { PrivacyLevel } from '@/services/privacy-protection/types';

export default function PrivacyConfigPage() {
  const router = useRouter();
  const [walletId, setWalletId] = useState<string>('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.MEDIUM);
  const [enableAutoPrivacy, setEnableAutoPrivacy] = useState(false);
  const [maxHops, setMaxHops] = useState(2);
  const [splitCount, setSplitCount] = useState(2);
  const [minDelay, setMinDelay] = useState(1);
  const [maxDelay, setMaxDelay] = useState(5);
  const [useRandomPath, setUseRandomPath] = useState(true);
  const [avoidKnownTracking, setAvoidKnownTracking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 从 URL 获取 walletId
    const params = new URLSearchParams(window.location.search);
    const walletParam = params.get('walletId');
    if (walletParam) {
      setWalletId(walletParam);
      fetchConfig(walletParam);
    }
  }, []);

  const fetchConfig = async (id: string) => {
    try {
      const response = await fetch(`/api/privacy/config?walletId=${id}`);
      const data = await response.json();
      if (data.privacyLevel) setPrivacyLevel(data.privacyLevel);
      if (data.enableAutoPrivacy !== undefined) setEnableAutoPrivacy(data.enableAutoPrivacy);
      if (data.maxHops) setMaxHops(data.maxHops);
      if (data.splitCount) setSplitCount(data.splitCount);
      if (data.minDelayMs) setMinDelay(Math.floor(data.minDelayMs / 1000));
      if (data.maxDelayMs) setMaxDelay(Math.floor(data.maxDelayMs / 1000));
      if (data.useRandomPath !== undefined) setUseRandomPath(data.useRandomPath);
      if (data.avoidKnownTracking !== undefined) setAvoidKnownTracking(data.avoidKnownTracking);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/privacy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId,
          privacyLevel,
          enableAutoPrivacy,
          maxHops,
          splitCount,
          minDelayMs: minDelay * 1000,
          maxDelayMs: maxDelay * 1000,
          useRandomPath,
          avoidKnownTracking,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const getPrivacyLevelColor = (level: PrivacyLevel) => {
    switch (level) {
      case 'LOW': return 'text-green-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'HIGH': return 'text-orange-500';
      case 'EXTREME': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPrivacyLevelDescription = (level: PrivacyLevel) => {
    switch (level) {
      case 'LOW': return '低级保护：直接转账，无隐私保护';
      case 'MEDIUM': return '中级保护：2跳中转，基本隐私保护';
      case 'HIGH': return '高级保护：4跳中转 + 拆分交易';
      case 'EXTREME': return '极端保护：6+跳 + 多次拆分 + 随机延迟';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-purple-400" />
          <h1 className="text-3xl font-bold">隐私保护配置</h1>
        </div>

        {/* 隐私级别选择 */}
        <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              隐私保护级别
            </CardTitle>
            <CardDescription>
              选择适合您的隐私保护级别，级别越高，转账路径越复杂，但费用和时间也相应增加
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className={`p-4 rounded-lg ${getPrivacyLevelColor(privacyLevel)} bg-slate-900/50`}>
              <p className="font-medium">{getPrivacyLevelDescription(privacyLevel)}</p>
              <p className="text-sm opacity-80 mt-1">
                当前隐私保护级别：{privacyLevel}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 高级配置 */}
        <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
          <CardHeader>
            <CardTitle>高级配置</CardTitle>
            <CardDescription>
              自定义隐私保护参数，如果您不确定，请使用默认值
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 最大跳数 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>最大中转跳数：{maxHops} 跳</Label>
                <span className="text-sm text-gray-400">推荐：2-6</span>
              </div>
              <Slider
                value={[maxHops]}
                onValueChange={(v) => setMaxHops(v[0])}
                min={0}
                max={10}
                step={1}
                className="bg-purple-500/20"
              />
              <p className="text-xs text-gray-400">
                跳数越多，隐私保护越强，但费用和时间也会增加
              </p>
            </div>

            {/* 拆分数量 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>拆分交易数量：{splitCount} 笔</Label>
                <span className="text-sm text-gray-400">推荐：2-8</span>
              </div>
              <Slider
                value={[splitCount]}
                onValueChange={(v) => setSplitCount(v[0])}
                min={1}
                max={16}
                step={1}
                className="bg-purple-500/20"
              />
              <p className="text-xs text-gray-400">
                将大额交易拆分成多笔小额交易，增加追踪难度
              </p>
            </div>

            {/* 随机延迟 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>最小延迟：{minDelay} 秒</Label>
                <Slider
                  value={[minDelay]}
                  onValueChange={(v) => setMinDelay(v[0])}
                  min={0}
                  max={60}
                  step={1}
                  className="bg-purple-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label>最大延迟：{maxDelay} 秒</Label>
                <Slider
                  value={[maxDelay]}
                  onValueChange={(v) => setMaxDelay(v[0])}
                  min={1}
                  max={300}
                  step={1}
                  className="bg-purple-500/20"
                />
              </div>
              <p className="col-span-2 text-xs text-gray-400">
                在每次跳转之间添加随机延迟，避免规律性交易模式
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 开关选项 */}
        <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
          <CardHeader>
            <CardTitle>保护选项</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base">自动隐私保护</Label>
                <p className="text-xs text-gray-400">
                  所有转账自动应用隐私保护策略
                </p>
              </div>
              <Switch
                checked={enableAutoPrivacy}
                onCheckedChange={setEnableAutoPrivacy}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base">使用随机路径</Label>
                <p className="text-xs text-gray-400">
                  随机选择中转路径，增加不可预测性
                </p>
              </div>
              <Switch
                checked={useRandomPath}
                onCheckedChange={setUseRandomPath}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base">避开已知追踪地址</Label>
                <p className="text-xs text-gray-400">
                  自动避免使用已知的追踪服务地址
                </p>
              </div>
              <Switch
                checked={avoidKnownTracking}
                onCheckedChange={setAvoidKnownTracking}
              />
            </div>
          </CardContent>
        </Card>

        {/* 警告信息 */}
        <Card className="mb-6 bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-yellow-500">重要提示</p>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>隐私保护功能会额外增加交易费用（每跳约 0.000005 SOL）</li>
                  <li>高隐私级别会显著增加转账时间（可能需要数分钟）</li>
                  <li>建议仅在需要时启用高级隐私保护</li>
                  <li>所有临时中转钱包将在 24 小时后自动清理</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {saving ? '保存中...' : saved ? '已保存 ✓' : '保存配置'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            返回
          </Button>
        </div>
      </div>
    </div>
  );
}
