// 隐私保护服务 - 防转账追踪核心实现

import { Keypair, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ethers } from 'ethers';
import bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import crypto from 'crypto';
import { 
  PrivacyLevel, 
  PrivacyConfig, 
  HopWallet, 
  TransferHop, 
  PrivacyTransferPath,
  PrivacyTransferRequest,
  PrivacyTransferResult,
  TrackingAnalysis,
  WalletPrivacyReport 
} from './types';
import { 
  privacyConfigs, 
  hopWallets, 
  privacyTransfers,
  wallets
} from '@/storage/database/shared/schema';
import { getDb } from 'coze-coding-dev-sdk';
import { eq } from 'drizzle-orm';

export class PrivacyProtectionService {
  private heliusConnection: Connection | null = null;
  private alchemyProviders: Map<string, ethers.JsonRpcProvider> = new Map();

  constructor() {
    const heliusUrl = process.env.HELIUS_RPC_URL;
    if (heliusUrl && (heliusUrl.startsWith('http://') || heliusUrl.startsWith('https://'))) {
      this.heliusConnection = new Connection(heliusUrl);
    }
    this.initializeAlchemyProviders();
  }

  private initializeAlchemyProviders() {
    const ethUrl = process.env.ALCHEMY_RPC_URL_ETH;
    if (ethUrl && (ethUrl.startsWith('http://') || ethUrl.startsWith('https://'))) {
      this.alchemyProviders.set('ETH', new ethers.JsonRpcProvider(ethUrl));
    }
    const bscUrl = process.env.ALCHEMY_RPC_URL_BSC;
    if (bscUrl && (bscUrl.startsWith('http://') || bscUrl.startsWith('https://'))) {
      this.alchemyProviders.set('BSC', new ethers.JsonRpcProvider(bscUrl));
    }
  }

  /**
   * 生成临时中间钱包（用于多跳中转）
   */
  async createTemporaryHopWallet(chain: string, expiresInHours: number = 24): Promise<HopWallet> {
    const mnemonic = bip39.generateMnemonic();
    let address: string;
    let privateKey: string;

    if (chain === 'SOL') {
      // Solana 临时钱包
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed).key;
      const keypair = Keypair.fromSeed(Buffer.from(derivedSeed));
      address = keypair.publicKey.toBase58();
      privateKey = Buffer.from(keypair.secretKey).toString('hex');
    } else {
      // EVM 临时钱包
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const wallet = ethers.HDNodeWallet.fromSeed(seed);
      address = wallet.address;
      privateKey = wallet.privateKey;
    }

    // 加密私钥
    const encryptionKey = this.getEncryptionKey();
    const encryptedPrivateKey = this.encrypt(privateKey, encryptionKey);

    const hopWallet: HopWallet = {
      address,
      privateKey: encryptedPrivateKey,
      chain,
      isTemporary: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    };

    // 存储到数据库
    const db = await getDb();
    await db.insert(hopWallets).values({
      address: hopWallet.address,
      privateKey: hopWallet.privateKey,
      chain: hopWallet.chain,
      isTemporary: hopWallet.isTemporary,
      createdAt: hopWallet.createdAt,
      expiresAt: hopWallet.expiresAt,
    });

