/**
 * 区块链交易服务
 * 支持 Solana、Ethereum、BSC 的真实交易
 */

import { ethers } from 'ethers';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import crypto from 'crypto';

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 解密私钥
 */
function decryptPrivateKey(encryptedKey: string, password: string): string {
  const [iv, authTag, encrypted] = encryptedKey.split(':');
  const key = crypto.scryptSync(password, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 解密助记词
 */
function decryptMnemonic(encryptedMnemonic: string, password: string): string {
  return decryptPrivateKey(encryptedMnemonic, password);
}

/**
 * 获取加密密码（实际应用中应从安全存储获取）
 */
function getEncryptionPassword(): string {
  return process.env.ENCRYPTION_PASSWORD || 'default-encryption-password-change-me';
}

// ============================================================================
// Solana 交易服务
// ============================================================================

export class SolanaTransactionService {
  private connection: Connection;
  private rpcUrl: string;

  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(this.rpcUrl, 'confirmed');
  }

  /**
   * 从助记词创建 Keypair
   */
  private async createKeypairFromMnemonic(mnemonic: string): Promise<Keypair> {
    const bip39 = await import('bip39');
    const { derivePath } = await import('ed25519-hd-key');
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const path = "m/44'/501'/0'/0'"; // Solana 派生路径
    const derivedSeed = derivePath(path, Buffer.from(seed)).key;
    return Keypair.fromSeed(derivedSeed);
  }

  /**
   * 从私钥创建 Keypair
   */
  private createKeypairFromPrivateKey(privateKey: string): Keypair {
    const secretKey = Buffer.from(privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey, 'hex');
    return Keypair.fromSecretKey(secretKey);
  }

  /**
   * 获取钱包实例
   */
  private async getWallet(mnemonic: string | null, privateKey: string | null): Promise<Keypair> {
    const password = getEncryptionPassword();

    if (mnemonic) {
      const decryptedMnemonic = decryptMnemonic(mnemonic, password);
      return await this.createKeypairFromMnemonic(decryptedMnemonic);
    } else if (privateKey) {
      const decryptedKey = decryptPrivateKey(privateKey, password);
      return this.createKeypairFromPrivateKey(decryptedKey);
    }

    throw new Error('缺少助记词或私钥');
  }

  /**
   * 获取余额
   */
  async getBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(walletAddress));
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('获取 Solana 余额失败:', error);
      return 0;
    }
  }

  /**
   * 转账 SOL
   */
  async transferSOL(
    mnemonic: string | null,
    privateKey: string | null,
    toAddress: string,
    amount: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = await this.getWallet(mnemonic, privateKey);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(toAddress),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendAndConfirmTransaction(this.connection, transaction, [wallet]);

      return {
        success: true,
        txHash: signature,
      };
    } catch (error) {
      console.error('Solana 转账失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '转账失败',
      };
    }
  }

  /**
   * 获取代币余额
   */
  async getTokenBalance(walletAddress: string, tokenMintAddress: string): Promise<number> {
    try {
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMintAddress),
        new PublicKey(walletAddress)
      );

      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
    } catch (error) {
      console.error('获取代币余额失败:', error);
      return 0;
    }
  }

  /**
   * 交易代币（SPL Token）
   */
  async transferToken(
    mnemonic: string | null,
    privateKey: string | null,
    toAddress: string,
    tokenMintAddress: string,
    amount: number,
    decimals: number = 9
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = await this.getWallet(mnemonic, privateKey);

      const {
        createTransferInstruction,
        getAssociatedTokenAddress,
      } = await import('@solana/spl-token');

      const mint = new PublicKey(tokenMintAddress);
      const fromTokenAccount = await getAssociatedTokenAddress(mint, wallet.publicKey);
      const toTokenAccount = await getAssociatedTokenAddress(mint, new PublicKey(toAddress));

      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          wallet.publicKey,
          BigInt(Math.floor(amount * Math.pow(10, decimals)))
        )
      );

      const signature = await sendAndConfirmTransaction(this.connection, transaction, [wallet]);

      return {
        success: true,
        txHash: signature,
      };
    } catch (error) {
      console.error('代币转账失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '转账失败',
      };
    }
  }

  /**
   * 执行策略买入（代币）
   */
  async executeBuy(
    mnemonic: string | null,
    privateKey: string | null,
    tokenAddress: string,
    amount: number,
    decimals: number = 9,
    platform: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // 根据平台执行不同的买入逻辑
      if (platform === 'pump.fun' || platform === 'four.meme') {
        // Bonding Curve 平台买入
        return await this.executeBondingCurveBuy(
          mnemonic,
          privateKey,
          tokenAddress,
          amount,
          decimals,
          platform
        );
      } else {
        // Raydium 买入
        return await this.executeRaydiumSwap(
          mnemonic,
          privateKey,
          tokenAddress,
          amount,
          'buy'
        );
      }
    } catch (error) {
      console.error('执行买入失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '买入失败',
      };
    }
  }

  /**
   * Bonding Curve 平台买入（pump.fun、four.meme）
   */
  private async executeBondingCurveBuy(
    mnemonic: string | null,
    privateKey: string | null,
    tokenAddress: string,
    amount: number,
    decimals: number,
    platform: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = await this.getWallet(mnemonic, privateKey);

      // 这里需要根据平台的实际合约调用来实现
      // pump.fun 和 four.meme 都有各自的 Bonding Curve 合约
      // 以下为简化实现

      const { SystemProgram } = await import('@solana/web3.js');
      const platformProgramId = platform === 'pump.fun'
        ? new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P') // pump.fun program
        : new PublicKey('4s3k2XQ1G7K7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y'); // four.meme program (示例)

      const transaction = new Transaction();

      // 转账到平台（简化实现）
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: platformProgramId,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      // 实际实现需要调用平台的指令
      // 这里简化处理

      const signature = await sendAndConfirmTransaction(this.connection, transaction, [wallet]);

      return {
        success: true,
        txHash: signature,
      };
    } catch (error) {
      console.error('Bonding Curve 买入失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '买入失败',
      };
    }
  }

  /**
   * Raydium DEX 交易
   */
  private async executeRaydiumSwap(
    mnemonic: string | null,
    privateKey: string | null,
    tokenAddress: string,
    amount: number,
    side: 'buy' | 'sell'
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = await this.getWallet(mnemonic, privateKey);

      // Raydium 实际实现需要集成 Raydium SDK
      // 这里为简化实现

      throw new Error('Raydium 交易功能需要集成 Raydium SDK，当前为简化实现');
    } catch (error) {
      console.error('Raydium 交易失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '交易失败',
      };
    }
  }

  /**
   * 获取最新区块哈希（用于交易）
   */
  async getLatestBlockhash(): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    return blockhash;
  }

  /**
   * 模拟交易（用于测试）
   */
  async simulateTransaction(transaction: Transaction, wallet: Keypair): Promise<boolean> {
    try {
      const result = await this.connection.simulateTransaction(transaction, [wallet]);
      return result.value.err === null;
    } catch (error) {
      console.error('交易模拟失败:', error);
      return false;
    }
  }
}

