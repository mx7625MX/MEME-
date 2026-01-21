import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { transactions, tokens, portfolios, liquidityPools, wallets } from '@/storage/database/shared/schema';
import { insertTransactionSchema, insertTokenSchema, insertPortfolioSchema, insertLiquidityPoolSchema } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// DEX 配置
const DEX_CONFIG: Record<string, {
  default: string;
  pairTokens: Record<string, string>;
}> = {
  solana: {
    default: 'raydium',
    pairTokens: {
      SOL: 'So11111111111111111111111111111111111111112',
    },
  },
  eth: {
    default: 'uniswap',
    pairTokens: {
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
  },
  bsc: {
    default: 'pancakeswap',
    pairTokens: {
      USDT: '0x55d398326f99059fF775485246999027B3197955',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // 验证必填字段
    const { walletId, chain, platform, tokenName, tokenSymbol, totalSupply, liquidity, imageUrl, imageKey, bundleBuyAmount } = body;

    if (!walletId || !chain || !platform || !tokenName || !tokenSymbol || !totalSupply) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: walletId, chain, platform, tokenName, tokenSymbol, totalSupply' },
        { status: 400 }
      );
    }

    // 判断是否为 Bonding Curve 平台（pump.fun、four.meme）
    const isBondingCurvePlatform = platform === 'pump.fun' || platform === 'four.meme';

    // 创作者捆绑买入逻辑 - 必须是第一个买家
    // bundleBuyAmount 是原生代币金额（如 0.1 SOL），需要根据初始价格计算能买多少代币
    const bundleBuyNativeAmount = bundleBuyAmount || 0.1; // 默认 0.1 SOL/BNB/ETH
    const initialPrice = '0.000001'; // 初始价格（原生代币/代币）
    
    // 计算能买多少代币：代币数量 = 原生代币金额 / 初始价格
    const bundleBuyTokenAmount = Math.floor(parseFloat(bundleBuyNativeAmount) / parseFloat(initialPrice));
    const bundleBuyCost = bundleBuyNativeAmount.toString(); // 实际投入的原生代币金额

    // 模拟代币发行逻辑（实际应用中需要调用区块链网络）
    // 这里我们创建一个代币地址和记录
    const mockTokenAddress = `0x${Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    
    // 创建代币记录
    const tokenMetadata: any = {
      creator: walletId,
      description: `${tokenName} (${tokenSymbol}) - Launch via Meme Master Pro`,
    };
    
    // 如果有图片信息，添加到 metadata 中
    if (imageUrl && imageKey) {
      tokenMetadata.imageUrl = imageUrl;
      tokenMetadata.imageKey = imageKey;
    }
    
    const newToken = {
      chain,
      address: mockTokenAddress,
      symbol: tokenSymbol,
      name: tokenName,
      decimals: 18,
      totalSupply: totalSupply.toString(),
      liquidity: liquidity ? liquidity.toString() : '0',
      price: '0.000001',
      isHot: false,
      metadata: tokenMetadata
    };

    const validatedTokenData = insertTokenSchema.parse(newToken);
    const [token] = await db.insert(tokens)
      .values(validatedTokenData)
      .returning();

    // 创建交易记录
    const newTransaction = {
      walletId,
      type: 'launch' as const,
      chain,
      tokenAddress: mockTokenAddress,
      tokenSymbol,
      amount: totalSupply.toString(),
      price: '0',
      fee: '0.01', // 假设 0.01 ETH/SOL 作为发行费用
      status: 'completed' as const,
      metadata: {
        tokenName,
        totalSupply,
        liquidity,
        txHash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
      }
    };

    const validatedTxData = insertTransactionSchema.parse(newTransaction);
    const [transaction] = await db.insert(transactions)
      .values(validatedTxData)
      .returning();

    // 创作者捆绑买入交易记录（必须是第一个买家）
    const bundleBuyTx = {
      walletId,
      type: 'buy' as const,
      chain,
      tokenAddress: mockTokenAddress,
      tokenSymbol,
      amount: bundleBuyTokenAmount.toString(),
      price: initialPrice,
      fee: (parseFloat(bundleBuyCost) * 0.001).toString(), // 0.1% 交易费
      status: 'completed' as const,
      metadata: {
        bundleBuy: true, // 标记为捆绑买入
        bundleBuyNativeAmount: bundleBuyNativeAmount,
        bundleBuyTokenAmount: bundleBuyTokenAmount,
        txHash: `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
        isFirstBuyer: true, // 标记为第一个买家
      }
    };

    const validatedBundleBuyTxData = insertTransactionSchema.parse(bundleBuyTx);
    const [bundleBuyTransaction] = await db.insert(transactions)
      .values(validatedBundleBuyTxData)
      .returning();

    // 自动创建持仓记录（创作者模式）
    // 创作者持有剩余的供应量（总供应量 - 捆绑买入数量）
    const creatorHoldingAmount = (parseFloat(totalSupply) - bundleBuyTokenAmount).toString();
    const totalBuyAmount = bundleBuyCost; // 实际投入的原生代币金额

    const newPortfolio = {
      walletId,
      chain,
      tokenAddress: mockTokenAddress,
      tokenSymbol,
      tokenName,
      amount: creatorHoldingAmount, // 持有剩余的供应量
      buyPrice: initialPrice,
      buyAmount: totalBuyAmount, // 实际投入的原生代币金额
      currentPrice: initialPrice,
      profitTarget: body.profitTarget || '100', // 默认利润目标 100%
      stopLoss: body.stopLoss || '30', // 默认止损 30%
      totalInvested: totalBuyAmount,
      totalValue: totalBuyAmount,
      profitLoss: '0',
      profitLossPercent: '0',
      status: 'active',
      // 启用自动闪电卖出
      autoSellEnabled: body.autoSellEnabled !== false, // 默认启用
      autoSellType: body.autoSellType || 'both', // 默认同时监测利润和大额买入
      whaleBuyThreshold: body.whaleBuyThreshold || '0.5', // 默认大额买入阈值 0.5 ETH/SOL
      autoSellPercentage: body.autoSellPercentage || '100', // 默认全部卖出
      autoSellStatus: 'idle',
      // 启用定时卖出（针对无人买入的情况）
      timedSellEnabled: body.timedSellEnabled !== false, // 默认启用
      timedSellSeconds: body.timedSellSeconds || 5, // 默认 5 秒
      timedSellScheduledAt: new Date(Date.now() + (body.timedSellSeconds || 5) * 1000), // 预定 5 秒后执行
      timedSellExecutedAt: null,
      metadata: {
        creatorMode: true,
        launchTxHash: (transaction.metadata as any)?.txHash,
        bundleBuyTxHash: (bundleBuyTransaction.metadata as any)?.txHash, // 捆绑买入交易哈希
        bundleBuyNativeAmount: bundleBuyNativeAmount,
        bundleBuyTokenAmount: bundleBuyTokenAmount,
        isFirstBuyer: true, // 标记为第一个买家
        liquidityPool: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      }
    };

    const validatedPortfolioData = insertPortfolioSchema.parse(newPortfolio);
    const [portfolio] = await db.insert(portfolios)
      .values(validatedPortfolioData)
      .returning();

    // ========================================
    // 自动添加流动性（做市值）- 仅适用于 AMM DEX
    // ========================================
    let liquidityPool = null;
    let liquidityTransaction = null;
    
    // Bonding Curve 平台（pump.fun、four.meme）不需要添加流动性
    if (body.addLiquidity !== false && !isBondingCurvePlatform) {
      const liquidityTokenAmount = body.liquidityTokenAmount || (parseFloat(totalSupply) * 0.5).toString(); // 默认使用 50% 供应量
      const liquidityPairTokenAmount = body.liquidityPairTokenAmount || '1'; // 默认配对 1 SOL/ETH/USDT
      
      // 获取钱包信息
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      
      // 选择 DEX 和配对代币
      const chainConfig = DEX_CONFIG[chain];
      const selectedDex = body.platform || chainConfig?.default || 'auto'; // 优先使用选择的平台
      const defaultPairToken = Object.keys(chainConfig?.pairTokens || {})[0];
      const selectedPairTokenSymbol = body.pairTokenSymbol || defaultPairToken;
      const pairTokenAddress = chainConfig?.pairTokens?.[selectedPairTokenSymbol];
      
      // 计算初始价格
      const initialPrice = parseFloat(liquidityPairTokenAmount) / parseFloat(liquidityTokenAmount);
      
      // 模拟流动性池地址
      const mockPoolAddress = `0x${Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      
      const mockLiquidityTxHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      
      // 计算锁定期
      const lockLiquidity = body.lockLiquidity !== false; // 默认锁定
      const lockDuration = body.lockDuration || 7; // 默认 7 天
      const lockEndTime = lockLiquidity 
        ? new Date(Date.now() + lockDuration * 24 * 60 * 60 * 1000)
        : null;
      
      // 创建流动性池记录
      const newLiquidityPool = {
        chain,
        tokenAddress: mockTokenAddress,
        tokenSymbol,
        pairTokenSymbol: selectedPairTokenSymbol,
        pairTokenAddress,
        dex: selectedDex,
        poolAddress: mockPoolAddress,
        tokenAmount: liquidityTokenAmount,
        pairTokenAmount: liquidityPairTokenAmount,
        totalLiquidity: (parseFloat(liquidityTokenAmount) * initialPrice * 2).toString(),
        lpTokenAmount: (Math.sqrt(parseFloat(liquidityTokenAmount) * parseFloat(liquidityPairTokenAmount))).toString(),
        initialPrice: initialPrice.toString(),
        status: 'active',
        locked: lockLiquidity,
        lockEndTime,
        metadata: {
          dexName: selectedDex,
          txHash: mockLiquidityTxHash,
          launchTxHash: (transaction.metadata as any)?.txHash,
          lockDuration,
        }
      };
      
      const validatedPoolData = insertLiquidityPoolSchema.parse(newLiquidityPool);
      [liquidityPool] = await db.insert(liquidityPools)
        .values(validatedPoolData)
        .returning();
      
      // 创建流动性添加交易记录
      const newLiquidityTransaction = {
        walletId,
        type: 'add_liquidity' as const,
        chain,
        tokenAddress: mockTokenAddress,
        tokenSymbol,
        amount: liquidityTokenAmount,
        price: initialPrice.toString(),
        fee: (parseFloat(liquidityPairTokenAmount) * 0.003).toString(),
        status: 'completed' as const,
        metadata: {
          pairTokenSymbol: selectedPairTokenSymbol,
          pairTokenAmount: liquidityPairTokenAmount,
          dex: selectedDex,
          poolAddress: mockPoolAddress,
          txHash: mockLiquidityTxHash,
          locked: lockLiquidity,
          lockDuration,
        }
      };
      
      const validatedLiquidityTxData = insertTransactionSchema.parse(newLiquidityTransaction);
      [liquidityTransaction] = await db.insert(transactions)
        .values(validatedLiquidityTxData)
        .returning();
      
      // 更新代币的流动性和价格
      await db.update(tokens)
        .set({
          liquidity: liquidityPool.totalLiquidity,
          price: initialPrice.toString(),
          marketCap: (parseFloat(totalSupply) * initialPrice).toString(),
          updatedAt: new Date(),
        })
        .where(eq(tokens.address, mockTokenAddress));
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        transaction,
        bundleBuyTransaction, // 捆绑买入交易记录
        portfolio,
        liquidityPool,
        liquidityTransaction,
        message: isBondingCurvePlatform
          ? `代币发行成功！已在 ${body.platform} 上线（Bonding Curve 机制）。您是第一个买家（投入 ${bundleBuyNativeAmount} ${chain.toUpperCase()}，买入 ${bundleBuyTokenAmount} ${tokenSymbol}）。当交易量达到一定阈值后，将自动上线到 DEX。`
          : liquidityPool
          ? `代币发行成功！已自动添加流动性到 ${liquidityPool.metadata?.dexName || 'DEX'}（${tokenSymbol}/${liquidityPool.pairTokenSymbol}），已锁定 ${body.lockDuration || 7} 天。您是第一个买家（投入 ${bundleBuyNativeAmount} ${chain.toUpperCase()}，买入 ${bundleBuyTokenAmount} ${tokenSymbol}）`
          : `代币发行成功！已自动创建持仓并启用闪电卖出监控。您是第一个买家（投入 ${bundleBuyNativeAmount} ${chain.toUpperCase()}，买入 ${bundleBuyTokenAmount} ${tokenSymbol}）`
      }
    });

  } catch (error) {
    console.error('Launch token error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '代币发行失败' 
      },
      { status: 500 }
    );
  }
}
