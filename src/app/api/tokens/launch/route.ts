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
    const { walletId, chain, platform, tokenName, tokenSymbol, totalSupply, liquidity, imageUrl, imageKey, bundleBuyEnabled, useSpecifiedTokenForBundleBuy, bundleBuyAmount, bundleBuyTokenSymbol, website, twitter, telegram, discord } = body;

    if (!walletId || !chain || !platform || !tokenName || !tokenSymbol || !totalSupply) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段: walletId, chain, platform, tokenName, tokenSymbol, totalSupply' },
        { status: 400 }
      );
    }

    // 判断是否为 Bonding Curve 平台（pump.fun、four.meme）
    const isBondingCurvePlatform = platform === 'pump.fun' || platform === 'four.meme';

    // 创作者捆绑买入逻辑 - 可选
    let bundleBuyNativeAmount = null;
    let bundleBuyTokenAmount = 0;
    let bundleBuyCost = null;
    let bundleBuyTokenSymbolFinal = null;
    
    if (bundleBuyEnabled !== false) {
      // 启用捆绑买入
      bundleBuyNativeAmount = bundleBuyAmount || '0.1'; // 默认 0.1 SOL/BNB/ETH
      
      // 确定使用的购买代币符号
      let buyTokenSymbol;
      if (useSpecifiedTokenForBundleBuy && bundleBuyTokenSymbol) {
        // 用户指定了代币，使用用户指定的
        buyTokenSymbol = bundleBuyTokenSymbol;
      } else {
        // 用户没有指定代币，根据链自动选择原生代币
        switch (chain) {
          case 'solana':
            buyTokenSymbol = 'SOL';
            break;
          case 'bsc':
            buyTokenSymbol = 'BNB';
            break;
          case 'eth':
            buyTokenSymbol = 'ETH';
            break;
          default:
            buyTokenSymbol = 'SOL';
        }
      }
      
      const initialPrice = '0.000001'; // 初始价格（购买代币/代币）
      
      // 计算能买多少代币：代币数量 = 购买代币金额 / 初始价格
      bundleBuyTokenAmount = Math.floor(parseFloat(bundleBuyNativeAmount) / parseFloat(initialPrice));
      bundleBuyCost = bundleBuyNativeAmount.toString(); // 实际投入的购买代币金额
      bundleBuyTokenSymbolFinal = buyTokenSymbol; // 使用的购买代币符号
    }

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
      website: (website && website.trim()) || null,
      twitter: (twitter && twitter.trim()) || null,
      telegram: (telegram && telegram.trim()) || null,
      discord: (discord && discord.trim()) || null,
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

    // 创作者捆绑买入交易记录（仅在启用时创建）
    let bundleBuyTransaction = null;
    if (bundleBuyEnabled !== false) {
      const initialPrice = '0.000001'; // 初始价格（购买代币/代币）
      const bundleBuyTx = {
        walletId,
        type: 'buy' as const,
        chain,
        tokenAddress: mockTokenAddress,
        tokenSymbol,
        amount: bundleBuyTokenAmount.toString(),
        price: initialPrice,
        fee: (parseFloat(bundleBuyCost!) * 0.001).toString(), // 0.1% 交易费
        status: 'completed' as const,
        metadata: {
          bundleBuy: true, // 标记为捆绑买入
          bundleBuyNativeAmount: bundleBuyNativeAmount,
          bundleBuyTokenAmount: bundleBuyTokenAmount,
          bundleBuyTokenSymbol: bundleBuyTokenSymbolFinal, // 使用的购买代币符号
          txHash: `0x${Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join('')}`,
          isFirstBuyer: true, // 标记为第一个买家
        }
      };

      const validatedBundleBuyTxData = insertTransactionSchema.parse(bundleBuyTx);
      bundleBuyTransaction = (await db.insert(transactions)
        .values(validatedBundleBuyTxData)
        .returning())[0];
    }

    // 自动创建持仓记录（仅在启用捆绑买入时创建）
    let portfolio = null;
    if (bundleBuyEnabled !== false) {
      // 创作者持有剩余的供应量（总供应量 - 捆绑买入数量）
      const creatorHoldingAmount = (parseFloat(totalSupply) - bundleBuyTokenAmount).toString();
      const totalBuyAmount = bundleBuyCost; // 实际投入的购买代币金额
      const initialPrice = '0.000001'; // 初始价格

      const newPortfolio = {
        walletId,
        chain,
        tokenAddress: mockTokenAddress,
        tokenSymbol,
        tokenName,
        amount: creatorHoldingAmount, // 持有剩余的供应量
        buyPrice: initialPrice,
        buyAmount: totalBuyAmount, // 实际投入的购买代币金额
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
          bundleBuyTxHash: (bundleBuyTransaction?.metadata as any)?.txHash, // 捆绑买入交易哈希
          bundleBuyNativeAmount: bundleBuyNativeAmount,
          bundleBuyTokenAmount: bundleBuyTokenAmount,
          bundleBuyTokenSymbol: bundleBuyTokenSymbolFinal, // 使用的购买代币符号
          isFirstBuyer: true, // 标记为第一个买家
          liquidityPool: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        }
      };

      const validatedPortfolioData = insertPortfolioSchema.parse(newPortfolio);
      portfolio = (await db.insert(portfolios)
        .values(validatedPortfolioData)
        .returning())[0];
    }

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
      const selectedPairTokenSymbol = (body.pairTokenSymbol && body.pairTokenSymbol !== 'auto') ? body.pairTokenSymbol : defaultPairToken;
      const pairTokenAddress = chainConfig?.pairTokens?.[selectedPairTokenSymbol] || defaultPairToken;
      
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

    // ========================================
    // 同步闪电卖出 - 与发币和捆绑买入同步执行
    // ========================================
    let flashSellTransaction = null;
    let updatedPortfolio = null;
    
    // 定义同步闪电卖出相关变量
    let sellPercentage = 0;
    let delaySeconds = 0;
    let amountToSell = 0;
    
    if (bundleBuyEnabled !== false && portfolio && body.autoFlashSellEnabled !== false) {
      sellPercentage = (parseFloat(body.autoFlashSellPercentage) || 50) / 100; // 默认卖出 50% 的捆绑买入数量
      delaySeconds = parseInt(body.autoFlashSellDelay || '0', 10) || 0; // 延迟时间（秒）
      amountToSell = Math.floor(bundleBuyTokenAmount * sellPercentage);
      
      if (amountToSell > 0) {
        const currentPrice = '0.000001'; // 初始价格
        const slippage = 5; // 5% 滑点
        const sellPrice = parseFloat(currentPrice) * (1 - slippage / 100);
        const estimatedReceive = amountToSell * sellPrice;
        
        // 计算盈亏
        const profitLoss = (sellPrice - parseFloat(currentPrice)) * amountToSell;
        const profitLossPercent = ((sellPrice - parseFloat(currentPrice)) / parseFloat(currentPrice) * 100);
        
        // 定义闪电卖出执行函数
        const executeFlashSell = async () => {
          try {
            // 创建闪电卖出交易记录
            const newFlashSellTx = {
              walletId,
              type: 'sell' as const,
              chain,
              tokenAddress: mockTokenAddress,
              tokenSymbol,
              amount: amountToSell.toString(),
              price: sellPrice.toString(),
              fee: (estimatedReceive * 0.003).toString(), // 0.3% 交易费
              status: 'completed' as const,
              metadata: {
                slippage,
                estimatedReceive: estimatedReceive.toString(),
                profitLoss: profitLoss.toString(),
                profitLossPercent: profitLossPercent.toFixed(2),
                buyPrice: currentPrice,
                executeTime: new Date().toISOString(),
                scheduledTime: delaySeconds > 0 ? new Date(Date.now() + delaySeconds * 1000).toISOString() : new Date().toISOString(),
                txHash: `0x${Array.from({ length: 64 }, () => 
                  Math.floor(Math.random() * 16).toString(16)
                ).join('')}`,
                dex: chain === 'solana' ? 'Raydium' : chain === 'bsc' ? 'PancakeSwap' : 'Uniswap',
                portfolioId: portfolio.id,
                autoFlashSell: true, // 标记为自动闪电卖出
                flashSellType: 'sync_with_launch', // 与发币同步的闪电卖出
                sellPercentage: sellPercentage * 100, // 卖出百分比
                delaySeconds, // 延迟秒数
              }
            };
            
            const validatedFlashSellTxData = insertTransactionSchema.parse(newFlashSellTx);
            const [flashSellTx] = await db.insert(transactions)
              .values(validatedFlashSellTxData)
              .returning();
            
            // 更新持仓状态
            const remainingAmount = bundleBuyTokenAmount - amountToSell;
            
            if (remainingAmount > 0) {
              // 部分卖出，更新持仓
              await db.update(portfolios)
                .set({ 
                  amount: remainingAmount.toString(),
                  totalValue: (remainingAmount * sellPrice).toString(),
                  profitLoss: profitLoss.toString(),
                  profitLossPercent: profitLossPercent.toFixed(2),
                  autoSellStatus: 'idle', // 继续监控剩余持仓
                  updatedAt: new Date()
                })
                .where(eq(portfolios.id, portfolio.id));
            } else {
              // 全部卖出，标记为sold
              await db.update(portfolios)
                .set({ 
                  status: 'sold',
                  soldAt: new Date(),
                  autoSellStatus: 'completed',
                  updatedAt: new Date()
                })
                .where(eq(portfolios.id, portfolio.id));
            }
            
            // 更新钱包余额
            const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
            if (wallet) {
              await db.update(wallets)
                .set({ 
                  balance: (parseFloat(wallet.balance) + estimatedReceive).toString(),
                  updatedAt: new Date()
                })
                .where(eq(wallets.id, walletId));
            }
            
            return flashSellTx;
          } catch (error) {
            console.error('Error executing delayed flash sell:', error);
            return null;
          }
        };
        
        // 根据延迟时间执行
        if (delaySeconds > 0) {
          // 延迟执行
          setTimeout(async () => {
            flashSellTransaction = await executeFlashSell();
            console.log(`Delayed flash sell executed after ${delaySeconds}s for token ${tokenSymbol}`);
          }, delaySeconds * 1000);
        } else {
          // 立即执行
          flashSellTransaction = await executeFlashSell();
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        transaction,
        bundleBuyTransaction, // 捆绑买入交易记录
        portfolio: updatedPortfolio || portfolio, // 更新后的持仓（如果有闪电卖出）
        liquidityPool,
        liquidityTransaction,
        flashSellTransaction, // 同步闪电卖出交易记录
        message: bundleBuyEnabled === false
          ? (isBondingCurvePlatform
            ? `代币发行成功！已在 ${body.platform} 上线（Bonding Curve 机制）。您未启用捆绑买入。当交易量达到一定阈值后，将自动上线到 DEX。`
            : liquidityPool
            ? `代币发行成功！已自动添加流动性到 ${liquidityPool.metadata?.dexName || 'DEX'}（${tokenSymbol}/${liquidityPool.pairTokenSymbol}），已锁定 ${body.lockDuration || 7} 天。您未启用捆绑买入。`
            : `代币发行成功！您未启用捆绑买入。`)
          : flashSellTransaction
          ? (delaySeconds > 0
            ? (isBondingCurvePlatform
              ? `代币发行成功！已在 ${body.platform} 上线（Bonding Curve 机制）。您是第一个买家，将在 ${delaySeconds} 秒后自动执行闪电卖出锁定 ${sellPercentage * 100}% 利润（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，将卖出 ${amountToSell} ${tokenSymbol}）。剩余持仓继续监控。`
              : liquidityPool
              ? `代币发行成功！已自动添加流动性到 ${liquidityPool.metadata?.dexName || 'DEX'}（${tokenSymbol}/${liquidityPool.pairTokenSymbol}），已锁定 ${body.lockDuration || 7} 天。您是第一个买家，将在 ${delaySeconds} 秒后自动执行闪电卖出锁定 ${sellPercentage * 100}% 利润（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，将卖出 ${amountToSell} ${tokenSymbol}）。剩余持仓继续监控。`
              : `代币发行成功！已自动创建持仓并启用闪电卖出监控。您是第一个买家，将在 ${delaySeconds} 秒后自动执行闪电卖出锁定 ${sellPercentage * 100}% 利润（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，将卖出 ${amountToSell} ${tokenSymbol}）。剩余持仓继续监控。`)
            : (isBondingCurvePlatform
              ? `代币发行成功！已在 ${body.platform} 上线（Bonding Curve 机制）。您是第一个买家，已自动执行闪电卖出锁定 ${sellPercentage * 100}% 利润（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，卖出 ${flashSellTransaction.amount} ${tokenSymbol}，收到 ${((flashSellTransaction.metadata as any)?.estimatedReceive)} ${bundleBuyTokenSymbolFinal}）。剩余持仓继续监控。`
              : liquidityPool
              ? `代币发行成功！已自动添加流动性到 ${liquidityPool.metadata?.dexName || 'DEX'}（${tokenSymbol}/${liquidityPool.pairTokenSymbol}），已锁定 ${body.lockDuration || 7} 天。您是第一个买家，已自动执行闪电卖出锁定 ${sellPercentage * 100}% 利润（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，卖出 ${flashSellTransaction.amount} ${tokenSymbol}，收到 ${((flashSellTransaction.metadata as any)?.estimatedReceive)} ${bundleBuyTokenSymbolFinal}）。剩余持仓继续监控。`
              : `代币发行成功！已自动创建持仓并启用闪电卖出监控。您是第一个买家，已自动执行闪电卖出锁定 ${sellPercentage * 100}% 利润（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，卖出 ${flashSellTransaction.amount} ${tokenSymbol}，收到 ${((flashSellTransaction.metadata as any)?.estimatedReceive)} ${bundleBuyTokenSymbolFinal}）。剩余持仓继续监控。`))
          : (isBondingCurvePlatform
            ? `代币发行成功！已在 ${body.platform} 上线（Bonding Curve 机制）。您是第一个买家（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，买入 ${bundleBuyTokenAmount} ${tokenSymbol}）。当交易量达到一定阈值后，将自动上线到 DEX。`
            : liquidityPool
            ? `代币发行成功！已自动添加流动性到 ${liquidityPool.metadata?.dexName || 'DEX'}（${tokenSymbol}/${liquidityPool.pairTokenSymbol}），已锁定 ${body.lockDuration || 7} 天。您是第一个买家（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，买入 ${bundleBuyTokenAmount} ${tokenSymbol}）`
            : `代币发行成功！已自动创建持仓并启用闪电卖出监控。您是第一个买家（投入 ${bundleBuyNativeAmount} ${bundleBuyTokenSymbolFinal}，买入 ${bundleBuyTokenAmount} ${tokenSymbol}）`)
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