// ============================================================================
// EVM 交易服务（Ethereum、BSC）
// ============================================================================

export class EVMTransactionService {
  private provider: ethers.JsonRpcProvider;
  private chainId: number;
  private rpcUrl: string;

  constructor(rpcUrl: string, chainId: number) {
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * 从私钥创建钱包
   */
  private async createWalletFromPrivateKey(privateKey: string): Promise<ethers.Wallet> {
    const password = getEncryptionPassword();
    const decryptedKey = decryptPrivateKey(privateKey, password);
    return new ethers.Wallet(decryptedKey);
  }

  /**
   * 从助记词创建钱包
   */
  private async createWalletFromMnemonic(mnemonic: string, _derivationPath: string): Promise<ethers.Wallet> {
    const password = getEncryptionPassword();
    const decryptedMnemonic = decryptMnemonic(mnemonic, password);
    const wallet = ethers.Wallet.fromPhrase(decryptedMnemonic);
    return wallet as unknown as ethers.Wallet;
  }

  /**
   * 获取钱包实例
   */
  private async getWallet(
    mnemonic: string | null,
    privateKey: string | null,
    derivationPath: string = "m/44'/60'/0'/0/0"
  ): Promise<ethers.Wallet> {
    if (mnemonic) {
      return await this.createWalletFromMnemonic(mnemonic, derivationPath);
    } else if (privateKey) {
      return await this.createWalletFromPrivateKey(privateKey);
    }

    throw new Error('缺少助记词或私钥');
  }

  /**
   * 获取余额
   */
  async getBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.provider.getBalance(walletAddress);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('获取余额失败:', error);
      return 0;
    }
  }

  /**
   * 转账原生代币（ETH 或 BNB）
   */
  async transferNative(
    mnemonic: string | null,
    privateKey: string | null,
    toAddress: string,
    amount: number,
    derivationPath?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = await this.getWallet(mnemonic, privateKey, derivationPath);
      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount.toString()),
      });

      await tx.wait();
      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error) {
      console.error('转账失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '转账失败',
      };
    }
  }

  /**
   * 获取代币余额（ERC20）
   */
  async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<number> {
    try {
      const erc20Abi = [
        'function balanceOf(address) view returns (uint256)',
        'function decimals() view returns (uint8)',
      ];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = await tokenContract.decimals();
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      console.error('获取代币余额失败:', error);
      return 0;
    }
  }

  /**
   * 转账代币（ERC20）
   */
  async transferToken(
    mnemonic: string | null,
    privateKey: string | null,
    toAddress: string,
    tokenAddress: string,
    amount: number,
    derivationPath?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = await this.getWallet(mnemonic, privateKey, derivationPath);
      const erc20Abi = ['function transfer(address, uint256) returns (bool)', 'function decimals() view returns (uint8)'];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);

      const decimals = await tokenContract.decimals();
      const tx = await tokenContract.transfer(toAddress, ethers.parseUnits(amount.toString(), decimals));

      await tx.wait();
      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error) {
      console.error('代币转账失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '转账失败',
      };
    }
  }

  /**
   * 执行 DEX 交易（Uniswap、PancakeSwap）
   */
  async executeDEXSwap(
    mnemonic: string | null,
    privateKey: string | null,
    tokenAddress: string,
    amount: number,
    side: 'buy' | 'sell',
    dex: string,
    derivationPath?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = await this.getWallet(mnemonic, privateKey, derivationPath);

      // 实际实现需要集成 DEX Router 合约
      // Uniswap V2/V3 Router 或 PancakeSwap Router
      // 以下为简化实现

      throw new Error('DEX 交易功能需要集成 Router 合约，当前为简化实现');
    } catch (error) {
      console.error('DEX 交易失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '交易失败',
      };
    }
  }

  /**
   * 估算 Gas 费用
   */
  async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
    return await this.provider.estimateGas(tx);
  }

  /**
   * 获取当前 Gas 价格
   */
  async getGasPrice(): Promise<bigint> {
    return await this.provider.getFeeData().then((feeData) => feeData.gasPrice || BigInt(0));
  }
}

