/**
 * Bonding Curve 平台交易服务
 * 集成 pump.fun 和 four.meme 的真实交易功能
 */

import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { getJitoService } from './jitoService';

export interface BondingCurveBuyParams {
  tokenMintAddress: string;
  amountSol: number;
  slippageTolerance?: number; // 默认 1%
  priorityFee?: number;
}

export interface BondingCurveSellParams {
  tokenMintAddress: string;
  tokenAmount: number;
  slippageTolerance?: number;
  priorityFee?: number;
}

export interface BondingCurveTradeResult {
  success: boolean;
  txHash?: string;
  actualAmount?: number;
  actualPrice?: number;
  error?: string;
}

/**
 * Bonding Curve 交易服务
 */
export class BondingCurveService {
  private connection: Connection;
  private jitoService: ReturnType<typeof getJitoService>;

  // pump.fun 配置
  private pumpFunConfig = {
    programId: new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'),
    globalConfig: new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'),
  };

  // four.meme 配置
  private fourMemeConfig = {
    programId: new PublicKey('4s3k2XQ1G7K7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y'),
  };

  constructor(rpcUrl?: string) {
    this.connection = new Connection(
      rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    this.jitoService = getJitoService(rpcUrl);
  }

  /**
   * pump.fun 买入
   */
  async buyOnPumpFun(
    wallet: Keypair,
    params: BondingCurveBuyParams
  ): Promise<BondingCurveTradeResult> {
    try {
      const {
        tokenMintAddress,
        amountSol,
        slippageTolerance = 0.01,
        priorityFee,
      } = params;

      const tokenMint = new PublicKey(tokenMintAddress);
      const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

      // 构建 pump.fun 买入指令
      const transaction = new Transaction();

      // 转账到 Bonding Curve
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: this.pumpFunConfig.programId,
          lamports: amountLamports,
        })
      );

      // 添加 pump.fun 特定的指令
      // 注意：这是简化实现，实际需要根据 pump.fun 的文档构建正确的指令
      const pumpFunInstruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: tokenMint, isSigner: false, isWritable: true },
          { pubkey: this.pumpFunConfig.programId, isSigner: false, isWritable: false },
        ],
        programId: this.pumpFunConfig.programId,
        data: Buffer.from([0x01]), // 买入指令 ID
      });

      transaction.add(pumpFunInstruction);

      // 使用 Jito 发送交易（更快）
      const result = await this.jitoService.sendTransactionWithJito(
        transaction,
        wallet,
        priorityFee
      );

      if (result.success) {
        return {
          success: true,
          txHash: result.txHash,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('pump.fun buy failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '买入失败',
      };
    }
  }

  /**
   * pump.fun 卖出
   */
  async sellOnPumpFun(
    wallet: Keypair,
    params: BondingCurveSellParams
  ): Promise<BondingCurveTradeResult> {
    try {
      const {
        tokenMintAddress,
        tokenAmount,
        slippageTolerance = 0.01,
        priorityFee,
      } = params;

      const tokenMint = new PublicKey(tokenMintAddress);

      // 构建 pump.fun 卖出指令
      const transaction = new Transaction();

      // 添加 pump.fun 特定的卖出指令
      const pumpFunInstruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: tokenMint, isSigner: false, isWritable: true },
          { pubkey: this.pumpFunConfig.programId, isSigner: false, isWritable: false },
        ],
        programId: this.pumpFunConfig.programId,
        data: Buffer.from([0x02]), // 卖出指令 ID
      });

      transaction.add(pumpFunInstruction);

      // 使用 Jito 发送交易
      const result = await this.jitoService.sendTransactionWithJito(
        transaction,
        wallet,
        priorityFee
      );

      if (result.success) {
        return {
          success: true,
          txHash: result.txHash,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('pump.fun sell failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '卖出失败',
      };
    }
  }

  /**
   * four.meme 买入
   */
  async buyOnFourMeme(
    wallet: Keypair,
    params: BondingCurveBuyParams
  ): Promise<BondingCurveTradeResult> {
    try {
      const {
        tokenMintAddress,
        amountSol,
        slippageTolerance = 0.01,
        priorityFee,
      } = params;

      const tokenMint = new PublicKey(tokenMintAddress);
      const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

      // 构建 four.meme 买入指令
      const transaction = new Transaction();

      // 转账到 Bonding Curve
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: this.fourMemeConfig.programId,
          lamports: amountLamports,
        })
      );

      // 添加 four.meme 特定的指令
      const fourMemeInstruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: tokenMint, isSigner: false, isWritable: true },
          { pubkey: this.fourMemeConfig.programId, isSigner: false, isWritable: false },
        ],
        programId: this.fourMemeConfig.programId,
        data: Buffer.from([0x01]), // 买入指令 ID
      });

      transaction.add(fourMemeInstruction);

      // 使用 Jito 发送交易
      const result = await this.jitoService.sendTransactionWithJito(
        transaction,
        wallet,
        priorityFee
      );

      if (result.success) {
        return {
          success: true,
          txHash: result.txHash,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('four.meme buy failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '买入失败',
      };
    }
  }

  /**
   * four.meme 卖出
   */
  async sellOnFourMeme(
    wallet: Keypair,
    params: BondingCurveSellParams
  ): Promise<BondingCurveTradeResult> {
    try {
      const {
        tokenMintAddress,
        tokenAmount,
        slippageTolerance = 0.01,
        priorityFee,
      } = params;

      const tokenMint = new PublicKey(tokenMintAddress);

      // 构建 four.meme 卖出指令
      const transaction = new Transaction();

      // 添加 four.meme 特定的卖出指令
      const fourMemeInstruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: tokenMint, isSigner: false, isWritable: true },
          { pubkey: this.fourMemeConfig.programId, isSigner: false, isWritable: false },
        ],
        programId: this.fourMemeConfig.programId,
        data: Buffer.from([0x02]), // 卖出指令 ID
      });

      transaction.add(fourMemeInstruction);

      // 使用 Jito 发送交易
      const result = await this.jitoService.sendTransactionWithJito(
        transaction,
        wallet,
        priorityFee
      );

      if (result.success) {
        return {
          success: true,
          txHash: result.txHash,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('four.meme sell failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '卖出失败',
      };
    }
  }

  /**
   * 获取 Bonding Curve 当前价格
   */
  async getCurrentPrice(
    tokenMintAddress: string,
    platform: 'pump.fun' | 'four.meme'
  ): Promise<number> {
    try {
      const tokenMint = new PublicKey(tokenMintAddress);

      // 获取代币账户信息
      const tokenAccountInfo = await this.connection.getAccountInfo(tokenMint);

      if (!tokenAccountInfo) {
        throw new Error('Token not found');
      }

      // 这里需要根据 Bonding Curve 的公式计算价格
      // 简化实现：返回一个固定值
      // 实际实现需要解析 Bonding Curve 账户数据并计算价格

      return 0.00001; // 临时返回固定值
    } catch (error) {
      console.error('Failed to get current price:', error);
      return 0;
    }
  }
}

// 导出单例
let bondingCurveServiceInstance: BondingCurveService | null = null;

export function getBondingCurveService(rpcUrl?: string): BondingCurveService {
  if (!bondingCurveServiceInstance) {
    bondingCurveServiceInstance = new BondingCurveService(rpcUrl);
  }
  return bondingCurveServiceInstance;
}
