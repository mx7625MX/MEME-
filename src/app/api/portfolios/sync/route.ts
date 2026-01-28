import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { wallets, portfolios } from '@/storage/database/shared/schema';
import { insertPortfolioSchema } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { Connection, ParsedAccountData } from '@solana/web3.js';
import { ethers } from 'ethers';

// 模拟代币列表（实际应用中可以从 DEX 获取热门代币列表）
const MOCK_TOKENS = {
  solana: [
    { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5 },
    { address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'WIF', name: 'dogwifhat', decimals: 6 },
  ],
  eth: [
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  ],
  bsc: [
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
  ],
};

// 模拟获取 Solana 钱包的代币余额
async function getSolanaBalances(address: string): Promise<any[]> {
  try {
    // 在实际应用中，这里应该连接到真实的 Solana RPC
    // const connection = new Connection('https://api.mainnet-beta.solana.com');
    // const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(address));
    
    // 模拟返回一些持仓
    const mockBalances = [
      {
        tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        amount: '1000000000',
        decimals: 5
      },
    ];
    
    return mockBalances;
  } catch (error) {
    console.error('Error fetching Solana balances:', error);
    return [];
  }
}

// 模拟获取 ETH/BSC 钱包的代币余额
async function getEvmBalances(address: string, chain: string): Promise<any[]> {
  try {
    // 在实际应用中，这里应该连接到真实的 RPC
    // const rpcUrl = chain === 'eth' ? process.env.ETH_RPC_URL : process.env.BSC_RPC_URL;
    // const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const mockBalances = chain === 'eth' ? [] : [
      {
        tokenAddress: '0x55d398326f99059fF775485246999027B3197955',
        amount: '500',
        decimals: 18
      }
    ];
    
    return mockBalances;
  } catch (error) {
    console.error('Error fetching EVM balances:', error);
    return [];
  }
}

// 获取代币价格（模拟）
async function getTokenPrice(chain: string, tokenAddress: string): Promise<number> {
  // 在实际应用中，应该调用价格API（如 Jupiter, CoinGecko等）
  const prices: Record<string, Record<string, number>> = {
    solana: {
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 0.000000015, // BONK
      '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': 2.5, // WIF
    },
    eth: {
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 3000, // WETH
    },
    bsc: {
      '0x55d398326f99059fF775485246999027B3197955': 1.0, // USDT
    },
  };
  
  return prices[chain]?.[tokenAddress] || 0.000001; // 默认价格
}

// 同步单个钱包的持仓
async function syncWalletPortfolios(walletId: string, db: any) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
  
  if (!wallet || !wallet.isActive) {
    return { synced: 0, errors: ['Wallet not found or inactive'] };
  }

  let balances: any[] = [];
  
  try {
    if (wallet.chain === 'solana') {
      balances = await getSolanaBalances(wallet.address);
    } else if (wallet.chain === 'eth' || wallet.chain === 'bsc') {
      balances = await getEvmBalances(wallet.address, wallet.chain);
    }
  } catch (error) {
    console.error(`Error fetching balances for wallet ${walletId}:`, error);
    return { synced: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }

  let synced = 0;
  const errors: string[] = [];
  const chainTokens = MOCK_TOKENS[wallet.chain as keyof typeof MOCK_TOKENS] || [];

  for (const balance of balances) {
    try {
      const tokenInfo = chainTokens.find(t => t.address.toLowerCase() === balance.tokenAddress.toLowerCase());
      
      if (!tokenInfo) {
        continue; // 跳过未知代币
      }

      // 过滤掉稳定币（USDC, USDT 等）
      if (tokenInfo.symbol === 'USDC' || tokenInfo.symbol === 'USDT') {
        continue; // 跳过稳定币
      }

      const currentPrice = await getTokenPrice(wallet.chain, balance.tokenAddress);
      const amount = parseFloat(balance.amount) / Math.pow(10, balance.decimals);
      const totalValue = amount * currentPrice;

      // 检查是否已存在该持仓
      const [existing] = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.tokenAddress, balance.tokenAddress))
        .limit(1);

      if (existing && existing.status === 'active') {
        // 更新现有持仓的当前价格和总价值
        await db
          .update(portfolios)
          .set({
            amount: amount.toString(),
            currentPrice: currentPrice.toString(),
            totalValue: totalValue.toString(),
            profitLoss: ((currentPrice - parseFloat(existing.buyPrice)) * amount).toString(),
            profitLossPercent: ((currentPrice - parseFloat(existing.buyPrice)) / parseFloat(existing.buyPrice) * 100).toFixed(2),
            updatedAt: new Date().toISOString()
          })
          .where(eq(portfolios.id, existing.id));
      } else {
        // 这是新持仓，需要用户手动添加买入信息
        // 这里只创建一个标记，等待用户补充买入信息
        await db.insert(portfolios).values({
          walletId: wallet.id,
          chain: wallet.chain,
          tokenAddress: balance.tokenAddress,
          tokenSymbol: tokenInfo.symbol,
          tokenName: tokenInfo.name,
          amount: amount.toString(),
          buyPrice: currentPrice.toString(), // 暂时使用当前价格
          buyAmount: totalValue.toString(),
          currentPrice: currentPrice.toString(),
          totalInvested: totalValue.toString(),
          totalValue: totalValue.toString(),
          profitLoss: '0',
          profitLossPercent: '0',
          status: 'active',
          metadata: { autoSynced: true, needsBuyInfo: true }
        });
      }

      synced++;
    } catch (error) {
      console.error(`Error processing token ${balance.tokenAddress}:`, error);
      errors.push(`Token ${balance.tokenAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { synced, errors };
}

// 同步所有钱包的持仓
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const walletId = body.walletId; // 如果指定了 walletId，只同步该钱包

    const allWallets = walletId 
      ? await db.select().from(wallets).where(eq(wallets.id, walletId))
      : await db.select().from(wallets).where(eq(wallets.isActive, true));

    let totalSynced = 0;
    const allErrors: string[] = [];

    for (const wallet of allWallets) {
      const result = await syncWalletPortfolios(wallet.id, db);
      totalSynced += result.synced;
      allErrors.push(...result.errors);
    }

    return NextResponse.json({
      success: true,
      data: {
        synced: totalSynced,
        walletsProcessed: allWallets.length,
        errors: allErrors.length > 0 ? allErrors : undefined
      },
      message: `成功同步 ${totalSynced} 个持仓`
    });
  } catch (error) {
    console.error('Error syncing portfolios:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '同步持仓失败' },
      { status: 500 }
    );
  }
}
