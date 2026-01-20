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
  Send,
  Users,
  Star,
  CheckCircle,
  Search,
  Filter,
  Copy,
  Trash2,
  Plus
} from 'lucide-react';

import { INFLUENCERS, Influencer, INFLUENCERS_BY_CATEGORY, searchInfluencers } from '@/config/influencers';

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
  
  // 智能发现相关状态
  const [discoverContent, setDiscoverContent] = useState('');
  const [discoverResult, setDiscoverResult] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  
  // 发币相关状态
  const [launchForm, setLaunchForm] = useState({
    walletId: '',
    tokenName: '',
    tokenSymbol: '',
    totalSupply: '',
    liquidity: '',
    imageUrl: '',
    imageKey: ''
  });
  const [isLaunching, setIsLaunching] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // 闪电卖出相关状态
  const [sellForm, setSellForm] = useState({
    walletId: '',
    tokenAddress: '',
    tokenSymbol: '',
    amount: '',
    slippage: '5'
  });
  const [isSelling, setIsSelling] = useState(false);
  
  // 持仓管理相关状态
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [isSyncingPortfolios, setIsSyncingPortfolios] = useState(false);
  const [addPortfolioForm, setAddPortfolioForm] = useState({
    walletId: '',
    tokenAddress: '',
    tokenSymbol: '',
    tokenName: '',
    amount: '',
    buyPrice: '',
    buyAmount: '',
    profitTarget: '',
    stopLoss: ''
  });
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  
  // 转账相关状态
  const [transferForm, setTransferForm] = useState({
    walletId: '',
    toAddress: '',
    tokenSymbol: '',
    amount: '',
    isNative: true
  });
  const [isTransferring, setIsTransferring] = useState(false);
  
  // 交易历史
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // 自动交易配置
  const [autoTrades, setAutoTrades] = useState<any[]>([]);
  const [autoTradeForm, setAutoTradeForm] = useState({
    walletId: '',
    name: '',
    chain: 'solana',
    tradeType: 'buy',
    condition: 'price_above',
    conditionValue: '',
    amount: '',
    slippage: '5'
  });
  const [isCreatingAutoTrade, setIsCreatingAutoTrade] = useState(false);

  // 大V相关状态
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [influencerSearch, setInfluencerSearch] = useState('');
  const [showInfluencers, setShowInfluencers] = useState(true);
  const [followedInfluencers, setFollowedInfluencers] = useState<Set<string>>(new Set());

  // 大V内容获取相关状态
  const [fetchingInfluencer, setFetchingInfluencer] = useState<string | null>(null);
  const [influencerAnalysis, setInfluencerAnalysis] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // 钱包地址显示相关状态
  const [showFullAddress, setShowFullAddress] = useState<Record<string, boolean>>({});
  const [copiedAddress, setCopiedAddress] = useState<Record<string, boolean>>({});

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
        loadStats(),
        loadTransactions(),
        loadAutoTrades(),
        loadPortfolios()
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
  
  const loadTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };
  
  const loadAutoTrades = async () => {
    try {
      const res = await fetch(`${API_BASE}/auto-trades`);
      const data = await res.json();
      if (data.success) {
        setAutoTrades(data.data);
      }
    } catch (error) {
      console.error('Error loading auto trades:', error);
    }
  };
  
  const loadPortfolios = async () => {
    try {
      const res = await fetch(`${API_BASE}/portfolios`);
      const data = await res.json();
      if (data.success) {
        setPortfolios(data.data);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
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

  // 删除钱包
  const handleDeleteWallet = async (walletId: string) => {
    // 确认删除
    const confirmed = confirm('确定要删除这个钱包吗？删除后无法恢复。');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/wallets/${walletId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      if (data.success) {
        alert('钱包删除成功');
        loadWallets();
        loadStats();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      alert('删除失败');
    }
  };

  // 切换显示完整地址
  const toggleFullAddress = (walletId: string) => {
    setShowFullAddress(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  // 复制钱包地址
  const handleCopyAddress = async (walletId: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(prev => ({ ...prev, [walletId]: true }));
      setTimeout(() => {
        setCopiedAddress(prev => ({ ...prev, [walletId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error copying address:', error);
      alert('复制失败');
    }
  };

  // 格式化地址显示
  const formatAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // 智能发现
  const handleDiscover = async () => {
    if (!discoverContent) {
      alert('请输入要分析的内容');
      return;
    }
    
    try {
      setIsDiscovering(true);
      const res = await fetch(`${API_BASE}/ai/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: discoverContent,
          platform: selectedPlatform
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setDiscoverResult(data.data);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error discovering:', error);
      alert('智能分析失败');
    } finally {
      setIsDiscovering(false);
    }
  };
  
  // 上传代币图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }
    
    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }
    
    try {
      setIsUploadingImage(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_BASE}/upload/token-image`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setLaunchForm({
          ...launchForm,
          imageUrl: data.data.imageUrl,
          imageKey: data.data.key
        });
      } else {
        alert(data.error || '图片上传失败');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('图片上传失败');
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // 使用发现结果一键发币
  const handleLaunchFromDiscovery = async (suggestion: any) => {
    if (!launchForm.walletId) {
      alert('请先在发币系统页面选择钱包');
      return;
    }
    
    setLaunchForm({
      ...launchForm,
      tokenName: suggestion.name,
      tokenSymbol: suggestion.symbol,
      totalSupply: suggestion.totalSupply,
      liquidity: suggestion.liquidity
    });
    
    setActiveTab('launch');
  };
  
  // 发币
  const handleLaunchToken = async () => {
    if (!launchForm.walletId || !launchForm.tokenName || !launchForm.tokenSymbol || !launchForm.totalSupply) {
      alert('请填写所有必填字段');
      return;
    }
    
    try {
      setIsLaunching(true);
      const res = await fetch(`${API_BASE}/tokens/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(launchForm)
      });
      
      const data = await res.json();
      if (data.success) {
        alert(data.data.message);
        setLaunchForm({
          walletId: '',
          tokenName: '',
          tokenSymbol: '',
          totalSupply: '',
          liquidity: '',
          imageUrl: '',
          imageKey: ''
        });
        loadTransactions();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error launching token:', error);
      alert('发币失败');
    } finally {
      setIsLaunching(false);
    }
  };
  
  // 闪电卖出
  const handleFlashSell = async () => {
    if (!sellForm.walletId || !sellForm.tokenAddress || !sellForm.tokenSymbol || !sellForm.amount) {
      alert('请填写所有必填字段');
      return;
    }
    
    try {
      setIsSelling(true);
      const res = await fetch(`${API_BASE}/tokens/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellForm)
      });
      
      const data = await res.json();
      if (data.success) {
        alert(data.data.message);
        setSellForm({
          walletId: '',
          tokenAddress: '',
          tokenSymbol: '',
          amount: '',
          slippage: '5'
        });
        loadTransactions();
        loadWallets();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error selling token:', error);
      alert('闪电卖出失败');
    } finally {
      setIsSelling(false);
    }
  };
  
  // 添加持仓
  const handleAddPortfolio = async () => {
    if (!addPortfolioForm.walletId || !addPortfolioForm.tokenAddress || !addPortfolioForm.tokenSymbol || 
        !addPortfolioForm.amount || !addPortfolioForm.buyPrice || !addPortfolioForm.buyAmount) {
      alert('请填写所有必填字段');
      return;
    }
    
    try {
      setIsAddingPortfolio(true);
      const res = await fetch(`${API_BASE}/portfolios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addPortfolioForm)
      });
      
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setAddPortfolioForm({
          walletId: '',
          tokenAddress: '',
          tokenSymbol: '',
          tokenName: '',
          amount: '',
          buyPrice: '',
          buyAmount: '',
          profitTarget: '',
          stopLoss: ''
        });
        loadPortfolios();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding portfolio:', error);
      alert('添加持仓失败');
    } finally {
      setIsAddingPortfolio(false);
    }
  };
  
  // 快速卖出持仓
  const handleSellPortfolio = async (portfolioId: string, sellAmount?: string) => {
    if (!confirm('确定要卖出这个持仓吗？')) return;
    
    try {
      const res = await fetch(`${API_BASE}/portfolios/${portfolioId}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sellAmount: sellAmount || null,
          slippage: 5
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(data.data.message);
        loadPortfolios();
        loadTransactions();
        loadWallets();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error selling portfolio:', error);
      alert('卖出失败');
    }
  };
  
  // 更新持仓（设置利润目标等）
  const handleUpdatePortfolio = async (portfolioId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE}/portfolios/${portfolioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await res.json();
      if (data.success) {
        loadPortfolios();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
      alert('更新失败');
    }
  };
  
  // 同步持仓
  const handleSyncPortfolios = async () => {
    try {
      setIsSyncingPortfolios(true);
      const res = await fetch(`${API_BASE}/portfolios/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`同步成功！发现 ${data.data.synced} 个新持仓`);
        loadPortfolios();
        if (data.data.errors && data.data.errors.length > 0) {
          console.log('同步警告:', data.data.errors);
        }
      } else {
        alert(data.error || '同步失败');
      }
    } catch (error) {
      console.error('Error syncing portfolios:', error);
      alert('同步持仓失败');
    } finally {
      setIsSyncingPortfolios(false);
    }
  };
  
  // 转账
  const handleTransfer = async () => {
    if (!transferForm.walletId || !transferForm.toAddress || !transferForm.amount) {
      alert('请填写所有必填字段');
      return;
    }
    
    try {
      setIsTransferring(true);
      const res = await fetch(`${API_BASE}/tokens/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm)
      });
      
      const data = await res.json();
      if (data.success) {
        alert(data.data.message);
        setTransferForm({
          walletId: '',
          toAddress: '',
          tokenSymbol: '',
          amount: '',
          isNative: true
        });
        loadTransactions();
        loadWallets();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error transferring:', error);
      alert('转账失败');
    } finally {
      setIsTransferring(false);
    }
  };
  
  // 创建自动交易配置
  const handleCreateAutoTrade = async () => {
    if (!autoTradeForm.walletId || !autoTradeForm.name || !autoTradeForm.amount) {
      alert('请填写所有必填字段');
      return;
    }
    
    try {
      setIsCreatingAutoTrade(true);
      const res = await fetch(`${API_BASE}/auto-trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoTradeForm)
      });
      
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setAutoTradeForm({
          walletId: '',
          name: '',
          chain: 'solana',
          tradeType: 'buy',
          condition: 'price_above',
          conditionValue: '',
          amount: '',
          slippage: '5'
        });
        loadAutoTrades();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error creating auto trade:', error);
      alert('创建自动交易配置失败');
    } finally {
      setIsCreatingAutoTrade(false);
    }
  };
  
  // 切换自动交易开关
  const toggleAutoTrade = async (id: string, isEnabled: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/auto-trades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled })
      });
      
      const data = await res.json();
      if (data.success) {
        loadAutoTrades();
      }
    } catch (error) {
      console.error('Error toggling auto trade:', error);
    }
  };
  
  // 删除自动交易配置
  const deleteAutoTrade = async (id: string) => {
    if (!confirm('确定要删除这个自动交易配置吗？')) return;

    try {
      const res = await fetch(`${API_BASE}/auto-trades/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        loadAutoTrades();
      }
    } catch (error) {
      console.error('Error deleting auto trade:', error);
    }
  };

  // 大V相关函数
  const toggleFollowInfluencer = (influencerId: string) => {
    setFollowedInfluencers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(influencerId)) {
        newSet.delete(influencerId);
      } else {
        newSet.add(influencerId);
      }
      return newSet;
    });
  };

  const getFilteredInfluencers = (): Influencer[] => {
    let list = INFLUENCERS_BY_CATEGORY[selectedCategory as keyof typeof INFLUENCERS_BY_CATEGORY] || INFLUENCERS;

    if (influencerSearch) {
      list = searchInfluencers(influencerSearch);
    }

    return list;
  };

  const handleCopyInfluencerHandle = (handle: string) => {
    navigator.clipboard.writeText(handle);
    alert('已复制账号');
  };

  const handleUseInfluencerContent = (influencer: Influencer) => {
    // 生成示例内容供用户参考
    const exampleContent = `来自 ${influencer.handle} (${influencer.name})\n\n[在此处粘贴${influencer.name}的最新推文内容...]\n\n建议关注关键词: ${influencer.keywords?.slice(0, 3).join(', ') || '加密货币, Meme, 热点'}`;
    setDiscoverContent(exampleContent);
    setShowInfluencers(false);
  };

  // 获取大V最新内容并分析
  const handleFetchInfluencerContent = async (influencer: Influencer) => {
    try {
      setFetchingInfluencer(influencer.id);

      const res = await fetch(`${API_BASE}/influencers/${influencer.id}/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ai', // 使用AI模拟模式
          count: 5,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInfluencerAnalysis(data.data);
        setShowAnalysisModal(true);
      } else {
        alert(data.error || '获取内容失败');
      }
    } catch (error) {
      console.error('Error fetching influencer content:', error);
      alert('获取大V内容失败');
    } finally {
      setFetchingInfluencer(null);
    }
  };

  // 使用分析结果一键发币
  const handleLaunchFromInfluencerAnalysis = (suggestion: any) => {
    if (!launchForm.walletId) {
      alert('请先在发币系统页面选择钱包');
      setShowAnalysisModal(false);
      setActiveTab('launch');
      return;
    }

    setLaunchForm({
      ...launchForm,
      tokenName: suggestion.name,
      tokenSymbol: suggestion.symbol,
      totalSupply: suggestion.totalSupply,
      liquidity: suggestion.liquidity,
    });

    setShowAnalysisModal(false);
    setActiveTab('launch');
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
            <TabsTrigger value="discover">智能发现</TabsTrigger>
            <TabsTrigger value="launch">发币系统</TabsTrigger>
            <TabsTrigger value="trading">闪电卖出</TabsTrigger>
            <TabsTrigger value="transfer">转账</TabsTrigger>
            <TabsTrigger value="market">市场监控</TabsTrigger>
            <TabsTrigger value="history">交易历史</TabsTrigger>
            <TabsTrigger value="autotrade">自动交易</TabsTrigger>
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
                      <li>✅ 智能发现与一键发币</li>
                      <li>✅ 实时价格更新</li>
                      <li>✅ 发币系统</li>
                      <li>✅ 闪电卖出</li>
                      <li>✅ 转账功能</li>
                      <li>✅ 自动交易配置</li>
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

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

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
                    <div className="space-y-3">
                      {wallets.map((wallet) => (
                        <div key={wallet.id} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{wallet.name}</span>
                              <Badge variant={wallet.isActive ? 'default' : 'secondary'}>
                                {wallet.chain.toUpperCase()}
                              </Badge>
                              {wallet.isActive && (
                                <Badge className="bg-green-600">活跃</Badge>
                              )}
                            </div>
                            <p 
                              className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors"
                              onClick={() => toggleFullAddress(wallet.id)}
                              title={showFullAddress[wallet.id] ? '点击折叠' : '点击展开完整地址'}
                            >
                              {showFullAddress[wallet.id] ? wallet.address : formatAddress(wallet.address)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-bold text-white">{wallet.balance}</p>
                              <p className="text-xs text-gray-500">余额</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white h-8 w-8 relative"
                                onClick={() => handleCopyAddress(wallet.id, wallet.address)}
                                title="复制完整地址"
                              >
                                {copiedAddress[wallet.id] ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-300 h-8 w-8"
                                onClick={() => handleDeleteWallet(wallet.id)}
                                title="删除钱包"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

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

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 智能发现 */}
          <TabsContent value="discover" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">智能发现</CardTitle>
                <CardDescription className="text-gray-400">
                  关注大V，分析社交媒体内容，提取热点关键词，一键发币
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 大V关注建议 */}
                <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      推荐关注大V
                      <Badge className="bg-purple-600">{INFLUENCERS.length} 位</Badge>
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => setShowInfluencers(!showInfluencers)}
                      >
                        {showInfluencers ? '隐藏' : '显示'}
                      </Button>
                    </div>
                  </div>

                  {showInfluencers && (
                    <div className="space-y-3">
                      {/* 类别筛选和搜索 */}
                      <div className="flex gap-2 flex-wrap">
                        <div className="flex gap-1">
                          {Object.keys(INFLUENCERS_BY_CATEGORY).map((category) => (
                            <Button
                              key={category}
                              variant={selectedCategory === category ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedCategory(category)}
                              className={
                                selectedCategory === category
                                  ? 'bg-purple-600 hover:bg-purple-700'
                                  : 'border-white/20 text-gray-300'
                              }
                            >
                              {category === 'all' ? '全部' :
                               category === 'crypto' ? '加密' :
                               category === 'tech' ? '科技' :
                               category === 'defi' ? 'DeFi' :
                               category === 'meme' ? 'Meme' :
                               category === 'founder' ? '创始人' : category}
                            </Button>
                          ))}
                        </div>
                        <div className="flex-1 min-w-48">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              className="bg-black/50 border-white/10 text-white pl-9"
                              placeholder="搜索大V名称或关键词..."
                              value={influencerSearch}
                              onChange={(e) => setInfluencerSearch(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 大V列表 */}
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {getFilteredInfluencers().map((influencer) => (
                          <div
                            key={influencer.id}
                            className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-white/10 hover:border-purple-500/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                                {influencer.name[0]}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{influencer.name}</span>
                                  {influencer.verified && (
                                    <CheckCircle className="h-4 w-4 text-blue-400" />
                                  )}
                                  <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">
                                    {influencer.platform === 'twitter' ? 'Twitter' :
                                     influencer.platform === 'telegram' ? 'Telegram' :
                                     influencer.platform === 'weibo' ? '微博' : '其他'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-purple-400">{influencer.handle}</span>
                                  <span className="text-xs text-gray-500">{influencer.followers ? `• ${influencer.followers} 粉丝` : ''}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{influencer.description}</p>
                                {influencer.keywords && influencer.keywords.length > 0 && (
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {influencer.keywords.slice(0, 3).map((keyword, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-purple-400"
                                onClick={() => handleCopyInfluencerHandle(influencer.handle)}
                                title="复制账号"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-blue-400"
                                onClick={() => handleUseInfluencerContent(influencer)}
                                title="使用此大V内容分析"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-green-400"
                                onClick={() => handleFetchInfluencerContent(influencer)}
                                title="获取最新内容并AI分析"
                                disabled={fetchingInfluencer === influencer.id}
                              >
                                {fetchingInfluencer === influencer.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Brain className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant={followedInfluencers.has(influencer.id) ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => toggleFollowInfluencer(influencer.id)}
                                className={
                                  followedInfluencers.has(influencer.id)
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'border-white/20 text-gray-300'
                                }
                              >
                                {followedInfluencers.has(influencer.id) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    已关注
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-1" />
                                    关注
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                        {getFilteredInfluencers().length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>未找到匹配的大V</p>
                          </div>
                        )}
                      </div>

                      {followedInfluencers.size > 0 && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-sm text-gray-400">
                            已关注 <span className="text-purple-400 font-semibold">{followedInfluencers.size}</span> 位大V
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                  <div className="flex gap-2">
                    <select
                      className="bg-black/50 border border-white/10 text-white rounded-md px-3 py-2"
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                    >
                      <option value="twitter">Twitter / X</option>
                      <option value="telegram">Telegram</option>
                      <option value="reddit">Reddit</option>
                      <option value="other">其他</option>
                    </select>
                    <Input
                      className="flex-1 bg-black/50 border-white/10 text-white"
                      placeholder="粘贴大V的推文或热点内容..."
                      value={discoverContent}
                      onChange={(e) => setDiscoverContent(e.target.value)}
                    />
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleDiscover}
                      disabled={isDiscovering}
                    >
                      {isDiscovering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          分析
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 提示：从上方选择大V，复制其推文内容，系统将自动提取关键词并生成代币建议
                  </p>
                </div>
                
                {discoverResult && (
                  <div className="space-y-4">
                    <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-400" />
                        关键词
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {discoverResult.keywords.map((item: any, idx: number) => (
                          <Badge 
                            key={idx}
                            variant="outline"
                            className="border-purple-500/50 text-purple-400"
                          >
                            {item.word} ({item.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-400" />
                        情绪分析
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">情绪</p>
                          <Badge 
                            variant="outline"
                            className={
                              discoverResult.sentiment.sentiment === 'bullish' 
                                ? 'border-green-500/50 text-green-400 mt-1' 
                                : discoverResult.sentiment.sentiment === 'bearish'
                                ? 'border-red-500/50 text-red-400 mt-1'
                                : 'border-gray-500/50 text-gray-400 mt-1'
                            }
                          >
                            {discoverResult.sentiment.sentiment === 'bullish' ? '看涨' : 
                             discoverResult.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">评分</p>
                          <p className="text-lg font-bold text-white mt-1">{discoverResult.sentiment.score.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">关键词数</p>
                          <p className="text-lg font-bold text-white mt-1">{discoverResult.keywords.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {discoverResult.suggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromDiscovery(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {!discoverResult && !isDiscovering && (
                  <div className="text-center py-12 text-gray-500">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">智能发现系统</p>
                    <p className="text-sm">粘贴社交媒体内容，自动提取热点关键词</p>
                    <p className="text-sm">生成代币建议，一键发币</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 发币系统 */}
          <TabsContent value="launch" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">发币系统</CardTitle>
                <CardDescription className="text-gray-400">
                  一键创建并发布你的 Meme 代币
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-gray-400">选择钱包</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={launchForm.walletId}
                      onChange={(e) => setLaunchForm({...launchForm, walletId: e.target.value})}
                    >
                      <option value="">选择钱包</option>
                      {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.chain.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-400">代币名称</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="Pepe Coin"
                      value={launchForm.tokenName}
                      onChange={(e) => setLaunchForm({...launchForm, tokenName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">代币符号</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="PEPE"
                      value={launchForm.tokenSymbol}
                      onChange={(e) => setLaunchForm({...launchForm, tokenSymbol: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">总供应量</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="1000000000"
                      type="number"
                      value={launchForm.totalSupply}
                      onChange={(e) => setLaunchForm({...launchForm, totalSupply: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">代币图片 (可选)</Label>
                    <div className="mt-1 space-y-2">
                      {launchForm.imageUrl ? (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/20">
                          <img 
                            src={launchForm.imageUrl} 
                            alt="Token preview" 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={() => setLaunchForm({...launchForm, imageUrl: '', imageKey: ''})}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            id="token-image"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="token-image"
                            className="flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-white/20 cursor-pointer hover:border-purple-500/50 transition-colors bg-black/30"
                          >
                            {isUploadingImage ? (
                              <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                            ) : (
                              <div className="text-center">
                                <Rocket className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                <span className="text-xs text-gray-500">上传图片</span>
                              </div>
                            )}
                          </label>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">支持 JPG、PNG、GIF、WebP，最大 5MB</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">初始流动性 (可选)</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="10"
                      type="number"
                      value={launchForm.liquidity}
                      onChange={(e) => setLaunchForm({...launchForm, liquidity: e.target.value})}
                    />
                  </div>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleLaunchToken}
                    disabled={isLaunching}
                  >
                    {isLaunching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        发币中...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        立即发币
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="space-y-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400 font-semibold">⚠️ 发币注意事项</p>
                  <ul className="text-xs text-yellow-300 space-y-1">
                    <li>• 发币需要支付少量 gas 费</li>
                    <li>• 代币发布后不可撤销</li>
                    <li>• 建议先在测试链测试</li>
                    <li>• 流动性越多，交易越流畅</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 闪电卖出 */}
          <TabsContent value="trading" className="space-y-4">
            {/* 持仓列表 */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      我的持仓
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      管理您的代币持仓，设置利润目标和止损
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSyncPortfolios}
                    disabled={isSyncingPortfolios}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSyncingPortfolios ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        同步中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        同步持仓
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolios.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    暂无持仓，请先添加持仓或点击"同步持仓"从链上获取
                  </div>
                ) : (
                  <div className="space-y-3">
                    {portfolios.map((portfolio) => (
                      <div key={portfolio.id} className="p-4 bg-black/30 rounded-lg border border-white/10 hover:border-purple-500/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-semibold">{portfolio.tokenSymbol}</h3>
                              <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                                {portfolio.chain.toUpperCase()}
                              </Badge>
                              {portfolio.tokenName && (
                                <span className="text-sm text-gray-400">{portfolio.tokenName}</span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500">持有数量</p>
                                <p className="text-white font-medium">{parseFloat(portfolio.amount).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">买入价格</p>
                                <p className="text-white font-medium">${parseFloat(portfolio.buyPrice).toFixed(6)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">当前价格</p>
                                <p className="text-white font-medium">${portfolio.currentPrice ? parseFloat(portfolio.currentPrice).toFixed(6) : '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">盈亏</p>
                                <p className={`font-medium ${
                                  parseFloat(portfolio.profitLossPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {portfolio.profitLossPercent ? `${parseFloat(portfolio.profitLossPercent).toFixed(2)}%` : '-'}
                                </p>
                              </div>
                            </div>

                            {/* 利润目标和止损设置 */}
                            <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-gray-500">利润目标:</Label>
                                <Input
                                  type="number"
                                  className="w-20 h-8 bg-black/50 border-white/10 text-white text-xs"
                                  placeholder="50"
                                  value={portfolio.profitTarget || ''}
                                  onChange={(e) => handleUpdatePortfolio(portfolio.id, { profitTarget: parseFloat(e.target.value) })}
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-gray-500">止损:</Label>
                                <Input
                                  type="number"
                                  className="w-20 h-8 bg-black/50 border-white/10 text-white text-xs"
                                  placeholder="10"
                                  value={portfolio.stopLoss || ''}
                                  onChange={(e) => handleUpdatePortfolio(portfolio.id, { stopLoss: parseFloat(e.target.value) })}
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSellPortfolio(portfolio.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Zap className="mr-1 h-4 w-4" />
                              全部卖出
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const sellAmount = prompt('输入卖出数量 (留空卖出全部):');
                                if (sellAmount) {
                                  handleSellPortfolio(portfolio.id, sellAmount);
                                }
                              }}
                              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                            >
                              部分卖出
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 添加持仓 */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-400" />
                  添加持仓
                </CardTitle>
                <CardDescription className="text-gray-400">
                  记录您的买入信息，用于跟踪盈亏
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-gray-400">选择钱包 *</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={addPortfolioForm.walletId}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, walletId: e.target.value})}
                    >
                      <option value="">选择钱包</option>
                      {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.chain.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-400">代币符号 *</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="PEPE"
                      value={addPortfolioForm.tokenSymbol}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, tokenSymbol: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">代币名称</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="Pepe Coin"
                      value={addPortfolioForm.tokenName}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, tokenName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">代币地址 *</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="0x..."
                      value={addPortfolioForm.tokenAddress}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, tokenAddress: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">买入数量 *</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="1000"
                      type="number"
                      value={addPortfolioForm.amount}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">买入价格 (USD) *</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="0.000001"
                      type="number"
                      step="0.000001"
                      value={addPortfolioForm.buyPrice}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, buyPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">买入金额 (原生代币) *</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="0.1"
                      type="number"
                      step="0.001"
                      value={addPortfolioForm.buyAmount}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, buyAmount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">利润目标 (%)</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="50"
                      type="number"
                      value={addPortfolioForm.profitTarget}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, profitTarget: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">止损 (%)</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="10"
                      type="number"
                      value={addPortfolioForm.stopLoss}
                      onChange={(e) => setAddPortfolioForm({...addPortfolioForm, stopLoss: e.target.value})}
                    />
                  </div>
                </div>
                <Button
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={handleAddPortfolio}
                  disabled={isAddingPortfolio}
                >
                  {isAddingPortfolio ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    '添加持仓'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 转账 */}
          <TabsContent value="transfer" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">转账</CardTitle>
                <CardDescription className="text-gray-400">
                  向其他地址转账代币
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-gray-400">选择钱包</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={transferForm.walletId}
                      onChange={(e) => setTransferForm({...transferForm, walletId: e.target.value})}
                    >
                      <option value="">选择钱包</option>
                      {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.chain.toUpperCase()}) - {wallet.balance}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-400">接收地址</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="0x... 或 Solana 地址"
                      value={transferForm.toAddress}
                      onChange={(e) => setTransferForm({...transferForm, toAddress: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">代币符号 (可选)</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="ETH 或留空转账原生代币"
                      value={transferForm.tokenSymbol}
                      onChange={(e) => setTransferForm({...transferForm, tokenSymbol: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">转账数量</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="1.0"
                      type="number"
                      step="0.0001"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                    />
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleTransfer}
                    disabled={isTransferring}
                  >
                    {isTransferring ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        转账中...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        确认转账
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 交易历史 */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">交易历史</CardTitle>
                <CardDescription className="text-gray-400">
                  查看所有交易记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无交易记录</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {tx.type === 'launch' && '🚀 发币'}
                              {tx.type === 'buy' && '💰 买入'}
                              {tx.type === 'sell' && '💸 卖出'}
                              {tx.type === 'transfer' && '📤 转账'}
                            </span>
                            <Badge variant="outline" className="border-white/20">
                              {tx.chain.toUpperCase()}
                            </Badge>
                            {tx.tokenSymbol && (
                              <Badge variant="secondary">{tx.tokenSymbol}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {tx.amount} {tx.tokenSymbol || tx.chain.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}
                            className={tx.status === 'completed' ? 'bg-green-600' : ''}
                          >
                            {tx.status === 'completed' ? '完成' : tx.status === 'pending' ? '处理中' : '失败'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 自动交易 */}
          <TabsContent value="autotrade" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">自动交易</CardTitle>
                <CardDescription className="text-gray-400">
                  设置自动交易策略，无需时刻盯盘
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-gray-400">配置名称</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="PEPE 价格突破策略"
                      value={autoTradeForm.name}
                      onChange={(e) => setAutoTradeForm({...autoTradeForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">选择钱包</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={autoTradeForm.walletId}
                      onChange={(e) => setAutoTradeForm({...autoTradeForm, walletId: e.target.value})}
                    >
                      <option value="">选择钱包</option>
                      {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.chain.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-400">交易类型</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={autoTradeForm.tradeType}
                      onChange={(e) => setAutoTradeForm({...autoTradeForm, tradeType: e.target.value})}
                    >
                      <option value="buy">买入</option>
                      <option value="sell">卖出</option>
                      <option value="snipe">狙击</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-400">触发条件</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={autoTradeForm.condition}
                      onChange={(e) => setAutoTradeForm({...autoTradeForm, condition: e.target.value})}
                    >
                      <option value="price_above">价格高于</option>
                      <option value="price_below">价格低于</option>
                      <option value="volume_above">成交量高于</option>
                      <option value="sentiment_change">情绪变化</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-400">触发值</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="0.001"
                      type="number"
                      step="0.0001"
                      value={autoTradeForm.conditionValue}
                      onChange={(e) => setAutoTradeForm({...autoTradeForm, conditionValue: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">交易数量</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      placeholder="1000"
                      type="number"
                      value={autoTradeForm.amount}
                      onChange={(e) => setAutoTradeForm({...autoTradeForm, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">滑点容忍度 (%)</Label>
                    <Input
                      className="mt-1 bg-black/50 border-white/10 text-white"
                      type="number"
                      value={autoTradeForm.slippage}
                      onChange={(e) => setAutoTradeForm({...autoTradeForm, slippage: e.target.value})}
                    />
                  </div>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleCreateAutoTrade}
                    disabled={isCreatingAutoTrade}
                  >
                    {isCreatingAutoTrade ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      '创建策略'
                    )}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-white font-semibold">我的策略</h3>
                  {autoTrades.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">暂无策略</p>
                  ) : (
                    autoTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{trade.name}</span>
                            <Badge variant={trade.isEnabled ? 'default' : 'secondary'}>
                              {trade.isEnabled ? '启用' : '禁用'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            {trade.tradeType === 'buy' ? '买入' : trade.tradeType === 'sell' ? '卖出' : '狙击'} - {trade.condition}
                          </p>
                          <p className="text-xs text-gray-500">执行次数: {trade.executedCount}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAutoTrade(trade.id, !trade.isEnabled)}
                          >
                            {trade.isEnabled ? '禁用' : '启用'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAutoTrade(trade.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 大V分析结果弹窗 */}
          {showAnalysisModal && influencerAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        {influencerAnalysis.influencer.name} 最新内容分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {influencerAnalysis.influencer.handle} • {influencerAnalysis.message}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowAnalysisModal(false)}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 overflow-y-auto p-6">
                  {/* 整体分析摘要 */}
                  <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      整体分析摘要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">内容数量</p>
                        <p className="text-2xl font-bold text-white">{influencerAnalysis.summary.totalContents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看涨</p>
                        <p className="text-2xl font-bold text-green-400">{influencerAnalysis.summary.bullishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">看跌</p>
                        <p className="text-2xl font-bold text-red-400">{influencerAnalysis.summary.bearishCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">平均情绪</p>
                        <p className={`text-2xl font-bold ${parseFloat(influencerAnalysis.summary.avgScore) > 0 ? 'text-green-400' : parseFloat(influencerAnalysis.summary.avgScore) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {influencerAnalysis.summary.avgScore}
                        </p>
                      </div>
                    </div>

                    {/* 整体建议 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">AI 建议</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                influencerAnalysis.summary.recommendation === 'BUY'
                                  ? 'bg-green-600 text-lg py-1 px-3'
                                  : influencerAnalysis.summary.recommendation === 'SELL'
                                  ? 'bg-red-600 text-lg py-1 px-3'
                                  : 'bg-yellow-600 text-lg py-1 px-3'
                              }
                            >
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '建议买入' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '建议卖出' : '建议持有'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {influencerAnalysis.summary.recommendation === 'BUY' ? '基于大V内容，市场情绪偏看涨' :
                               influencerAnalysis.summary.recommendation === 'SELL' ? '基于大V内容，市场情绪偏看跌' :
                               '基于大V内容，市场情绪中性'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 热门关键词 */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">热门关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {influencerAnalysis.summary.topKeywords.map((keyword: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-purple-500/50 text-purple-400">
                            {keyword.word} ({keyword.freq})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 详细内容列表 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      内容详情与分析
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {influencerAnalysis.contents.map((content: any, idx: number) => {
                        const analysis = influencerAnalysis.analyses[idx];
                        return (
                          <div key={idx} className="p-4 bg-black/50 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-white text-sm flex-1">{content.content}</p>
                              {content.isSimulated && (
                                <Badge variant="secondary" className="text-xs">AI生成</Badge>
                              )}
                            </div>
                            {analysis && (
                              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                <Badge
                                  variant="outline"
                                  className={
                                    analysis.analysis.sentiment.sentiment === 'bullish'
                                      ? 'border-green-500/50 text-green-400'
                                      : analysis.analysis.sentiment.sentiment === 'bearish'
                                      ? 'border-red-500/50 text-red-400'
                                      : 'border-gray-500/50 text-gray-400'
                                  }
                                >
                                  {analysis.analysis.sentiment.sentiment === 'bullish' ? '看涨' :
                                   analysis.analysis.sentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  情绪: {analysis.analysis.sentiment.score.toFixed(2)} | 关键词: {analysis.analysis.keywords.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 代币建议 */}
                  {influencerAnalysis.summary.tokenSuggestions && influencerAnalysis.summary.tokenSuggestions.length > 0 && (
                    <div className="space-y-3 p-4 bg-black/50 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-400" />
                        代币建议
                      </h3>
                      <div className="space-y-3">
                        {influencerAnalysis.summary.tokenSuggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.symbol}</Badge>
                                <Badge className="bg-purple-600">{suggestion.relevance}% 相关度</Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                供应量: {suggestion.totalSupply} | 价格: ${suggestion.price} | 流动性: {suggestion.liquidity}
                              </p>
                              <p className="text-xs text-gray-500">{suggestion.description}</p>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleLaunchFromInfluencerAnalysis(suggestion)}
                            >
                              <Rocket className="mr-2 h-4 w-4" />
                              一键发币
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </Tabs>
      </main>
    </div>
  );
}