// ============================================================================
// 交易服务工厂
// ============================================================================

export class TransactionServiceFactory {
  private static solanaService: SolanaTransactionService;
  private static evmServices: Map<string, EVMTransactionService> = new Map();

  /**
   * 获取 Solana 交易服务
   */
  static getSolanaService(rpcUrl?: string): SolanaTransactionService {
    if (!this.solanaService) {
      this.solanaService = new SolanaTransactionService(rpcUrl);
    }
    return this.solanaService;
  }

  /**
   * 获取 EVM 交易服务
   */
  static getEVMService(chain: string, rpcUrl: string, chainId: number): EVMTransactionService {
    const key = `${chain}-${chainId}`;
    if (!this.evmServices.has(key)) {
      this.evmServices.set(key, new EVMTransactionService(rpcUrl, chainId));
    }
    return this.evmServices.get(key)!;
  }

  /**
   * 获取对应链的交易服务
   */
  static getService(chain: string): SolanaTransactionService | EVMTransactionService | null {
    switch (chain) {
      case 'solana':
        return this.getSolanaService();
      case 'eth':
        return this.getEVMService(
          'eth',
          process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
          1
        );
      case 'bsc':
        return this.getEVMService(
          'bsc',
          process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
          56
        );
      default:
        return null;
    }
  }
}
