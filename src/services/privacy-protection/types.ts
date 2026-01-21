// 隐私保护类型定义

export enum PrivacyLevel {
  LOW = 'LOW',           // 低级：单次转账
  MEDIUM = 'MEDIUM',     // 中级：1-2 跳中转
  HIGH = 'HIGH',         // 高级：3-5 跳中转 + 拆分
  EXTREME = 'EXTREME',   // 极端：5+ 跳 + 多次拆分 + 随机延迟
}

export interface PrivacyConfig {
  walletId: string;
  privacyLevel: PrivacyLevel;
  enableAutoPrivacy: boolean;
  maxHops: number;
  splitCount: number;
  minDelayMs: number;
  maxDelayMs: number;
  useRandomPath: boolean;
  avoidKnownTracking: boolean;
}

export interface HopWallet {
  address: string;
  privateKey: string;    // 加密存储
  chain: string;
  isTemporary: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface TransferHop {
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenSymbol: string;
  estimatedFee: string;
  delayMs?: number;
}

export interface PrivacyTransferPath {
  totalHops: number;
  estimatedTotalFee: string;
  estimatedTime: string;
  hops: TransferHop[];
  privacyScore: number;  // 0-100
}

export interface PrivacyTransferRequest {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  tokenSymbol: string;
  chain: string;
  privacyLevel?: PrivacyLevel;
  customConfig?: Partial<PrivacyConfig>;
}

export interface PrivacyTransferResult {
  transferId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  path: PrivacyTransferPath;
  actualHops: TransferHop[];
  startTime: Date;
  completedTime?: Date;
  privacyScore: number;
  trackingDetection?: TrackingAnalysis;
}

export interface TrackingAnalysis {
  hasDirectLink: boolean;
  suspiciousPattern: boolean;
  riskScore: number;  // 0-100
  detectedChains: string[];
  warnings: string[];
}

export interface WalletPrivacyReport {
  walletId: string;
  privacyScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trackingAnalysis: TrackingAnalysis;
  recommendations: string[];
  lastAnalyzed: Date;
}
