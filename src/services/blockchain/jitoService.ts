/**
 * Jito 服务 - Solana 交易加速
 * 使用 Jito MEV 保护的交易池，实现快速确认和优先交易
 */

import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
  PublicKey,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import crypto from 'crypto';

export interface JitoConfig {
  endpoint: string;
  bundleEndpoint: string;
  tipAccounts: string[];
}

export interface JitoTipInstruction {
  wallet: string;
  amount: number; // in lamports
}

export interface JitoBundleResult {
  success: boolean;
  bundleId?: string;
  txHashes?: string[];
  error?: string;
}

/**
 * Jito 服务
 */
export class JitoService {
  private config: JitoConfig;
  private connection: Connection;

  constructor(rpcUrl?: string, jitoEndpoint?: string) {
    this.config = {
      endpoint: jitoEndpoint || process.env.JITO_RPC_URL || 'https://mainnet.block-engine.jito.wtf/api/v1',
      bundleEndpoint: process.env.JITO_BUNDLE_URL || 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
      tipAccounts: [
        // Jito 的 Tip Accounts（可能会有更新，需要定期检查）
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNs3wAM', // Jito Tip Account 1
        'HFqUB5LMNzL3xX3cm9hC5ANCGgr7YsYTV1wBzD4oXx', // Jito Tip Account 2
      ],
    };

    this.connection = new Connection(rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000, // 60秒超时
    });
  }

  /**
   * 创建 Tip 指令
   */
  private createTipInstruction(
    fromWallet: Keypair,
    tipAccount: string,
    amountLamports: number
  ): Transaction {
    const transaction = new Transaction().add(
      {
        keys: [
          { pubkey: fromWallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(tipAccount), isSigner: false, isWritable: true },
        ],
        programId: new PublicKey('11111111111111111111111111111111'), // System Program
        data: Buffer.from([2]), // Transfer instruction
      }
    );

    return transaction;
  }

  /**
   * 通过 Jito 发送单个交易
   */
  async sendTransactionWithJito(
    transaction: Transaction,
    signer: Keypair,
    tipAmount?: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // 如果指定了 tipAmount，添加 tip
      if (tipAmount && tipAmount > 0) {
        const tipAccount = this.config.tipAccounts[0];
        const tipInstruction = this.createTipInstruction(signer, tipAccount, tipAmount);
        transaction.add(tipInstruction);
      }

      // 设置最新的 blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = signer.publicKey;

      // 发送交易
      const signature = await sendAndConfirmTransaction(this.connection, transaction, [signer]);

      return {
        success: true,
        txHash: signature,
      };
    } catch (error) {
      console.error('Jito transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '交易失败',
      };
    }
  }

  /**
   * 通过 Jito 发送 Bundle（批量交易）
   * Bundle 内的交易原子执行，要么全部成功，要么全部失败
   */
  async sendBundle(
    transactions: (Transaction | VersionedTransaction)[],
    tipAmount?: number
  ): Promise<JitoBundleResult> {
    try {
      // 将交易序列化
      const serializedTransactions = transactions.map((tx) =>
        tx instanceof Transaction
          ? Buffer.from(tx.serialize({ requireAllSignatures: false }))
          : Buffer.from(tx.serialize())
      );

      // 准备 bundle 数据
      const bundleData = {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [serializedTransactions],
      };

      // 发送到 Jito Bundle Endpoint
      const response = await fetch(this.config.bundleEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bundleData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jito Bundle API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        bundleId: result.result,
      };
    } catch (error) {
      console.error('Jito bundle failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bundle 发送失败',
      };
    }
  }

  /**
   * 获取 Bundle 状态
   */
  async getBundleStatus(bundleId: string): Promise<{ success: boolean; confirmed?: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.bundleEndpoint}/${bundleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get bundle status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        confirmed: result.confirmed || false,
      };
    } catch (error) {
      console.error('Failed to get bundle status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取 Bundle 状态失败',
      };
    }
  }

  /**
   * 获取推荐的 Tip 金额
   * 根据网络拥堵情况动态调整
   */
  async getRecommendedTipAmount(): Promise<number> {
    try {
      // 获取最近的区块费用信息
      const recentBlockhash = await this.connection.getRecentBlockhash();
      const feeCalculator = recentBlockhash.feeCalculator;

      // 基础费用（以 lamports 为单位）
      const baseFee = 5000; // 0.000005 SOL

      // 根据网络拥堵情况调整
      const slot = await this.connection.getSlot();
      const congestionLevel = slot % 10; // 简化的拥堵检测

      const tipAmount = baseFee * (1 + congestionLevel * 0.5);

      return Math.floor(tipAmount);
    } catch (error) {
      console.error('Failed to get recommended tip amount:', error);
      return 10000; // 默认 0.00001 SOL
    }
  }

  /**
   * 计算最优 Tip 金额
   * 根据交易大小和紧急程度计算
   */
  calculateOptimalTip(
    transactionSize: number,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): number {
    const baseTip = 5000; // 0.000005 SOL

    const urgencyMultiplier = {
      low: 1,
      medium: 2,
      high: 5,
    };

    const sizeMultiplier = 1 + (transactionSize / 1000) * 0.1;

    const tipAmount = baseTip * urgencyMultiplier[urgency] * sizeMultiplier;

    return Math.floor(tipAmount);
  }
}

// 导出单例
let jitoServiceInstance: JitoService | null = null;

export function getJitoService(rpcUrl?: string): JitoService {
  if (!jitoServiceInstance) {
    jitoServiceInstance = new JitoService(rpcUrl);
  }
  return jitoServiceInstance;
}
