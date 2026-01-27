/**
 * 区块链连接配置
 *
 * 安全说明：
 * 1. 永远不要在前端代码中包含私钥
 * 2. 私钥只能存储在服务端环境变量中
 * 3. 所有签名操作只能在 API Routes 中进行
 */

import { ethers } from 'ethers';

// 支持的区块链网络配置
export const SUPPORTED_NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    explorerUrl: 'https://etherscan.io'
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com'
  },
  bsc: {
    name: 'Binance Smart Chain',
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com'
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io'
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io'
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org'
  },
  avalanche: {
    name: 'Avalanche',
    chainId: 43114,
    rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io'
  }
} as const;

export type NetworkKey = keyof typeof SUPPORTED_NETWORKS;

/**
 * 获取区块链 Provider
 *
 * ⚠️ 只能在服务端使用（API Routes）
 *
 * @param network - 区块链网络名称
 * @returns ethers.Provider
 */
export function getProvider(network: NetworkKey = 'ethereum') {
  const config = SUPPORTED_NETWORKS[network];

  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }

  if (!config.rpcUrl) {
    throw new Error(`RPC URL not configured for ${network}`);
  }

  return new ethers.JsonRpcProvider(config.rpcUrl);
}

/**
 * 获取钱包 Signer（仅服务端）
 *
 * ⚠️ 警告：私钥只能存储在环境变量中，绝不能出现在代码中！
 * ⚠️ 只能在 API Routes 中使用，不能在前端调用！
 *
 * @param network - 区块链网络名称
 * @param privateKey - 私钥（从环境变量读取）
 * @returns ethers.Signer
 */
export function getSigner(network: NetworkKey, privateKey?: string) {
  const provider = getProvider(network);

  const key = privateKey || process.env.WALLET_PRIVATE_KEY;

  if (!key) {
    throw new Error('WALLET_PRIVATE_KEY not configured in environment variables');
  }

  // 验证私钥格式
  if (!key.startsWith('0x')) {
    throw new Error('Private key must start with 0x');
  }

  if (key.length !== 66) {
    throw new Error('Private key must be 64 characters (excluding 0x)');
  }

  return new ethers.Wallet(key, provider);
}

/**
 * 创建新钱包
 *
 * @returns 新生成的钱包对象（包含私钥，仅在创建时返回）
 *
 * ⚠️ 安全提醒：
 * 1. 创建后立即将私钥加密存储到数据库
 * 2. 不要在前端返回私钥
 * 3. 考虑使用 HD 钱包进行批量创建
 */
export function createWallet() {
  const wallet = ethers.Wallet.createRandom();

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase
  };
}

/**
 * 加密私钥
 *
 * @param privateKey - 明文私钥
 * @param encryptionKey - 加密密钥（从环境变量读取）
 * @returns 加密后的私钥（Base64）
 */
export async function encryptPrivateKey(
  privateKey: string,
  encryptionKey?: string
): Promise<string> {
  const crypto = await import('crypto');
  const key = encryptionKey || process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * 解密私钥
 *
 * @param encryptedKey - 加密的私钥（Base64）
 * @param encryptionKey - 加密密钥（从环境变量读取）
 * @returns 明文私钥
 */
export async function decryptPrivateKey(
  encryptedKey: string,
  encryptionKey?: string
): Promise<string> {
  const crypto = await import('crypto');
  const key = encryptionKey || process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  const buffer = Buffer.from(encryptedKey, 'base64');
  const iv = buffer.subarray(0, 16);
  const tag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * 发送交易（服务端签名）
 *
 * ⚠️ 只能在 API Routes 中调用
 *
 * @param network - 区块链网络
 * @param to - 接收地址
 * @param amount - 金额（ETH 单位）
 * @param privateKey - 可选的私钥（默认从环境变量读取）
 * @returns 交易收据
 */
export async function sendTransaction(
  network: NetworkKey,
  to: string,
  amount: string,
  privateKey?: string
) {
  const signer = getSigner(network, privateKey);

  // 构建交易
  const tx = {
    to,
    value: ethers.parseEther(amount),
    gasLimit: 21000 // 标准转账 gas limit
  };

  // 签名并发送交易
  const sentTx = await signer.sendTransaction(tx);

  // 等待交易确认
  const receipt = await sentTx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status === 1 ? 'success' : 'failed'
  };
}

/**
 * 获取余额
 *
 * @param network - 区块链网络
 * @param address - 钱包地址
 * @returns 余额（ETH 单位）
 */
export async function getBalance(network: NetworkKey, address: string): Promise<string> {
  const provider = getProvider(network);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

/**
 * 验证地址格式
 *
 * @param address - 钱包地址
 * @returns 是否有效
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * 获取交易详情
 *
 * @param network - 区块链网络
 * @param txHash - 交易哈希
 * @returns 交易信息
 */
export async function getTransaction(network: NetworkKey, txHash: string) {
  const provider = getProvider(network);
  const tx = await provider.getTransaction(txHash);

  if (!tx) {
    throw new Error('Transaction not found');
  }

  const receipt = await provider.getTransactionReceipt(txHash);

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: ethers.formatEther(tx.value),
    status: receipt?.status === 1 ? 'success' : 'failed',
    blockNumber: receipt?.blockNumber,
    gasUsed: receipt?.gasUsed.toString()
  };
}
