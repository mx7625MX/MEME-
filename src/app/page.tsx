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
  Plus,
  Eye,
  ArrowRight
} from 'lucide-react';

import { INFLUENCERS, Influencer, INFLUENCERS_BY_CATEGORY, searchInfluencers } from '@/config/influencers';
import { MarketMakerManager } from '@/components/MarketMakerManager';

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
  
  // 导入钱包相关状态
  const [showImportWallet, setShowImportWallet] = useState(false);
  const [importWalletName, setImportWalletName] = useState('');
  const [importChain, setImportChain] = useState('solana');
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // 智能发现相关状态
  const [discoverContent, setDiscoverContent] = useState('');
  const [discoverResult, setDiscoverResult] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');

  // 多源热点聚合相关状态
  const [hotspotKeywords, setHotspotKeywords] = useState('cryptocurrency,bitcoin,ethereum');
  const [isAggregating, setIsAggregating] = useState(false);
  const [aggregatedResults, setAggregatedResults] = useState<any>(null);
  const [isAnalyzingHotspots, setIsAnalyzingHotspots] = useState(false);
  const [hotspotAnalysis, setHotspotAnalysis] = useState<any>(null);
  
  // 发币相关状态
  const [launchForm, setLaunchForm] = useState({
    platform: 'raydium', // 发行平台：pump.fun, four.meme, raydium, uniswap, pancakeswap
    chain: 'solana', // 区块链
    walletId: '',
    tokenName: '',
    tokenSymbol: '',
    tokenDescription: '',
    totalSupply: '',
    liquidity: '',
    imageUrl: '',
    imageKey: '',
    bundleBuyEnabled: true, // 是否启用捆绑买入
    bundleBuyAmount: '0.1', // 默认捆绑买入 0.1 SOL/BNB/ETH
    useSpecifiedTokenForBundleBuy: false, // 是否使用指定代币进行捆绑买入
    bundleBuyTokenSymbol: '', // 捆绑买入使用的代币，默认不选中
    // 媒体链接
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    // 流动性配置（做市值）- 仅适用于 AMM DEX（Raydium、Uniswap、PancakeSwap）
    addLiquidity: true, // 默认开启
    liquidityTokenPercent: '50', // 默认使用 50% 供应量
    pairTokenSymbol: 'auto', // 自动选择配对代币
    pairTokenAmount: '1', // 默认配对 1 SOL/ETH/USDT
    lockLiquidity: true, // 默认锁定流动性
    lockDuration: '7', // 默认锁定 7 天
    // 同步闪电卖出配置（与发币同步执行）
    autoFlashSellEnabled: true, // 默认启用同步闪电卖出
    autoFlashSellPercentage: '50', // 默认卖出 50% 的捆绑买入数量
    autoFlashSellDelay: '0', // 默认立即执行（0秒延迟）
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
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>([]);
  const [sellPercentage, setSellPercentage] = useState<number | null>(null);
  
  // 持仓管理相关状态
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [isSyncingPortfolios, setIsSyncingPortfolios] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  
  // 自动闪电卖出相关状态
  const [showAutoSellConfig, setShowAutoSellConfig] = useState<string | null>(null);
  const [autoSellForm, setAutoSellForm] = useState({
    autoSellEnabled: false,
    autoSellType: 'both',
    whaleBuyThreshold: '0.5',
    autoSellPercentage: '100',
    profitTarget: '100',
    stopLoss: '30',
    timedSellEnabled: false,
    timedSellSeconds: '5'
  });
  const [isUpdatingAutoSell, setIsUpdatingAutoSell] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitorResults, setMonitorResults] = useState<any>(null);
  
  // Jito 配置相关状态
  const [showJitoConfig, setShowJitoConfig] = useState(false);
  const [jitoShredKey, setJitoShredKey] = useState('');
  const [isUpdatingJito, setIsUpdatingJito] = useState(false);
  
  // 转账相关状态
  const [transferForm, setTransferForm] = useState({
    walletId: '',
    chain: 'solana',
    toAddress: '',
    tokenSymbol: '',
    amount: '',
    isNative: true
  });
  const [isTransferring, setIsTransferring] = useState(false);

  // 批量转账相关状态
  const [batchTransferMode, setBatchTransferMode] = useState(false);
  const [batchTransfers, setBatchTransfers] = useState<Array<{
    toAddress: string;
    amount: string;
  }>>([]);
  const [isBatchTransferring, setIsBatchTransferring] = useState(false);
  
  // 交易历史
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // 交易历史筛选
  const [transactionFilter, setTransactionFilter] = useState<{
    type?: string;
    chain?: string;
    status?: string;
  }>({});
  
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

  // 当筛选条件改变时，自动刷新交易历史
  useEffect(() => {
    loadTransactions();
  }, [transactionFilter]);

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
        loadPortfolios(),
        loadJitoConfig()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWallets = async () => {
    try {
      console.log('Loading wallets...');
      const res = await fetch(`${API_BASE}/wallets`);
      const data = await res.json();
      console.log('Wallets response:', data);

      if (data.success) {
        setWallets(data.data);
      } else {
        console.error('Failed to load wallets:', data.error);
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
      const params = new URLSearchParams();
      if (transactionFilter.type) params.append('type', transactionFilter.type);
      if (transactionFilter.chain) params.append('chain', transactionFilter.chain);
      if (transactionFilter.status) params.append('status', transactionFilter.status);
      
      const url = `${API_BASE}/transactions${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
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
    if (!newWalletName) {
      alert('请输入钱包名称');
      return;
    }

    if (!selectedChain) {
      alert('请选择区块链');
      return;
    }

    try {
      setIsCreatingWallet('creating');
      console.log('Creating wallet:', { name: newWalletName, chain: selectedChain });

      const res = await fetch(`${API_BASE}/wallets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWalletName, chain: selectedChain })
      });

      const data = await res.json();
      console.log('Create wallet response:', data);

      if (data.success) {
        setNewWalletName('');
        await loadWallets();
        await loadStats();
        alert(`钱包创建成功！\n\n地址: ${data.data.address}`);
      } else {
        alert(`创建失败：${data.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      alert(`创建失败：${error.message || '网络错误，请重试'}`);
    } finally {
      setIsCreatingWallet('');
    }
  };

  // 导入钱包
  const handleImportWallet = async () => {
    if (!importWalletName) {
      alert('请输入钱包名称');
      return;
    }

    const importData: any = {
      name: importWalletName,
      chain: importChain,
      importType: importType
    };

    if (importType === 'mnemonic') {
      if (!importMnemonic || importMnemonic.trim() === '') {
        alert('请输入助记词');
        return;
      }
      importData.mnemonic = importMnemonic.trim();
    } else {
      if (!importPrivateKey || importPrivateKey.trim() === '') {
        alert('请输入私钥');
        return;
      }
      importData.privateKey = importPrivateKey.trim();
    }

    // 安全确认对话框
    const confirmMessage = `
🔐 安全确认

您即将导入一个${importType === 'mnemonic' ? '助记词' : '私钥'}钱包。

安全保护：
✓ 使用 AES-256-GCM 军用级加密
✓ 加密密钥独立存储
✓ 助记词和私钥全程加密

重要提示：
• 仅导入用于日常交易的资金
• 不要导入包含全部资产的钱包
• 建议使用专用的交易钱包

确认要继续导入吗？
`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    try {
      setIsImporting(true);
      const res = await fetch(`${API_BASE}/wallets/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData)
      });

      const data = await res.json();
      if (data.success) {
        // 清空表单
        setImportWalletName('');
        setImportMnemonic('');
        setImportPrivateKey('');
        setShowImportWallet(false);
        loadWallets();
        loadStats();
        alert('钱包导入成功！');
      } else {
        alert(data.error || '导入失败');
      }
    } catch (error) {
      console.error('Error importing wallet:', error);
      alert('导入失败');
    } finally {
      setIsImporting(false);
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

  // 多源热点聚合
  const handleAggregateHotspots = async () => {
    const keywords = hotspotKeywords.split(',').map(k => k.trim()).filter(k => k);
    if (keywords.length === 0) {
      alert('请输入至少一个关键词');
      return;
    }

    try {
      setIsAggregating(true);
      const res = await fetch(`${API_BASE}/hotspots/aggregate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      });

      const data = await res.json();
      if (data.success) {
        setAggregatedResults(data.data);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error aggregating hotspots:', error);
      alert('聚合热点失败');
    } finally {
      setIsAggregating(false);
    }
  };

  // 分析热点并生成交易建议
  const handleAnalyzeHotspots = async () => {
    const keywords = hotspotKeywords.split(',').map(k => k.trim()).filter(k => k);
    if (keywords.length === 0) {
      alert('请输入至少一个关键词');
      return;
    }

    try {
      setIsAnalyzingHotspots(true);
      const res = await fetch(`${API_BASE}/hotspots/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      });

      const data = await res.json();
      if (data.success) {
        setHotspotAnalysis(data.data);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error analyzing hotspots:', error);
      alert('分析热点失败');
    } finally {
      setIsAnalyzingHotspots(false);
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
          platform: 'raydium',
          chain: 'solana',
          walletId: '',
          tokenName: '',
          tokenSymbol: '',
          tokenDescription: '',
          totalSupply: '',
          liquidity: '',
          imageUrl: '',
          imageKey: '',
          bundleBuyEnabled: true,
          bundleBuyAmount: '0.1',
          useSpecifiedTokenForBundleBuy: false,
          bundleBuyTokenSymbol: '',
          website: '',
          twitter: '',
          telegram: '',
          discord: '',
          addLiquidity: true,
          liquidityTokenPercent: '50',
          pairTokenSymbol: 'auto',
          pairTokenAmount: '1',
          lockLiquidity: true,
          lockDuration: '7',
          autoFlashSellEnabled: true,
          autoFlashSellPercentage: '50',
          autoFlashSellDelay: '0',
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

  // 快速闪电卖出
  const handleQuickFlashSell = async (sellType: 'all' | 'percentage' = 'all', percentage?: number) => {
    if (!sellForm.tokenAddress || !sellForm.walletId) {
      alert('请先选择要卖出的代币');
      return;
    }

    // 找到对应的持仓ID
    const selectedPortfolio = portfolios.find(p => 
      p.tokenAddress === sellForm.tokenAddress && 
      p.walletId === sellForm.walletId &&
      p.status === 'active'
    );

    if (!selectedPortfolio) {
      alert('未找到对应的持仓');
      return;
    }

    // 计算卖出数量
    let sellAmount = sellForm.amount;
    if (sellType === 'percentage' && percentage) {
      sellAmount = (parseFloat(sellForm.amount || '0') * (percentage / 100)).toString();
    }

    if (!confirm(`确定要卖出 ${sellType === 'all' ? '全部' : `${percentage}%`} ${sellForm.tokenSymbol} 吗？\n\n卖出数量: ${parseFloat(sellAmount || '0').toLocaleString()} ${sellForm.tokenSymbol}\n滑点设置: ${sellForm.slippage}%`)) {
      return;
    }
    
    try {
      setIsSelling(true);
      const res = await fetch(`${API_BASE}/portfolios/${selectedPortfolio.id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sellAmount: sellAmount,
          slippage: parseFloat(sellForm.slippage) || 5
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(data.data.message);
        // 重置表单
        setSellForm({
          walletId: '',
          tokenAddress: '',
          tokenSymbol: '',
          amount: '',
          slippage: '5'
        });
        loadPortfolios();
        loadTransactions();
        loadWallets();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error quick flash sell:', error);
      alert('闪电卖出失败');
    } finally {
      setIsSelling(false);
    }
  };

  // 批量闪电卖出
  const handleBatchFlashSell = async (percentage: number) => {
    if (selectedPortfolioIds.length === 0) {
      alert('请先选择要卖出的代币');
      return;
    }

    // 获取选中的持仓
    const selectedPortfolios = portfolios.filter(p => 
      selectedPortfolioIds.includes(p.id) && p.status === 'active'
    );

    if (selectedPortfolios.length === 0) {
      alert('未找到有效的持仓');
      return;
    }

    // 生成确认信息
    const confirmMessage = selectedPortfolios.map(p => {
      const sellAmount = percentage === 100 
        ? parseFloat(p.amount)
        : parseFloat(p.amount) * (percentage / 100);
      return `${p.tokenSymbol}: ${sellAmount.toLocaleString()} (${percentage === 100 ? '全部' : percentage + '%'})`;
    }).join('\n');

    if (!confirm(`确定要批量卖出以下代币吗？\n\n${confirmMessage}\n\n共 ${selectedPortfolios.length} 个代币\n滑点设置: ${sellForm.slippage}%`)) {
      return;
    }
    
    try {
      setIsSelling(true);
      
      // 顺序执行卖出操作
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const portfolio of selectedPortfolios) {
        try {
          const sellAmount = percentage === 100
            ? portfolio.amount
            : (parseFloat(portfolio.amount) * (percentage / 100)).toString();

          const res = await fetch(`${API_BASE}/portfolios/${portfolio.id}/sell`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sellAmount,
              slippage: parseFloat(sellForm.slippage) || 5
            })
          });
          
          const data = await res.json();
          if (data.success) {
            successCount++;
            results.push({ symbol: portfolio.tokenSymbol, success: true, message: data.data.message });
          } else {
            failCount++;
            results.push({ symbol: portfolio.tokenSymbol, success: false, message: data.error });
          }
        } catch (error) {
          failCount++;
          results.push({ symbol: portfolio.tokenSymbol, success: false, message: '卖出失败' });
        }
      }

      // 显示结果
      const resultSummary = results.map(r => 
        `${r.success ? '✓' : '✗'} ${r.symbol}: ${r.message}`
      ).join('\n');
      
      alert(`批量卖出完成！\n\n成功: ${successCount} 个\n失败: ${failCount} 个\n\n详细结果:\n${resultSummary}`);
      
      // 重置选择
      setSelectedPortfolioIds([]);
      setSellPercentage(null);
      
      // 刷新数据
      loadPortfolios();
      loadTransactions();
      loadWallets();
    } catch (error) {
      console.error('Error batch flash sell:', error);
      alert('批量闪电卖出失败');
    } finally {
      setIsSelling(false);
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
  
  // 打开自动闪电卖出配置
  const openAutoSellConfig = (portfolio: any) => {
    setShowAutoSellConfig(portfolio.id);
    setAutoSellForm({
      autoSellEnabled: portfolio.autoSellEnabled || false,
      autoSellType: portfolio.autoSellType || 'both',
      whaleBuyThreshold: portfolio.whaleBuyThreshold || '0.5',
      autoSellPercentage: portfolio.autoSellPercentage || '100',
      profitTarget: portfolio.profitTarget || '100',
      stopLoss: portfolio.stopLoss || '30',
      timedSellEnabled: portfolio.timedSellEnabled || false,
      timedSellSeconds: portfolio.timedSellSeconds?.toString() || '5'
    });
  };
  
  // 更新自动闪电卖出配置
  const handleUpdateAutoSellConfig = async (portfolioId: string) => {
    try {
      setIsUpdatingAutoSell(true);
      const res = await fetch(`${API_BASE}/portfolios/${portfolioId}/auto-sell`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoSellForm)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('自动闪电卖出配置已更新');
        setShowAutoSellConfig(null);
        loadPortfolios();
      } else {
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Error updating auto-sell config:', error);
      alert('更新失败');
    } finally {
      setIsUpdatingAutoSell(false);
    }
  };
  
  // 手动触发监控
  const handleMonitorPortfolios = async (portfolioId?: string) => {
    try {
      setIsMonitoring(true);
      const res = await fetch(`${API_BASE}/portfolios/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolioId ? { portfolioId } : {})
      });
      
      const data = await res.json();
      if (data.success) {
        setMonitorResults(data.data);
        loadPortfolios();
        
        const autoSoldCount = data.data.autoSold;
        if (autoSoldCount > 0) {
          alert(`监控完成！触发了 ${autoSoldCount} 笔自动卖出`);
        } else {
          alert(`监控完成！监控了 ${data.data.monitored} 个持仓，未触发自动卖出`);
        }
      } else {
        alert(data.error || '监控失败');
      }
    } catch (error) {
      console.error('Error monitoring portfolios:', error);
      alert('监控失败');
    } finally {
      setIsMonitoring(false);
    }
  };
  
  // 加载 Jito 配置（仅显示掩码版本）
  const loadJitoConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/jito`);
      const data = await res.json();
      if (data.success && data.data.maskedKey) {
        setJitoShredKey(data.data.maskedKey); // 只存储掩码版本
      } else {
        setJitoShredKey('');
      }
    } catch (error) {
      console.error('Error loading Jito config:', error);
    }
  };
  
  // 更新 Jito 配置
  const handleUpdateJitoConfig = async () => {
    try {
      setIsUpdatingJito(true);
      const res = await fetch(`${API_BASE}/settings/jito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shredKey: jitoShredKey })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Jito Shred Key 配置成功！Solana 交易将使用 Jito 加速');
        setShowJitoConfig(false);
      } else {
        alert(data.error || '配置失败');
      }
    } catch (error) {
      console.error('Error updating Jito config:', error);
      alert('配置失败');
    } finally {
      setIsUpdatingJito(false);
    }
  };
  
  // 删除 Jito 配置
  const handleDeleteJitoConfig = async () => {
    if (!confirm('确定要删除 Jito Shred Key 配置吗？')) return;
    
    try {
      const res = await fetch(`${API_BASE}/settings/jito`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      if (data.success) {
        setJitoShredKey('');
        alert('Jito 配置已删除');
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Error deleting Jito config:', error);
      alert('删除失败');
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
          chain: 'solana',
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

  // 批量转账
  const handleBatchTransfer = async () => {
    if (!transferForm.walletId) {
      alert('请选择钱包');
      return;
    }
    
    if (batchTransfers.length === 0) {
      alert('请添加至少一笔转账');
      return;
    }
    
    // 验证每笔转账
    for (let i = 0; i < batchTransfers.length; i++) {
      const transfer = batchTransfers[i];
      if (!transfer.toAddress || !transfer.amount) {
        alert(`第 ${i + 1} 笔转账缺少必填字段`);
        return;
      }
    }
    
    try {
      setIsBatchTransferring(true);
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < batchTransfers.length; i++) {
        const transfer = batchTransfers[i];
        try {
          const res = await fetch(`${API_BASE}/tokens/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletId: transferForm.walletId,
              chain: transferForm.chain,
              toAddress: transfer.toAddress,
              tokenSymbol: transferForm.tokenSymbol,
              amount: transfer.amount,
              isNative: transferForm.isNative
            })
          });
          
          const data = await res.json();
          if (data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Transfer ${i + 1} failed:`, error);
          failCount++;
        }
        
        // 添加小延迟避免过快请求
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      alert(`批量转账完成！\n成功: ${successCount} 笔\n失败: ${failCount} 笔`);
      setBatchTransfers([]);
      loadTransactions();
      loadWallets();
    } catch (error) {
      console.error('Error batch transferring:', error);
      alert('批量转账失败');
    } finally {
      setIsBatchTransferring(false);
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
          mode: 'search', // 使用联网搜索模式获取真实内容
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
      tokenDescription: suggestion.description || '',
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
            <TabsTrigger value="market-maker">做市值</TabsTrigger>
            <TabsTrigger value="privacy">隐私保护</TabsTrigger>
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

          {/* 做市值策略管理 */}
          <TabsContent value="market-maker" className="space-y-4">
            <MarketMakerManager />
          </TabsContent>

          {/* 隐私保护 */}
          <TabsContent value="privacy" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-6 w-6 text-purple-400" />
                  隐私保护中心
                </CardTitle>
                <CardDescription className="text-gray-400">
                  保护您的交易隐私，防止链上追踪
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 功能卡片 */}
                <div className="grid gap-6 md:grid-cols-3">
                  {/* 隐私保护转账 */}
                  <Card className="bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60 transition-colors cursor-pointer" onClick={() => window.location.href = '/privacy/transfer'}>
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-400" />
                        隐私保护转账
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        通过多跳中转和拆分交易，保护您的转账隐私
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>✅ 多跳中转保护</p>
                        <p>✅ 拆分交易功能</p>
                        <p>✅ 可选隐私级别</p>
                        <p>✅ 自动路径规划</p>
                      </div>
                      <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                        进入隐私转账
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 隐私配置 */}
                  <Card className="bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60 transition-colors cursor-pointer" onClick={() => window.location.href = '/privacy/config'}>
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Settings className="h-5 w-5 text-purple-400" />
                        隐私配置
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        为您的钱包配置个性化隐私保护参数
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>✅ 设置隐私级别</p>
                        <p>✅ 自定义中转跳数</p>
                        <p>✅ 拆分交易数量</p>
                        <p>✅ 随机延迟配置</p>
                      </div>
                      <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                        进入隐私配置
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 钱包追踪分析 */}
                  <Card className="bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60 transition-colors cursor-pointer" onClick={() => window.location.href = '/privacy/analyze'}>
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Eye className="h-5 w-5 text-purple-400" />
                        钱包追踪分析
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        分析钱包的追踪风险，获取隐私保护建议
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>✅ 隐私评分</p>
                        <p>✅ 追踪风险分析</p>
                        <p>✅ 关联检测</p>
                        <p>✅ 改进建议</p>
                      </div>
                      <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                        进入追踪分析
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* 隐私保护说明 */}
                <Card className="bg-slate-900/50 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">隐私保护说明</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-gray-400">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          如何保护隐私
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li>• 使用隐私保护转账避免直接关联</li>
                          <li>• 设置合适的隐私级别</li>
                          <li>• 定期分析钱包追踪风险</li>
                          <li>• 避免使用同一钱包进行多次交易</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          注意事项
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li>• 隐私保护会增加交易费用</li>
                          <li>• 高级别保护需要更多时间</li>
                          <li>• 请确保接收地址正确</li>
                          <li>• 隐私保护不能完全匿名</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 钱包管理 */}
          <TabsContent value="wallets" className="space-y-4">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">钱包管理</CardTitle>
                <CardDescription className="text-gray-400">
                  管理多链钱包（Solana、BSC、ETH）- 支持创建或导入钱包
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 创建/导入钱包切换按钮 */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={!showImportWallet ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowImportWallet(false)}
                    className={!showImportWallet ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/20 text-gray-300'}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    创建新钱包
                  </Button>
                  <Button
                    variant={showImportWallet ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowImportWallet(true)}
                    className={showImportWallet ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/20 text-gray-300'}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    导入钱包
                  </Button>
                </div>

                {!showImportWallet ? (
                  // 创建钱包表单
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
                          <Plus className="mr-2 h-4 w-4" />
                          创建新钱包
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  // 导入钱包表单
                  <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                    {/* 安全提示 */}
                    <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Shield className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-green-400 font-medium mb-1">安全提示</p>
                          <p className="text-gray-300">
                            ✅ 钱包数据使用 AES-256-GCM 强加密存储
                          </p>
                          <p className="text-gray-400 mt-1">
                            建议：仅导入用于日常交易的资金，不要导入全部资产
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400">钱包名称</Label>
                      <Input 
                        className="mt-1 bg-black/50 border-white/10 text-white"
                        placeholder="我的导入钱包"
                        value={importWalletName}
                        onChange={(e) => setImportWalletName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400">选择链</Label>
                      <div className="flex gap-2 mt-1">
                        {['solana', 'bsc', 'eth'].map((chain) => (
                          <Button
                            key={chain}
                            variant={importChain === chain ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setImportChain(chain)}
                            className={importChain === chain ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/20 text-gray-300'}
                          >
                            {chain.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-400">导入方式</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant={importType === 'mnemonic' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImportType('mnemonic')}
                          className={importType === 'mnemonic' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/20 text-gray-300'}
                        >
                          助记词
                        </Button>
                        <Button
                          variant={importType === 'privateKey' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImportType('privateKey')}
                          className={importType === 'privateKey' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/20 text-gray-300'}
                        >
                          私钥
                        </Button>
                      </div>
                    </div>
                    {importType === 'mnemonic' ? (
                      <div>
                        <Label className="text-gray-400">助记词（12 或 24 个单词，用空格分隔）</Label>
                        <textarea
                          className="mt-1 w-full bg-black/50 border-white/10 text-white rounded-md p-3 text-sm min-h-[100px] resize-y"
                          placeholder="word1 word2 word3 ..."
                          value={importMnemonic}
                          onChange={(e) => setImportMnemonic(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="text-gray-400">私钥</Label>
                        <Input 
                          className="mt-1 bg-black/50 border-white/10 text-white"
                          placeholder="输入您的私钥"
                          type="password"
                          value={importPrivateKey}
                          onChange={(e) => setImportPrivateKey(e.target.value)}
                        />
                      </div>
                    )}
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={handleImportWallet}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          导入中...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          导入钱包
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
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

          {/* 做市值策略管理 */}

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

            {/* 多源热点聚合 */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm mt-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  多源热点聚合
                  <Badge className="bg-orange-600">全新</Badge>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  从新闻、Reddit、社交媒体、数据聚合平台等多个数据源聚合热点信息，实时捕捉市场趋势
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 关键词输入 */}
                <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                  <div className="flex gap-2">
                    <Input
                      className="flex-1 bg-black/50 border-white/10 text-white"
                      placeholder="输入关键词，用逗号分隔（如：cryptocurrency,bitcoin,ethereum）"
                      value={hotspotKeywords}
                      onChange={(e) => setHotspotKeywords(e.target.value)}
                    />
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleAggregateHotspots}
                      disabled={isAggregating}
                    >
                      {isAggregating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          聚合
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                      onClick={handleAnalyzeHotspots}
                      disabled={isAnalyzingHotspots}
                    >
                      {isAnalyzingHotspots ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          智能分析
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 提示：从多个数据源（新闻、Reddit、社交媒体、数据聚合平台、链上数据）聚合热点信息
                  </p>
                </div>

                {/* 聚合结果展示 */}
                {aggregatedResults && (
                  <div className="space-y-4">
                    {/* 热门趋势 */}
                    {aggregatedResults.trending && aggregatedResults.trending.length > 0 && (
                      <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          当前热门趋势
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {aggregatedResults.trending.slice(0, 5).map((topic: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                topic.growth > 0
                                  ? 'bg-green-900/20 border-green-500/30'
                                  : 'bg-red-900/20 border-red-500/30'
                              }`}
                            >
                              <p className="text-white font-medium text-sm">{topic.keyword}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-bold ${topic.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {topic.growth > 0 ? '+' : ''}{topic.growth}%
                                </span>
                                <Badge variant="secondary" className="text-xs">{topic.score}分</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 新闻源 */}
                    {aggregatedResults.news && aggregatedResults.news.length > 0 && (
                      <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-400" />
                          新闻资讯
                          <Badge variant="outline" className="text-xs">{aggregatedResults.news.length} 条</Badge>
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {aggregatedResults.news.slice(0, 5).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-black/50 rounded-lg border border-white/5 hover:border-blue-500/30 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-white text-sm font-medium">{item.title}</p>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.content}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                                    {item.source}
                                  </Badge>
                                  {item.relevanceScore && (
                                    <span className="text-xs text-gray-500">{Math.round(item.relevanceScore)}%相关</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reddit讨论 */}
                    {aggregatedResults.reddit && aggregatedResults.reddit.length > 0 && (
                      <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5 text-orange-400" />
                          Reddit 社区讨论
                          <Badge variant="outline" className="text-xs">{aggregatedResults.reddit.length} 条</Badge>
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {aggregatedResults.reddit.slice(0, 5).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-black/50 rounded-lg border border-white/5 hover:border-orange-500/30 transition-colors">
                              <p className="text-white text-sm font-medium">{item.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                                  {item.source}
                                </Badge>
                                {item.tags && item.tags.map((tag: string, tagIdx: number) => (
                                  <Badge key={tagIdx} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 数据聚合平台 */}
                    {aggregatedResults.aggregator && aggregatedResults.aggregator.length > 0 && (
                      <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-400" />
                          市场数据
                          <Badge variant="outline" className="text-xs">{aggregatedResults.aggregator.length} 条</Badge>
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {aggregatedResults.aggregator.slice(0, 5).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-black/50 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-white text-sm font-medium">{item.title}</p>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.content}</p>
                                </div>
                                <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                                  {item.source}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 社交媒体 */}
                    {aggregatedResults.social && aggregatedResults.social.length > 0 && (
                      <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <Send className="h-5 w-5 text-cyan-400" />
                          社交媒体
                          <Badge variant="outline" className="text-xs">{aggregatedResults.social.length} 条</Badge>
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {aggregatedResults.social.slice(0, 5).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-black/50 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-white text-sm font-medium">{item.title}</p>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.content}</p>
                                </div>
                                <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                                  Twitter/X
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 链上数据 */}
                    {aggregatedResults.onChain && aggregatedResults.onChain.length > 0 && (
                      <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <Shield className="h-5 w-5 text-yellow-400" />
                          链上数据
                          <Badge variant="outline" className="text-xs">{aggregatedResults.onChain.length} 条</Badge>
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {aggregatedResults.onChain.slice(0, 5).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-black/50 rounded-lg border border-white/5 hover:border-yellow-500/30 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-white text-sm font-medium">{item.title}</p>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.content}</p>
                                </div>
                                <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                                  {item.source}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 热点分析结果 */}
                {hotspotAnalysis && (
                  <div className="space-y-4">
                    <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        分析摘要
                      </h3>
                      <p className="text-sm text-gray-300">{hotspotAnalysis.summary}</p>
                    </div>

                    {/* 交易建议 */}
                    {hotspotAnalysis.suggestions && hotspotAnalysis.suggestions.length > 0 && (
                      <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <Rocket className="h-5 w-5 text-green-400" />
                          交易建议
                        </h3>
                        <div className="space-y-2">
                          {hotspotAnalysis.suggestions.slice(0, 5).map((suggestion: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                suggestion.action === 'BUY'
                                  ? 'bg-green-900/20 border-green-500/30'
                                  : suggestion.action === 'SELL'
                                  ? 'bg-red-900/20 border-red-500/30'
                                  : 'bg-gray-900/20 border-gray-500/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={
                                        suggestion.action === 'BUY'
                                          ? 'bg-green-600'
                                          : suggestion.action === 'SELL'
                                          ? 'bg-red-600'
                                          : 'bg-gray-600'
                                      }
                                    >
                                      {suggestion.action}
                                    </Badge>
                                    <span className="text-white font-medium">{suggestion.token}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">{suggestion.reason}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.confidence}% 置信度
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!aggregatedResults && !hotspotAnalysis && !isAggregating && !isAnalyzingHotspots && (
                  <div className="text-center py-12 text-gray-500">
                    <Flame className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">多源热点聚合系统</p>
                    <p className="text-sm">从新闻、Reddit、社交媒体、数据聚合平台、链上数据等多个数据源</p>
                    <p className="text-sm">聚合热点信息，实时捕捉市场趋势</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 做市值策略管理 */}
          
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
                  {/* 区块链网络选择 */}
                  <div>
                    <Label className="text-gray-400">区块链网络</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={launchForm.chain}
                      onChange={(e) => {
                        const chain = e.target.value;
                        // 根据链自动选择合适的平台
                        let platform = 'raydium';
                        let addLiquidity = true;
                        
                        if (chain === 'solana') {
                          platform = 'pump.fun';
                          addLiquidity = false;
                        } else if (chain === 'bsc') {
                          platform = 'pancakeswap';
                          addLiquidity = true;
                        } else if (chain === 'eth') {
                          platform = 'uniswap';
                          addLiquidity = true;
                        }
                        
                        setLaunchForm({
                          ...launchForm,
                          chain,
                          platform,
                          addLiquidity
                        });
                      }}
                    >
                      <option value="solana">Solana</option>
                      <option value="bsc">BSC (BNB Chain)</option>
                      <option value="eth">Ethereum</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {launchForm.chain === 'solana' ? (
                        <>Solana 网络支持 pump.fun、four.meme 等 Bonding Curve 平台，以及 Raydium 等 AMM 平台</>
                      ) : launchForm.chain === 'bsc' ? (
                        <>BSC 网络支持 PancakeSwap 等 AMM 平台</>
                      ) : (
                        <>Ethereum 网络支持 Uniswap 等 AMM 平台</>
                      )}
                    </p>
                  </div>

                  {/* 发行平台选择（根据链自动填充，可修改） */}
                  <div>
                    <Label className="text-gray-400">发行平台</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={launchForm.platform}
                      onChange={(e) => setLaunchForm({
                        ...launchForm,
                        platform: e.target.value,
                        addLiquidity: e.target.value !== 'pump.fun' && e.target.value !== 'four.meme'
                      })}
                    >
                      {launchForm.chain === 'solana' ? (
                        <>
                          <option value="pump.fun">pump.fun (Bonding Curve)</option>
                          <option value="four.meme">four.meme (Bonding Curve)</option>
                          <option value="raydium">Raydium (AMM)</option>
                        </>
                      ) : launchForm.chain === 'bsc' ? (
                        <>
                          <option value="pancakeswap">PancakeSwap (AMM)</option>
                        </>
                      ) : (
                        <>
                          <option value="uniswap">Uniswap (AMM)</option>
                        </>
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {launchForm.platform === 'pump.fun' || launchForm.platform === 'four.meme' ? (
                        <>
                          使用 Bonding Curve 机制，无需添加流动性。达到一定金额后可上线到 DEX。
                        </>
                      ) : (
                        <>
                          使用 AMM 机制，需要添加流动性池。
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-400">选择钱包</Label>
                    <select
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                      value={launchForm.walletId}
                      onChange={(e) => {
                        const selectedWallet = wallets.find(w => w.id === e.target.value);
                        setLaunchForm({
                          ...launchForm,
                          walletId: e.target.value,
                          chain: selectedWallet?.chain || 'solana'
                        });
                      }}
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
                    <Label className="text-gray-400">代币介绍</Label>
                    <textarea
                      className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2 min-h-[100px] resize-y"
                      placeholder="简要介绍你的代币，比如代币的故事、用途、愿景等..."
                      value={launchForm.tokenDescription}
                      onChange={(e) => setLaunchForm({...launchForm, tokenDescription: e.target.value})}
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
                  
                  {/* 媒体链接 */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <Label className="text-gray-300 font-semibold">媒体链接 (可选)</Label>
                    <div>
                      <Label className="text-gray-400 text-sm">网站</Label>
                      <Input
                        className="mt-1 bg-black/50 border-white/10 text-white"
                        placeholder="https://your-website.com"
                        value={launchForm.website}
                        onChange={(e) => setLaunchForm({...launchForm, website: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Twitter</Label>
                      <Input
                        className="mt-1 bg-black/50 border-white/10 text-white"
                        placeholder="https://twitter.com/yourhandle"
                        value={launchForm.twitter}
                        onChange={(e) => setLaunchForm({...launchForm, twitter: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Telegram</Label>
                      <Input
                        className="mt-1 bg-black/50 border-white/10 text-white"
                        placeholder="https://t.me/yourchannel"
                        value={launchForm.telegram}
                        onChange={(e) => setLaunchForm({...launchForm, telegram: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Discord</Label>
                      <Input
                        className="mt-1 bg-black/50 border-white/10 text-white"
                        placeholder="https://discord.gg/yourinvite"
                        value={launchForm.discord}
                        onChange={(e) => setLaunchForm({...launchForm, discord: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  {/* 流动性配置（做市值）- 仅适用于 AMM DEX */}
                  {launchForm.platform !== 'pump.fun' && launchForm.platform !== 'four.meme' && (
                    <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300 font-semibold flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-400" />
                          自动添加流动性（做市值）
                        </Label>
                        <input
                          type="checkbox"
                          checked={launchForm.addLiquidity}
                          onChange={(e) => setLaunchForm({...launchForm, addLiquidity: e.target.checked})}
                          className="w-5 h-5 rounded border-white/20 bg-black/50 text-purple-600 focus:ring-purple-500"
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        自动将代币添加到去中心化交易所（{launchForm.platform}），创建交易对并提供流动性，让代币可以交易
                      </p>
                    
                    {launchForm.addLiquidity && (
                      <div className="space-y-3 mt-3 pl-4 border-l-2 border-blue-500/50">
                        {/* 流动性代币数量 */}
                        <div>
                          <Label className="text-gray-400 text-sm">流动性代币数量（供应量比例）</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              className="bg-black/50 border-white/10 text-white"
                              placeholder="50"
                              type="number"
                              min="1"
                              max="100"
                              value={launchForm.liquidityTokenPercent}
                              onChange={(e) => setLaunchForm({...launchForm, liquidityTokenPercent: e.target.value})}
                            />
                            <span className="text-gray-300 text-sm">%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            将使用总供应量的 {launchForm.liquidityTokenPercent}% 用于添加流动性
                          </p>
                        </div>
                        
                        {/* 配对代币 */}
                        <div>
                          <Label className="text-gray-400 text-sm">配对代币</Label>
                          <select
                            className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2 text-sm"
                            value={launchForm.pairTokenSymbol}
                            onChange={(e) => setLaunchForm({...launchForm, pairTokenSymbol: e.target.value})}
                          >
                            <option value="auto">自动选择（推荐）</option>
                            <option value="SOL">SOL</option>
                            <option value="USDC">USDC</option>
                            <option value="USDT">USDT</option>
                            <option value="ETH">ETH</option>
                            <option value="WETH">WETH</option>
                            <option value="BNB">BNB</option>
                          </select>
                        </div>
                        
                        {/* 配对代币数量 */}
                        <div>
                          <Label className="text-gray-400 text-sm">配对代币数量</Label>
                          <Input
                            className="mt-1 bg-black/50 border-white/10 text-white"
                            placeholder="1"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={launchForm.pairTokenAmount}
                            onChange={(e) => setLaunchForm({...launchForm, pairTokenAmount: e.target.value})}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            需要投入的配对代币数量（如 1 SOL）
                          </p>
                        </div>
                        
                        {/* 锁定流动性 */}
                        <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                          <div>
                            <Label className="text-gray-300 text-sm">锁定流动性</Label>
                            <p className="text-xs text-gray-500 mt-1">
                              锁定流动性池以增强投资者信心
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={launchForm.lockLiquidity}
                            onChange={(e) => setLaunchForm({...launchForm, lockLiquidity: e.target.checked})}
                            className="w-5 h-5 rounded border-white/20 bg-black/50 text-purple-600 focus:ring-purple-500"
                          />
                        </div>
                        
                        {/* 锁定期 */}
                        {launchForm.lockLiquidity && (
                          <div>
                            <Label className="text-gray-400 text-sm">锁定期（天）</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                className="bg-black/50 border-white/10 text-white"
                                placeholder="7"
                                type="number"
                                min="1"
                                max="365"
                                value={launchForm.lockDuration}
                                onChange={(e) => setLaunchForm({...launchForm, lockDuration: e.target.value})}
                              />
                              <span className="text-gray-300 text-sm">天</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              流动性将被锁定 {launchForm.lockDuration} 天，期间不可撤回
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )}
                  
                  {/* 同步闪电卖出配置 */}
                  <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300 font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        同步闪电卖出（与发币同步执行）
                      </Label>
                      <input
                        type="checkbox"
                        checked={launchForm.autoFlashSellEnabled}
                        onChange={(e) => setLaunchForm({...launchForm, autoFlashSellEnabled: e.target.checked})}
                        className="w-5 h-5 rounded border-white/20 bg-black/50 text-yellow-600 focus:ring-yellow-500"
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      在发币后执行闪电卖出，锁定利润，避免后续价格波动风险
                    </p>
                    {launchForm.autoFlashSellEnabled && (
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label className="text-gray-400 text-sm">卖出比例</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              className="bg-black/50 border-white/10 text-white"
                              placeholder="50"
                              type="number"
                              min="1"
                              max="100"
                              value={launchForm.autoFlashSellPercentage}
                              onChange={(e) => setLaunchForm({...launchForm, autoFlashSellPercentage: e.target.value})}
                            />
                            <span className="text-gray-300 text-sm">%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            卖出捆绑买入数量的 {launchForm.autoFlashSellPercentage}%，快速锁定利润
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-400 text-sm">延迟时间</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              className="bg-black/50 border-white/10 text-white"
                              placeholder="0"
                              type="number"
                              min="0"
                              value={launchForm.autoFlashSellDelay}
                              onChange={(e) => setLaunchForm({...launchForm, autoFlashSellDelay: e.target.value})}
                            />
                            <span className="text-gray-300 text-sm">秒</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {launchForm.autoFlashSellDelay === '0' 
                              ? '立即执行：在发币完成后立即执行闪电卖出'
                              : `延迟执行：在发币完成后等待 ${launchForm.autoFlashSellDelay} 秒再执行闪电卖出`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300 font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        创作者捆绑买入（可选）
                      </Label>
                      <input
                        type="checkbox"
                        checked={launchForm.bundleBuyEnabled}
                        onChange={(e) => setLaunchForm({...launchForm, bundleBuyEnabled: e.target.checked})}
                        className="w-5 h-5 rounded border-white/20 bg-black/50 text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {launchForm.bundleBuyEnabled 
                        ? '启用后将自动在发币后立即用指定金额购买代币，成为第一个买家。'
                        : '不启用捆绑买入，代币发布后您不会自动购买。'}
                    </p>
                    
                    {/* 捆绑买入配置 - 仅在启用时显示 */}
                    {launchForm.bundleBuyEnabled && (
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400 text-sm">使用指定代币购买</Label>
                          <input
                            type="checkbox"
                            checked={launchForm.useSpecifiedTokenForBundleBuy}
                            onChange={(e) => setLaunchForm({...launchForm, useSpecifiedTokenForBundleBuy: e.target.checked})}
                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-purple-600 focus:ring-purple-500"
                          />
                        </div>
                        
                        {/* 购买代币选择器 - 仅在使用指定代币时显示 */}
                        {launchForm.useSpecifiedTokenForBundleBuy && (
                        <div className="mb-3">
                          <Label className="text-gray-400 text-sm">购买代币</Label>
                          <select
                            className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2 text-sm"
                            value={launchForm.bundleBuyTokenSymbol}
                            onChange={(e) => setLaunchForm({...launchForm, bundleBuyTokenSymbol: e.target.value})}
                          >
                            <option value="">请选择购买代币</option>
                            <option value="BNB">BNB</option>
                            <option value="SOL">SOL</option>
                            <option value="ETH">ETH</option>
                            <option value="USDC">USDC</option>
                            <option value="USDT">USDT</option>
                            <option value="WETH">WETH</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            使用指定代币进行购买
                          </p>
                        </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <Input
                            className="bg-black/50 border-white/10 text-white flex-1"
                            placeholder="0.1"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={launchForm.bundleBuyAmount}
                            onChange={(e) => setLaunchForm({...launchForm, bundleBuyAmount: e.target.value})}
                          />
                          <span className="text-gray-300 whitespace-nowrap">{launchForm.bundleBuyTokenSymbol || 'USDC'}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          推荐值：0.1 - 0.5 • 将自动创建持仓并启用闪电卖出监控
                        </p>
                      </div>
                    )}
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
            {/* 快速闪电卖出 */}
            <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  快速闪电卖出
                </CardTitle>
                <CardDescription className="text-gray-400">
                  选择持有代币，一键快速卖出
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* 代币选择器 - 多选模式 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white">选择要卖出的代币</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (selectedPortfolioIds.length === portfolios.filter(p => p.status === 'active').length) {
                            setSelectedPortfolioIds([]);
                          } else {
                            setSelectedPortfolioIds(portfolios.filter(p => p.status === 'active').map(p => p.id));
                          }
                        }}
                        className="text-purple-400 hover:text-purple-300 text-xs"
                      >
                        {selectedPortfolioIds.length === portfolios.filter(p => p.status === 'active').length ? '取消全选' : '全选'}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {portfolios.filter(p => p.status === 'active').map(portfolio => (
                        <label key={portfolio.id} className="flex items-center p-3 bg-black/50 border border-white/10 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors">
                          <input
                            type="checkbox"
                            className="w-4 h-4 mr-3 accent-purple-600"
                            checked={selectedPortfolioIds.includes(portfolio.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPortfolioIds(prev => [...prev, portfolio.id]);
                              } else {
                                setSelectedPortfolioIds(prev => prev.filter(id => id !== portfolio.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{portfolio.tokenSymbol}</span>
                              <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">
                                {portfolio.chain.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-gray-400">
                                持有: {parseFloat(portfolio.amount).toLocaleString()}
                              </span>
                              <span className={`text-xs font-medium ${
                                parseFloat(portfolio.profitLossPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {portfolio.profitLossPercent ? `${parseFloat(portfolio.profitLossPercent).toFixed(2)}%` : '-'}
                              </span>
                            </div>
                            {portfolio.tokenName && (
                              <p className="text-xs text-gray-500 mt-1">{portfolio.tokenName}</p>
                            )}
                          </div>
                        </label>
                      ))}
                      {portfolios.filter(p => p.status === 'active').length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          暂无活跃持仓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 卖出信息显示 */}
                  {selectedPortfolioIds.length > 0 && (
                    <div className="p-4 bg-black/30 rounded-lg border border-white/10 space-y-3">
                      <div className="text-white font-medium mb-2">
                        已选择 {selectedPortfolioIds.length} 个代币
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">滑点设置</p>
                          <Input
                            type="number"
                            className="w-24 h-8 bg-black/50 border-white/10 text-white text-sm"
                            placeholder="5"
                            value={sellForm.slippage}
                            onChange={(e) => setSellForm(prev => ({ ...prev, slippage: e.target.value }))}
                          />
                          <span className="text-xs text-gray-500 ml-1">%</span>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-2">卖出比例</p>
                        </div>
                      </div>

                      {/* 快速比例选择 */}
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-gray-500 text-sm mb-2">选择卖出比例</p>
                        <div className="flex flex-wrap gap-2">
                          {[25, 50, 75, 100].map(percentage => (
                            <Button
                              key={percentage}
                              variant={sellPercentage === percentage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSellPercentage(percentage)}
                              disabled={isSelling || selectedPortfolioIds.length === 0}
                              className={
                                sellPercentage === percentage
                                  ? "bg-purple-600 hover:bg-purple-700"
                                  : "border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                              }
                            >
                              {percentage}%
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* 执行卖出按钮 */}
                      {sellPercentage && (
                        <div className="pt-2 border-t border-white/10">
                          <Button
                            onClick={() => handleBatchFlashSell(sellPercentage)}
                            disabled={isSelling || selectedPortfolioIds.length === 0}
                            className="bg-red-600 hover:bg-red-700 w-full"
                          >
                            {isSelling ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                批量卖出中...
                              </>
                            ) : (
                              <>
                                <Zap className="mr-2 h-4 w-4" />
                                批量卖出 {sellPercentage}%
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* 选中的代币列表预览 */}
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-gray-500 text-xs mb-2">待卖出代币:</p>
                        <div className="space-y-1">
                          {selectedPortfolioIds.map(id => {
                            const portfolio = portfolios.find(p => p.id === id);
                            if (!portfolio) return null;
                            return (
                              <div key={id} className="flex justify-between text-xs text-gray-400">
                                <span>{portfolio.tokenSymbol}</span>
                                <span>
                                  {sellPercentage === 100
                                    ? `全部: ${parseFloat(portfolio.amount).toLocaleString()}`
                                    : `${sellPercentage}%: ${(parseFloat(portfolio.amount) * (sellPercentage! / 100)).toLocaleString()}`
                                  }
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  💡 提示：勾选多个代币后，选择卖出比例，点击"批量卖出"即可快速执行闪电卖出。交易将通过 DEX（Raydium/PancakeSwap/Uniswap）自动执行。
                </p>
              </CardContent>
            </Card>

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

                            {/* 自动闪电卖出状态 */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                              <div className="flex items-center gap-2">
                                {portfolio.autoSellEnabled ? (
                                  <Badge className="bg-green-600">
                                    <Zap className="mr-1 h-3 w-3" />
                                    自动闪电卖出已启用
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    自动闪电卖出未启用
                                  </Badge>
                                )}
                                {portfolio.autoSellEnabled && portfolio.autoSellType && (
                                  <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">
                                    {portfolio.autoSellType === 'profit' ? '利润触发' :
                                     portfolio.autoSellType === 'whale' ? '大额买入触发' : '利润+大额买入'}
                                  </Badge>
                                )}
                                {portfolio.autoSellStatus === 'triggered' && (
                                  <Badge className="bg-yellow-600 animate-pulse">执行中...</Badge>
                                )}
                                {portfolio.autoSellStatus === 'completed' && (
                                  <Badge className="bg-blue-600">已完成</Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openAutoSellConfig(portfolio)}
                                className="text-purple-400 hover:text-purple-300 h-7"
                              >
                                <Settings className="mr-1 h-3 w-3" />
                                配置
                              </Button>
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

            {/* 自动闪电卖出监控按钮 */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  自动闪电卖出监控
                </CardTitle>
                <CardDescription className="text-gray-400">
                  手动触发监控，检查是否满足自动卖出条件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => handleMonitorPortfolios()}
                    disabled={isMonitoring}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isMonitoring ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        监控中...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        手动触发监控
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-gray-400">
                    自动检查所有启用了闪电卖出的持仓，当达到利润目标或检测到大额买入时自动卖出
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowJitoConfig(!showJitoConfig)}
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Jito 配置
                  </Button>
                </div>
                
                {/* Jito 配置面板 */}
                {showJitoConfig && (
                  <div className="mt-4 p-4 bg-black/30 rounded-lg border border-yellow-500/30">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      Jito Shred Key 配置（Solana 交易加速）
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-400 mb-2 block">
                          {jitoShredKey ? '当前已配置（仅显示掩码）' : 'Jito Shred Key'}
                        </Label>
                        {jitoShredKey ? (
                          <div className="bg-black/50 border border-white/10 rounded-md p-3 text-white font-mono text-sm">
                            {jitoShredKey}
                          </div>
                        ) : (
                          <Input
                            type="text"
                            placeholder="输入你的 Jito Shred Key"
                            value={jitoShredKey}
                            onChange={(e) => setJitoShredKey(e.target.value)}
                            className="bg-black/50 border-white/10 text-white"
                          />
                        )}
                      </div>
                      {jitoShredKey ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setJitoShredKey('')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            更新配置
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDeleteJitoConfig}
                          >
                            删除配置
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleUpdateJitoConfig}
                            disabled={isUpdatingJito || !jitoShredKey}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            {isUpdatingJito ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                              </>
                            ) : (
                              '保存配置'
                            )}
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Jito Shred Key 用于加速 Solana 交易，确保闪电卖出的快速执行。配置后，所有 Solana 链的自动卖出交易将使用 Jito Bundle 提交。
                      </p>
                      <p className="text-xs text-orange-400">
                        ⚠️ 安全提示：Jito Shred Key 已加密存储，不会以明文形式传输到前端。
                      </p>
                    </div>
                  </div>
                )}
                
                {monitorResults && (
                  <div className="mt-4 p-4 bg-black/30 rounded-lg border border-white/10">
                    <p className="text-white font-medium mb-2">监控结果:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">监控持仓数</p>
                        <p className="text-white">{monitorResults.monitored}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">触发卖出数</p>
                        <p className="text-green-400">{monitorResults.autoSold}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 自动闪电卖出配置弹窗 */}
            {showAutoSellConfig && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
                <Card className="bg-black/90 border-white/20 backdrop-blur-sm max-w-2xl w-full max-h-[90vh] overflow-hidden">
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-400" />
                          配置自动闪电卖出
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          设置自动触发的条件和参数
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white"
                        onClick={() => setShowAutoSellConfig(null)}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 overflow-y-auto p-6">
                    <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg border border-white/10">
                      <Label className="text-gray-300 cursor-pointer" htmlFor="autoSellEnabled">
                        启用自动闪电卖出
                      </Label>
                      <input
                        id="autoSellEnabled"
                        type="checkbox"
                        checked={autoSellForm.autoSellEnabled}
                        onChange={(e) => setAutoSellForm({...autoSellForm, autoSellEnabled: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-xs text-gray-500">
                        开启后将根据条件自动执行闪电卖出
                      </span>
                    </div>

                    <div>
                      <Label className="text-gray-400 mb-2 block">触发类型</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant={autoSellForm.autoSellType === 'profit' ? 'default' : 'outline'}
                          onClick={() => setAutoSellForm({...autoSellForm, autoSellType: 'profit'})}
                          className={autoSellForm.autoSellType === 'profit' ? 'bg-green-600' : ''}
                        >
                          利润触发
                        </Button>
                        <Button
                          variant={autoSellForm.autoSellType === 'whale' ? 'default' : 'outline'}
                          onClick={() => setAutoSellForm({...autoSellForm, autoSellType: 'whale'})}
                          className={autoSellForm.autoSellType === 'whale' ? 'bg-blue-600' : ''}
                        >
                          大额买入触发
                        </Button>
                        <Button
                          variant={autoSellForm.autoSellType === 'both' ? 'default' : 'outline'}
                          onClick={() => setAutoSellForm({...autoSellForm, autoSellType: 'both'})}
                          className={autoSellForm.autoSellType === 'both' ? 'bg-purple-600' : ''}
                        >
                          两者都触发
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400 mb-2 block">利润目标 (%)</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={autoSellForm.profitTarget}
                          onChange={(e) => setAutoSellForm({...autoSellForm, profitTarget: e.target.value})}
                          className="bg-black/50 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 mb-2 block">止损 (%)</Label>
                        <Input
                          type="number"
                          placeholder="30"
                          value={autoSellForm.stopLoss}
                          onChange={(e) => setAutoSellForm({...autoSellForm, stopLoss: e.target.value})}
                          className="bg-black/50 border-white/10 text-white"
                        />
                      </div>
                    </div>

                    {autoSellForm.autoSellType === 'whale' || autoSellForm.autoSellType === 'both' ? (
                      <div>
                        <Label className="text-gray-400 mb-2 block">大额买入阈值 (原生代币)</Label>
                        <Input
                          type="number"
                          placeholder="0.5"
                          step="0.1"
                          value={autoSellForm.whaleBuyThreshold}
                          onChange={(e) => setAutoSellForm({...autoSellForm, whaleBuyThreshold: e.target.value})}
                          className="bg-black/50 border-white/10 text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          当检测到单笔买入超过此金额时自动卖出（如 0.5 ETH/SOL）
                        </p>
                      </div>
                    ) : null}

                    <div>
                      <Label className="text-gray-400 mb-2 block">自动卖出比例 (%)</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        min="0"
                        max="100"
                        value={autoSellForm.autoSellPercentage}
                        onChange={(e) => setAutoSellForm({...autoSellForm, autoSellPercentage: e.target.value})}
                        className="bg-black/50 border-white/10 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        触发自动卖出时，卖出持仓的百分比（100% 表示全部卖出）
                      </p>
                    </div>

                    {/* 定时卖出配置 */}
                    <div className="p-4 bg-black/30 rounded-lg border border-orange-500/30">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-400" />
                        定时卖出（针对无人买入的情况）
                      </h4>
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          id="timedSellEnabled"
                          type="checkbox"
                          checked={autoSellForm.timedSellEnabled || false}
                          onChange={(e) => {
                            const newForm = {...autoSellForm, timedSellEnabled: e.target.checked};
                            // 如果启用定时卖出，自动设置默认值
                            if (e.target.checked) {
                              newForm.timedSellSeconds = '5';
                            }
                            setAutoSellForm(newForm);
                          }}
                          className="w-5 h-5 rounded"
                        />
                        <Label className="text-gray-300 cursor-pointer" htmlFor="timedSellEnabled">
                          启用定时卖出
                        </Label>
                      </div>
                      
                      {autoSellForm.timedSellEnabled && (
                        <div className="space-y-2">
                          <Label className="text-gray-400 mb-2 block">定时秒数</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="5"
                              min="1"
                              step="1"
                              value={autoSellForm.timedSellSeconds || '5'}
                              onChange={(e) => setAutoSellForm({...autoSellForm, timedSellSeconds: e.target.value})}
                              className="bg-black/50 border-white/10 text-white w-32"
                            />
                            <span className="text-sm text-gray-400">秒</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {['1', '5', '10', '30', '60'].map((sec) => (
                              <Button
                                key={sec}
                                size="sm"
                                variant={autoSellForm.timedSellSeconds === sec ? 'default' : 'outline'}
                                onClick={() => setAutoSellForm({...autoSellForm, timedSellSeconds: sec})}
                                className={autoSellForm.timedSellSeconds === sec ? 'bg-orange-600' : ''}
                              >
                                {sec}秒
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            在发币后，如果在指定时间内无人买入，将自动执行闪电卖出
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateAutoSellConfig(showAutoSellConfig)}
                      disabled={isUpdatingAutoSell}
                    >
                      {isUpdatingAutoSell ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        '保存配置'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">转账</CardTitle>
                    <CardDescription className="text-gray-400">
                      向其他地址转账代币
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBatchTransferMode(!batchTransferMode)}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  >
                    {batchTransferMode ? (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        单笔转账
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        批量转账
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!batchTransferMode ? (
                  // 单笔转账
                  <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                    <div>
                      <Label className="text-gray-400">选择钱包</Label>
                      <select
                        className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                        value={transferForm.walletId}
                        onChange={(e) => {
                          const selectedWallet = wallets.find(w => w.id === e.target.value);
                          setTransferForm({
                            ...transferForm,
                            walletId: e.target.value,
                            chain: selectedWallet?.chain || 'solana',
                            tokenSymbol: selectedWallet?.chain === 'solana' ? 'SOL' : selectedWallet?.chain === 'bsc' ? 'BNB' : 'ETH'
                          });
                        }}
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
                      <Label className="text-gray-400">区块链网络</Label>
                      <select
                        className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                        value={transferForm.chain}
                        onChange={(e) => setTransferForm({
                          ...transferForm,
                          chain: e.target.value,
                          tokenSymbol: e.target.value === 'solana' ? 'SOL' : e.target.value === 'bsc' ? 'BNB' : 'ETH'
                        })}
                      >
                        <option value="solana">Solana</option>
                        <option value="bsc">BSC (BNB Chain)</option>
                        <option value="eth">Ethereum</option>
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
                        placeholder="留空转账原生代币"
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
                ) : (
                  // 批量转账
                  <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/10">
                    <div>
                      <Label className="text-gray-400">选择钱包</Label>
                      <select
                        className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                        value={transferForm.walletId}
                        onChange={(e) => {
                          const selectedWallet = wallets.find(w => w.id === e.target.value);
                          setTransferForm({
                            ...transferForm,
                            walletId: e.target.value,
                            chain: selectedWallet?.chain || 'solana',
                            tokenSymbol: selectedWallet?.chain === 'solana' ? 'SOL' : selectedWallet?.chain === 'bsc' ? 'BNB' : 'ETH'
                          });
                        }}
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
                      <Label className="text-gray-400">区块链网络</Label>
                      <select
                        className="mt-1 w-full bg-black/50 border border-white/10 text-white rounded-md p-2"
                        value={transferForm.chain}
                        onChange={(e) => setTransferForm({
                          ...transferForm,
                          chain: e.target.value,
                          tokenSymbol: e.target.value === 'solana' ? 'SOL' : e.target.value === 'bsc' ? 'BNB' : 'ETH'
                        })}
                      >
                        <option value="solana">Solana</option>
                        <option value="bsc">BSC (BNB Chain)</option>
                        <option value="eth">Ethereum</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-gray-400">代币符号</Label>
                      <Input
                        className="mt-1 bg-black/50 border-white/10 text-white"
                        placeholder="留空转账原生代币"
                        value={transferForm.tokenSymbol}
                        onChange={(e) => setTransferForm({...transferForm, tokenSymbol: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-400">批量转账列表</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBatchTransfers([...batchTransfers, { toAddress: '', amount: '' }])}
                          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          添加
                        </Button>
                      </div>
                      {batchTransfers.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          点击"添加"按钮添加转账记录
                        </p>
                      )}
                      {batchTransfers.map((transfer, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Input
                              className="bg-black/50 border-white/10 text-white"
                              placeholder="接收地址"
                              value={transfer.toAddress}
                              onChange={(e) => {
                                const newTransfers = [...batchTransfers];
                                newTransfers[index].toAddress = e.target.value;
                                setBatchTransfers(newTransfers);
                              }}
                            />
                            <Input
                              className="bg-black/50 border-white/10 text-white"
                              placeholder="数量"
                              type="number"
                              step="0.0001"
                              value={transfer.amount}
                              onChange={(e) => {
                                const newTransfers = [...batchTransfers];
                                newTransfers[index].amount = e.target.value;
                                setBatchTransfers(newTransfers);
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newTransfers = batchTransfers.filter((_, i) => i !== index);
                              setBatchTransfers(newTransfers);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {batchTransfers.length > 0 && (
                      <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">总转账数量</span>
                          <span className="text-white font-semibold">
                            {batchTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toFixed(4)} {transferForm.tokenSymbol || transferForm.chain.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-400">预估 Gas 费用</span>
                          <span className="text-white font-semibold">
                            ~{batchTransfers.length * 0.001} {transferForm.chain.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleBatchTransfer}
                      disabled={isBatchTransferring || batchTransfers.length === 0}
                    >
                      {isBatchTransferring ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          批量转账中...
                        </>
                      ) : (
                        <>
                          <Users className="mr-2 h-4 w-4" />
                          确认批量转账 ({batchTransfers.length} 笔)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">交易历史</CardTitle>
                    <CardDescription className="text-gray-400">
                      查看所有交易记录
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 交易类型筛选 */}
                    <select
                      value={transactionFilter.type || 'all'}
                      onChange={(e) => setTransactionFilter({ ...transactionFilter, type: e.target.value === 'all' ? undefined : e.target.value })}
                      className="bg-black/50 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">全部类型</option>
                      <option value="launch">🚀 发币</option>
                      <option value="buy">💰 买入</option>
                      <option value="sell">💸 卖出</option>
                      <option value="transfer">📤 转账</option>
                      <option value="add_liquidity">💧 添加流动性</option>
                    </select>
                    {/* 链筛选 */}
                    <select
                      value={transactionFilter.chain || 'all'}
                      onChange={(e) => setTransactionFilter({ ...transactionFilter, chain: e.target.value === 'all' ? undefined : e.target.value })}
                      className="bg-black/50 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">全部链</option>
                      <option value="solana">Solana</option>
                      <option value="eth">Ethereum</option>
                      <option value="bsc">BSC</option>
                    </select>
                    {/* 刷新按钮 */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadTransactions}
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                              {tx.type === 'add_liquidity' && '💧 添加流动性'}
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
        </Tabs>
      </main>
    </div>
  );
}
