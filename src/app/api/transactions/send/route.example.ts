/**
 * 真实交易 API 示例
 *
 * 这个文件展示了如何在云平台上实现真正的区块链交易
 *
 * ⚠️ 重要说明：
 * 1. 只能在 API Routes 中使用，不能在前端调用
 * 2. 私钥必须通过环境变量配置
 * 3. 所有交易都需要验证和授权
 * 4. 生产环境需要额外的安全措施
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSigner, isValidAddress, NetworkKey } from '@/lib/blockchain';
import { getDb } from 'coze-coding-dev-sdk';

// 交易配置
const MIN_TRANSACTION_AMOUNT = '0.0001'; // 最小交易金额（ETH）
const MAX_TRANSACTION_AMOUNT = '1000'; // 最大交易金额（ETH）
const DAILY_TRANSACTION_LIMIT = 100; // 每日交易次数限制

// 内存存储交易计数（生产环境应使用 Redis）
const transactionCounts = new Map<string, { count: number; date: string }>();

/**
 * 验证交易请求
 */
function validateTransactionRequest(to: string, amount: string, network: NetworkKey) {
  // 验证接收地址
  if (!isValidAddress(to)) {
    throw new Error('Invalid recipient address');
  }

  // 验证金额
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    throw new Error('Invalid amount');
  }

  if (numAmount < parseFloat(MIN_TRANSACTION_AMOUNT)) {
    throw new Error(`Amount must be at least ${MIN_TRANSACTION_AMOUNT} ETH`);
  }

  if (numAmount > parseFloat(MAX_TRANSACTION_AMOUNT)) {
    throw new Error(`Amount cannot exceed ${MAX_TRANSACTION_AMOUNT} ETH`);
  }

  // 验证网络
  if (!['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base', 'avalanche'].includes(network)) {
    throw new Error('Unsupported network');
  }
}

/**
 * 检查每日交易限制
 */
function checkDailyLimit(userId: string) {
  const today = new Date().toDateString();
  const record = transactionCounts.get(userId);

  if (!record || record.date !== today) {
    transactionCounts.set(userId, { count: 0, date: today });
    return true;
  }

  if (record.count >= DAILY_TRANSACTION_LIMIT) {
    throw new Error(`Daily transaction limit (${DAILY_TRANSACTION_LIMIT}) reached`);
  }

  return true;
}

/**
 * 记录交易
 */
async function logTransaction(
  db: any,
  userId: string,
  txHash: string,
  to: string,
  amount: string,
  network: string,
  status: string
) {
  try {
    await db.execute(`
      INSERT INTO transactions (user_id, tx_hash, to_address, amount, network, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [userId, txHash, to, amount, network, status]);
  } catch (error) {
    console.error('Failed to log transaction:', error);
  }
}

/**
 * POST /api/transactions/send
 *
 * 发送真实交易到区块链网络
 *
 * 请求体：
 * {
 *   "to": "0x...",          // 接收地址
 *   "amount": "1.0",        // 金额（ETH 单位）
 *   "network": "ethereum"   // 区块链网络
 * }
 *
 * 响应：
 * {
 *   "success": true,
 *   "data": {
 *     "txHash": "0x...",
 *     "blockNumber": 12345678,
 *     "status": "success"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求
    const body = await request.json();
    const { to, amount, network = 'ethereum' } = body;

    // 验证请求
    validateTransactionRequest(to, amount, network);

    // 获取用户 ID（从 session 或 JWT token）
    // 这里简化处理，生产环境应该从认证中获取
    const userId = request.headers.get('x-user-id') || 'anonymous';

    // 检查每日限制
    checkDailyLimit(userId);

    // 检查环境配置
    const enableRealTransactions = process.env.ENABLE_REAL_TRANSACTIONS === 'true';
    if (!enableRealTransactions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Real transactions are disabled in this environment',
          message: 'Please enable ENABLE_REAL_TRANSACTIONS in production'
        },
        { status: 503 }
      );
    }

    // 获取数据库连接
    const db = await getDb();

    try {
      // 获取签名者（从环境变量读取私钥）
      const signer = getSigner(network as NetworkKey);

      // 构建交易
      const tx = {
        to,
        value: amount, // 自动转换为 wei
        gasLimit: 21000 // 标准 ETH 转账
      };

      // 签名并发送交易
      const sentTx = await signer.sendTransaction(tx);

      // 更新交易计数
      const record = transactionCounts.get(userId);
      if (record) {
        record.count++;
      }

      // 记录交易到数据库
      await logTransaction(db, userId, sentTx.hash, to, amount, network, 'pending');

      // 等待交易确认（超时 5 分钟）
      const receipt = await Promise.race([
        sentTx.wait(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transaction timeout')), 5 * 60 * 1000)
        )
      ]);

      // 更新交易状态
      await logTransaction(
        db,
        userId,
        sentTx.hash,
        to,
        amount,
        network,
        receipt.status === 1 ? 'success' : 'failed'
      );

      // 返回结果
      return NextResponse.json({
        success: true,
        data: {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status === 1 ? 'success' : 'failed',
          network,
          amount
        }
      });

    } catch (txError: any) {
      // 记录失败交易
      await logTransaction(db, userId, '0x0', to, amount, network, 'failed');

      // 判断错误类型
      if (txError.code === 'INSUFFICIENT_FUNDS') {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds in wallet' },
          { status: 400 }
        );
      }

      if (txError.code === 'NONCE_EXPIRED') {
        return NextResponse.json(
          { success: false, error: 'Transaction nonce expired, please try again' },
          { status: 400 }
        );
      }

      if (txError.code === 'REPLACEMENT_UNDERPRICED') {
        return NextResponse.json(
          { success: false, error: 'Gas price too low, please try again with higher gas' },
          { status: 400 }
        );
      }

      throw txError;
    }

  } catch (error: any) {
    console.error('Transaction error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Transaction failed',
        code: error.code
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transactions/send
 *
 * 获取交易状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');
    const network = searchParams.get('network') || 'ethereum';

    if (!txHash) {
      return NextResponse.json(
        { success: false, error: 'Transaction hash required' },
        { status: 400 }
      );
    }

    // 动态导入 ethers（仅服务端）
    const { ethers } = await import('ethers');
    const { getProvider } = await import('@/lib/blockchain');

    const provider = getProvider(network as NetworkKey);
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const receipt = await provider.getTransactionReceipt(txHash);

    return NextResponse.json({
      success: true,
      data: {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        status: receipt?.status === 1 ? 'success' : 'pending',
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
        confirmations: receipt ? await tx.confirmations() : 0
      }
    });

  } catch (error: any) {
    console.error('Get transaction error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get transaction'
      },
      { status: 500 }
    );
  }
}
