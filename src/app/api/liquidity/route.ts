import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { liquidityPools, tokens, transactions, wallets } from '@/storage/database/shared/schema';
import { insertLiquidityPoolSchema, insertTransactionSchema } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// DEX 配置（不同链支持的 DEX）
const DEX_CONFIG: Record<string, Record<string, {
  name: string;
  pairTokens: string[];
  defaultPairToken: string;
}>> = {
  solana: {
    raydium: {
      name: 'Raydium',
      pairTokens: ['SOL', 'USDC', 'USDT'],
      defaultPairToken: 'SOL',
    },
    jupiter: {
      name: 'Jupiter',
      pairTokens: ['SOL', 'USDC', 'USDT'],
      defaultPairToken: 'SOL',
    },
  },
  eth: {
    uniswap: {
      name: 'Uniswap V2',
      pairTokens: ['ETH', 'USDC', 'USDT', 'WETH'],
      defaultPairToken: 'WETH',
    },
    uniswapV3: {
      name: 'Uniswap V3',
      pairTokens: ['ETH', 'USDC', 'USDT', 'WETH'],
      defaultPairToken: 'WETH',
    },
  },
  bsc: {
    pancakeswap: {
      name: 'PancakeSwap',
      pairTokens: ['BNB', 'USDT', 'BUSD'],
      defaultPairToken: 'USDT',
    },
  },
};

// 默认的配对代币地址（模拟）
const PAIR_TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  solana: {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  },
  eth: {
    ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  bsc: {
    BNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  },
};

// POST /api/liquidity/add - 添加流动性
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // 验证必填字段
    const { 
      walletId, 
      chain, 
      tokenAddress, 
      tokenSymbol, 
      tokenAmount, 
      pairTokenSymbol, 
      pairTokenAmount,
      dex = 'auto', // auto 表示自动选择
      lockLiquidity = false,
      lockDuration = 7 // 锁定天数，默认 7 天
    } = body;
    
    if (!walletId || !chain || !tokenAddress || !tokenSymbol || !tokenAmount || !pairTokenAmount) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证代币是否存在
    const [token] = await db.select().from(tokens).where(eq(tokens.address, tokenAddress));
    if (!token) {
      return NextResponse.json(
        { success: false, error: '代币不存在' },
        { status: 404 }
      );
    }

    // 验证钱包是否存在
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    // 自动选择 DEX 和配对代币
    const selectedDex = dex === 'auto'
      ? Object.keys(DEX_CONFIG[chain] || {})[0]
      : dex;

    const chainConfig = DEX_CONFIG[chain];
    const dexConfig = chainConfig?.[selectedDex];

    if (!dexConfig) {
      return NextResponse.json(
        { success: false, error: `不支持的 DEX: ${selectedDex}` },
        { status: 400 }
      );
    }

    const selectedPairTokenSymbol = pairTokenSymbol || dexConfig.defaultPairToken;
    const pairTokenAddress = PAIR_TOKEN_ADDRESSES[chain]?.[selectedPairTokenSymbol];

    if (!pairTokenAddress) {
      return NextResponse.json(
        { success: false, error: `不支持的配对代币: ${selectedPairTokenSymbol}` },
        { status: 400 }
      );
    }

    // 计算初始价格
    const initialPrice = parseFloat(pairTokenAmount) / parseFloat(tokenAmount);

    // 模拟添加流动性到 DEX
    // 在实际应用中，这里需要调用真实的 DEX API
    const mockPoolAddress = `0x${Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    const mockTxHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    // 计算流动性锁定期
    const lockEndTime = lockLiquidity 
      ? new Date(Date.now() + lockDuration * 24 * 60 * 60 * 1000)
      : null;

    // 创建流动性池记录
    const newLiquidityPool = {
      chain,
      tokenAddress,
      tokenSymbol,
      pairTokenSymbol: selectedPairTokenSymbol,
      pairTokenAddress,
      dex: selectedDex,
      poolAddress: mockPoolAddress,
      tokenAmount: tokenAmount.toString(),
      pairTokenAmount: pairTokenAmount.toString(),
      totalLiquidity: (parseFloat(tokenAmount) * initialPrice * 2).toString(), // 总流动性
      lpTokenAmount: (Math.sqrt(parseFloat(tokenAmount) * parseFloat(pairTokenAmount))).toString(), // LP 代币数量
      initialPrice: initialPrice.toString(),
      status: 'active',
      locked: lockLiquidity,
      lockEndTime: lockEndTime || undefined,
      metadata: {
        dexName: dexConfig.name,
        txHash: mockTxHash,
        launchTxHash: body.launchTxHash || null,
        lockDuration: lockDuration,
        timestamp: new Date().toISOString(),
      }
    };

    const validatedPoolData = insertLiquidityPoolSchema.parse(newLiquidityPool);
    const [liquidityPool] = await db.insert(liquidityPools)
      .values(validatedPoolData)
      .returning();

    // 创建交易记录
    const newTransaction = {
      walletId,
      type: 'add_liquidity' as const,
      chain,
      tokenAddress,
      tokenSymbol,
      amount: tokenAmount.toString(),
      price: initialPrice.toString(),
      fee: (parseFloat(pairTokenAmount) * 0.003).toString(), // 0.3% 流动性添加费用
      status: 'completed' as const,
      metadata: {
        pairTokenSymbol: selectedPairTokenSymbol,
        pairTokenAmount,
        dex: selectedDex,
        poolAddress: mockPoolAddress,
        txHash: mockTxHash,
        locked: lockLiquidity,
        lockDuration,
      }
    };

    const validatedTxData = insertTransactionSchema.parse(newTransaction);
    const [transaction] = await db.insert(transactions)
      .values(validatedTxData)
      .returning();

    // 更新代币的流动性信息
    if (tokenAddress) {
      await db.update(tokens)
        .set({
          liquidity: liquidityPool.totalLiquidity,
          price: initialPrice.toString(),
          marketCap: token.totalSupply ? (parseFloat(token.totalSupply) * initialPrice).toString() : '0',
          updatedAt: new Date().toISOString().toISOString(),
        })
        .where(eq(tokens.address, tokenAddress));
    }

    return NextResponse.json({
      success: true,
      data: {
        liquidityPool,
        transaction,
        message: `流动性添加成功！已在 ${dexConfig.name} 创建交易对 ${tokenSymbol}/${selectedPairTokenSymbol}`
      }
    });

  } catch (error) {
    console.error('Add liquidity error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '添加流动性失败' 
      },
      { status: 500 }
    );
  }
}

// GET /api/liquidity - 获取流动性池列表
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('tokenAddress');
    const chain = searchParams.get('chain');
    const dex = searchParams.get('dex');

    const pools = await db.select().from(liquidityPools);

    // 在应用层过滤
    let filteredPools = pools;
    if (tokenAddress) {
      filteredPools = filteredPools.filter(p => p.tokenAddress === tokenAddress);
    }
    if (chain) {
      filteredPools = filteredPools.filter(p => p.chain === chain);
    }
    if (dex) {
      filteredPools = filteredPools.filter(p => p.dex === dex);
    }

    // 按创建时间排序
    filteredPools.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: filteredPools
    });
  } catch (error) {
    console.error('Get liquidity pools error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取流动性池失败' 
      },
      { status: 500 }
    );
  }
}
