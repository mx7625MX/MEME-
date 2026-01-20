import * as bip39 from "bip39";
import * as ethers from "ethers";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export interface WalletInfo {
  address: string;
  mnemonic: string;
  privateKey: string;
}

// Ethereum / BSC Wallet
export class EthereumWallet {
  static generate(): WalletInfo {
    const mnemonic = bip39.generateMnemonic();
    const wallet = ethers.Wallet.fromPhrase(mnemonic);

    return {
      address: wallet.address,
      mnemonic,
      privateKey: wallet.privateKey,
    };
  }

  static fromMnemonic(mnemonic: string): WalletInfo {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return {
      address: wallet.address,
      mnemonic,
      privateKey: wallet.privateKey,
    };
  }

  static fromPrivateKey(privateKey: string): WalletInfo {
    const wallet = new ethers.Wallet(privateKey);
    return {
      address: wallet.address,
      mnemonic: "", // No mnemonic from private key
      privateKey,
    };
  }

  static validateAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}

// Solana Wallet
export class SolanaWallet {
  static generate(): WalletInfo {
    const mnemonic = bip39.generateMnemonic();
    const keypair = this.keypairFromMnemonic(mnemonic);

    return {
      address: keypair.publicKey.toBase58(),
      mnemonic,
      privateKey: bs58.encode(keypair.secretKey),
    };
  }

  static fromMnemonic(mnemonic: string): WalletInfo {
    const keypair = this.keypairFromMnemonic(mnemonic);

    return {
      address: keypair.publicKey.toBase58(),
      mnemonic,
      privateKey: bs58.encode(keypair.secretKey),
    };
  }

  static fromPrivateKey(privateKey: string): WalletInfo {
    const secretKey = bs58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    return {
      address: keypair.publicKey.toBase58(),
      mnemonic: "",
      privateKey,
    };
  }

  private static keypairFromMnemonic(mnemonic: string): Keypair {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    return Keypair.fromSeed(seed.slice(0, 32));
  }

  static validateAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
}

// Unified wallet factory
export function createWallet(chain: "eth" | "bsc" | "solana"): WalletInfo {
  switch (chain) {
    case "eth":
    case "bsc":
      return EthereumWallet.generate();
    case "solana":
      return SolanaWallet.generate();
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}

export function restoreWallet(
  chain: "eth" | "bsc" | "solana",
  mnemonic: string
): WalletInfo {
  switch (chain) {
    case "eth":
    case "bsc":
      return EthereumWallet.fromMnemonic(mnemonic);
    case "solana":
      return SolanaWallet.fromMnemonic(mnemonic);
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}

export function validateAddress(chain: string, address: string): boolean {
  switch (chain) {
    case "eth":
    case "bsc":
      return EthereumWallet.validateAddress(address);
    case "solana":
      return SolanaWallet.validateAddress(address);
    default:
      return false;
  }
}
