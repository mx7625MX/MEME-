// 类型声明文件，用于缺少的依赖包

declare module 'ed25519-hd-key' {
  export function derivePath(path: string, seed: Buffer): {
    key: Buffer;
    chainCode: Buffer;
  };
}

declare module '@solana/spl-token' {
  import { Connection, PublicKey, Signer, Transaction } from '@solana/web3.js';

  export function getAssociatedTokenAddress(
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve?: boolean,
    programId?: PublicKey,
    associatedTokenProgramId?: PublicKey
  ): Promise<PublicKey>;

  export function createTransferInstruction(
    source: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: bigint,
    decimals?: number,
    programId?: PublicKey
  ): Transaction;
}

declare module 'ethers/lib/utils' {
  export function HDNode(): any;
}