    return hopWallet;
  }

  /**
   * 批量生成临时中间钱包
   */
  async createHopWalletsChain(count: number, chain: string): Promise<HopWallet[]> {
    const hopWalletsList: HopWallet[] = [];
    for (let i = 0; i < count; i++) {
      const hopWallet = await this.createTemporaryHopWallet(chain, 24);
      hopWalletsList.push(hopWallet);
    }
    return hopWalletsList;
  }

  /**
   * 智能路径规划 - 计算最优中转路径
   */
  async planPrivacyTransferPath(
    request: PrivacyTransferRequest
  ): Promise<PrivacyTransferPath> {
    const config = await this.getPrivacyConfig(request.fromWalletId);
    const privacyLevel = request.privacyLevel || config.privacyLevel;
    
    let hopCount = this.getHopCountByPrivacyLevel(privacyLevel);
    let splitCount = this.getSplitCountByPrivacyLevel(privacyLevel);
    
    // 覆盖自定义配置
    if (request.customConfig) {
      if (request.customConfig.maxHops) hopCount = request.customConfig.maxHops;
      if (request.customConfig.splitCount) splitCount = request.customConfig.splitCount;
    }

    const hopWallets = await this.createHopWalletsChain(hopCount, request.chain);
    const hops: TransferHop[] = [];

    // 计算每跳的金额（拆分逻辑）
    const amountPerHop = this.calculateSplitAmount(request.amount, splitCount);
    const estimatedFeePerHop = await this.estimateTransferFee(request.chain, amountPerHop);

    // 构建跳转路径
    let currentFrom = request.fromWalletId;
    let accumulatedAmount = request.amount;

    for (let i = 0; i < hopWallets.length; i++) {
      const hopWallet = hopWallets[i];
      const isLastHop = i === hopWallets.length - 1;
      
      const hop: TransferHop = {
        fromAddress: currentFrom,
        toAddress: isLastHop ? request.toAddress : hopWallet.address,
        amount: isLastHop ? accumulatedAmount : amountPerHop,
        tokenSymbol: request.tokenSymbol,
        estimatedFee: estimatedFeePerHop,
        delayMs: isLastHop ? 0 : this.getRandomDelay(config),
      };

      hops.push(hop);
      
      if (!isLastHop) {
        currentFrom = hopWallet.address;
        accumulatedAmount = this.calculateRemainingAmount(accumulatedAmount, amountPerHop, estimatedFeePerHop);
      }
    }

    const privacyScore = this.calculatePrivacyScore(hops.length, splitCount);
    const estimatedTotalFee = this.calculateTotalFee(hops);
    const estimatedTime = this.estimateTotalTime(hops);

    return {
      totalHops: hops.length,
      estimatedTotalFee,
      estimatedTime,
      hops,
      privacyScore,
    };
  }

  /**
   * 执行隐私转账（多跳中转）
   */
  async executePrivacyTransfer(
    request: PrivacyTransferRequest
  ): Promise<PrivacyTransferResult> {
    const path = await this.planPrivacyTransferPath(request);
    const transferId = crypto.randomUUID();
    
    const result: PrivacyTransferResult = {
      transferId,
      status: 'IN_PROGRESS',
      path,
      actualHops: [],
      startTime: new Date(),
      privacyScore: path.privacyScore,
    };

    // 存储转账记录
    const db = await getDb();
    await db.insert(privacyTransfers).values({
      transferId,
      fromWalletId: request.fromWalletId,
      toAddress: request.toAddress,
      amount: request.amount,
      tokenSymbol: request.tokenSymbol,
      chain: request.chain,
      status: 'IN_PROGRESS',
      privacyScore: path.privacyScore,
      hopCount: path.totalHops,
      startTime: result.startTime,
    });

    // 执行每一跳
    for (let i = 0; i < path.hops.length; i++) {
      const hop = path.hops[i];
      
      // 随机延迟（除最后一跳）
      if (hop.delayMs && hop.delayMs > 0) {
        await this.delay(hop.delayMs);
      }

      // 执行转账
      const success = await this.executeTransfer(hop);
      
      if (success) {
        result.actualHops.push(hop);
      } else {
        result.status = 'FAILED';
        await this.updateTransferStatus(transferId, 'FAILED');
        throw new Error(`Transfer failed at hop ${i + 1}`);
      }
    }

    result.status = 'COMPLETED';
    result.completedTime = new Date();
    await this.updateTransferStatus(transferId, 'COMPLETED', result.completedTime);

    return result;
  }

  /**
   * 执行单跳转账
   */
  private async executeTransfer(hop: TransferHop): Promise<boolean> {
    try {
      if (hop.tokenSymbol === 'SOL') {
        return await this.executeSolanaTransfer(hop);
      } else if (hop.tokenSymbol === 'ETH' || hop.tokenSymbol === 'BNB') {
        return await this.executeEVMTransfer(hop);
      }
      return false;
    } catch (error) {
      console.error('Transfer execution failed:', error);
      return false;
    }
  }

  /**
   * 执行 Solana 转账
   */
  private async executeSolanaTransfer(hop: TransferHop): Promise<boolean> {
    if (!this.heliusConnection) {
      console.error('Solana connection not initialized');
      return false;
    }

    // 查询源钱包私钥
    const db = await getDb();
    const [walletRecord] = await db.select().from(wallets).where(eq(wallets.address, hop.fromAddress));

    if (!walletRecord || !walletRecord.privateKey) return false;

    const privateKey = this.decrypt(walletRecord.privateKey, this.getEncryptionKey());
    const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'));

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new Keypair().publicKey, // 目标地址
        lamports: this.parseAmount(hop.amount, hop.tokenSymbol),
      })
    );

    const signature = await this.heliusConnection.sendTransaction(
      transaction,
      [keypair]
    );

    await this.heliusConnection.confirmTransaction(signature);
    return true;
  }

  /**
   * 执行 EVM 转账
   */
  private async executeEVMTransfer(hop: TransferHop): Promise<boolean> {
    const provider = this.alchemyProviders.get(hop.tokenSymbol);
    if (!provider) return false;

    const db = await getDb();
    const [walletRecord] = await db.select().from(wallets).where(eq(wallets.address, hop.fromAddress));

    if (!walletRecord || !walletRecord.privateKey) return false;

    const privateKey = this.decrypt(walletRecord.privateKey, this.getEncryptionKey());
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
      to: hop.toAddress,
      value: ethers.parseEther(hop.amount),
    });

    await provider.waitForTransaction(tx.hash);
    return true;
  }

  /**
   * 分析钱包追踪风险
   */
  async analyzeWalletTracking(walletAddress: string, chain: string): Promise<TrackingAnalysis> {
    const analysis: TrackingAnalysis = {
      hasDirectLink: false,
      suspiciousPattern: false,
      riskScore: 0,
      detectedChains: [],
      warnings: [],
    };

    try {
      // 分析转账历史链
      const transactionHistory = await this.getTransactionHistory(walletAddress, chain);
      
      // 检测直接关联
      if (this.detectDirectLinks(transactionHistory)) {
        analysis.hasDirectLink = true;
        analysis.riskScore += 30;
        analysis.warnings.push('检测到直接的地址关联，可能被追踪');
      }

      // 检测可疑模式
      if (this.detectSuspiciousPatterns(transactionHistory)) {
        analysis.suspiciousPattern = true;
        analysis.riskScore += 40;
        analysis.warnings.push('检测到可疑的交易模式，建议使用隐私保护');
      }

      // 检测资金来源
      const fundingSources = this.detectFundingSources(transactionHistory);
      if (fundingSources.hasCEX) {
        analysis.riskScore += 20;
        analysis.warnings.push('检测到来自中心化交易所的资金，存在追踪风险');
      }

      // 检测跨链关联
      if (this.detectCrossChainLinks(transactionHistory)) {
        analysis.detectedChains = ['SOL', 'ETH', 'BSC'];
        analysis.riskScore += 25;
        analysis.warnings.push('检测到跨链地址关联，隐私风险较高');
      }

      // 限制最大风险分数
      analysis.riskScore = Math.min(analysis.riskScore, 100);

    } catch (error) {
      console.error('Tracking analysis failed:', error);
    }

    return analysis;
  }

  /**
   * 生成钱包隐私报告
   */
  async generateWalletPrivacyReport(walletId: string): Promise<WalletPrivacyReport> {
    const db = await getDb();
    const [walletRecord] = await db.select().from(wallets).where(eq(wallets.id, walletId));

    if (!walletRecord) {
      throw new Error('Wallet not found');
    }

    const trackingAnalysis = await this.analyzeWalletTracking(walletRecord.address, walletRecord.chain);
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (trackingAnalysis.riskScore >= 80) riskLevel = 'CRITICAL';
    else if (trackingAnalysis.riskScore >= 60) riskLevel = 'HIGH';
    else if (trackingAnalysis.riskScore >= 40) riskLevel = 'MEDIUM';

    const recommendations = this.generatePrivacyRecommendations(trackingAnalysis);

    return {
      walletId,
      privacyScore: 100 - trackingAnalysis.riskScore,
      riskLevel,
      trackingAnalysis,
      recommendations,
      lastAnalyzed: new Date(),
    };
  }

  /**
   * 生成隐私保护建议
   */
  private generatePrivacyRecommendations(analysis: TrackingAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.hasDirectLink) {
      recommendations.push('建议使用多跳中转功能，至少3跳以上');
      recommendations.push('考虑使用随机拆分功能，将大额交易拆分成多笔小额交易');
    }

    if (analysis.suspiciousPattern) {
      recommendations.push('启用随机延迟机制，避免规律性交易');
      recommendations.push('建议创建多个临时钱包，分散资金流向');
    }

    if (analysis.riskScore >= 60) {
      recommendations.push('强烈建议使用高级隐私保护模式（3-5跳中转）');
      recommendations.push('定期更换中间钱包，避免长期使用同一地址');
    }

    if (analysis.detectedChains.length > 0) {
      recommendations.push('检测到跨链关联，建议在每个链上使用独立的隐私钱包');
      recommendations.push('避免跨链地址关联，使用不同的助记词');
    }

    if (recommendations.length === 0) {
      recommendations.push('当前钱包隐私风险较低，继续保持良好的隐私保护习惯');
      recommendations.push('建议定期进行隐私风险评估');
    }

    return recommendations;
  }

  // ==================== 辅助方法 ====================

  private getHopCountByPrivacyLevel(level: PrivacyLevel): number {
    switch (level) {
      case PrivacyLevel.LOW: return 0;
      case PrivacyLevel.MEDIUM: return 2;
      case PrivacyLevel.HIGH: return 4;
      case PrivacyLevel.EXTREME: return 6;
      default: return 2;
    }
  }

  private getSplitCountByPrivacyLevel(level: PrivacyLevel): number {
    switch (level) {
      case PrivacyLevel.LOW: return 1;
      case PrivacyLevel.MEDIUM: return 2;
      case PrivacyLevel.HIGH: return 4;
      case PrivacyLevel.EXTREME: return 8;
      default: return 2;
    }
  }

  private calculateSplitAmount(totalAmount: string, splitCount: number): string {
    const amount = parseFloat(totalAmount);
    return (amount / splitCount).toFixed(6);
  }

  private calculateRemainingAmount(
    currentAmount: string,
    splitAmount: string,
    fee: string
  ): string {
    return (parseFloat(currentAmount) - parseFloat(splitAmount) - parseFloat(fee)).toFixed(6);
  }

  private calculatePrivacyScore(hopCount: number, splitCount: number): number {
    const baseScore = 50;
    const hopBonus = Math.min(hopCount * 10, 30);
    const splitBonus = Math.min(splitCount * 5, 20);
    return Math.min(baseScore + hopBonus + splitBonus, 100);
  }

  private calculateTotalFee(hops: TransferHop[]): string {
    const totalFee = hops.reduce((sum, hop) => sum + parseFloat(hop.estimatedFee), 0);
    return totalFee.toFixed(6);
  }

  private estimateTotalTime(hops: TransferHop[]): string {
    const totalDelay = hops.reduce((sum, hop) => sum + (hop.delayMs || 0), 0);
    const minutes = Math.ceil(totalDelay / 60000);
    return `${minutes} 分钟`;
  }

  private getRandomDelay(config: PrivacyConfig): number {
    if (config.minDelayMs === 0 && config.maxDelayMs === 0) return 0;
    return Math.floor(
      Math.random() * (config.maxDelayMs - config.minDelayMs + 1) + config.minDelayMs
    );
  }

  private async estimateTransferFee(chain: string, amount: string): Promise<string> {
    // 简化估算，实际应该查询链上 gas price
    if (chain === 'SOL') return '0.000005'; // 5000 lamports
    if (chain === 'ETH') return '0.0001';
    if (chain === 'BSC') return '0.00001';
    return '0.000001';
  }

  private parseAmount(amount: string, tokenSymbol: string): bigint {
    if (tokenSymbol === 'SOL') {
      return BigInt(parseFloat(amount) * LAMPORTS_PER_SOL);
    }
    return ethers.parseEther(amount);
  }

  private getEncryptionKey(): string {
    return process.env.PRIVACY_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  private encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string, key: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getTransactionHistory(walletAddress: string, chain: string): Promise<any[]> {
    // 简化实现，实际应该查询区块链 RPC
    return [];
  }

  private detectDirectLinks(history: any[]): boolean {
    // 简化检测逻辑
    return false;
  }

  private detectSuspiciousPatterns(history: any[]): boolean {
    // 简化检测逻辑
    return false;
  }

  private detectFundingSources(history: any[]): { hasCEX: boolean } {
    // 简化检测逻辑
    return { hasCEX: false };
  }

  private detectCrossChainLinks(history: any[]): boolean {
    // 简化检测逻辑
    return false;
  }

  private async getPrivacyConfig(walletId: string): Promise<PrivacyConfig> {
    const db = await getDb();
    const [config] = await db.select().from(privacyConfigs).where(eq(privacyConfigs.walletId, walletId));

    return (config as unknown as PrivacyConfig) || {
      walletId,
      privacyLevel: PrivacyLevel.MEDIUM,
      enableAutoPrivacy: false,
      maxHops: 2,
      splitCount: 2,
      minDelayMs: 1000,
      maxDelayMs: 5000,
      useRandomPath: true,
      avoidKnownTracking: true,
    };
  }

  private async updateTransferStatus(
    transferId: string,
    status: 'COMPLETED' | 'FAILED',
    completedTime?: Date
  ): Promise<void> {
    const db = await getDb();
    await db.update(privacyTransfers)
      .set({ 
        status,
        completedTime: completedTime || new Date(),
      })
      .where(eq(privacyTransfers.transferId, transferId));
  }
}

export const privacyProtectionService = new PrivacyProtectionService();
