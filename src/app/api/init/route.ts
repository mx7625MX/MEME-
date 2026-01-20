import { NextRequest, NextResponse } from "next/server";
import {
  walletManager,
  marketDataManager,
  settingsManager,
} from "@/storage/database";

// POST /api/init - 初始化示例数据
export async function POST(request: NextRequest) {
  try {
    // 创建示例钱包
    const sampleWallets = [
      {
        name: "Solana 主钱包",
        chain: "solana" as const,
        address: "5xKp...k9P2",
        balance: "1234.56",
        isActive: true,
      },
      {
        name: "BSC 钱包",
        chain: "bsc" as const,
        address: "0x7aB...3fB9",
        balance: "2.5",
        isActive: true,
      },
      {
        name: "ETH 备用钱包",
        chain: "eth" as const,
        address: "0x3dC...8cA1",
        balance: "0",
        isActive: false,
      },
    ];

    for (const wallet of sampleWallets) {
      await walletManager.createWallet(wallet);
    }

    // 创建示例市场数据
    const sampleMarketData = [
      {
        tokenSymbol: "PEPE",
        price: "0.00001234",
        change24h: "15.2",
        volume24h: "45600000",
        marketCap: "4500000000",
        isHot: true,
      },
      {
        tokenSymbol: "DOGE",
        price: "0.0823",
        change24h: "8.7",
        volume24h: "1200000000",
        marketCap: "12000000000",
        isHot: true,
      },
      {
        tokenSymbol: "SHIB",
        price: "0.0000245",
        change24h: "-2.3",
        volume24h: "890000000",
        marketCap: "14000000000",
        isHot: false,
      },
      {
        tokenSymbol: "WIF",
        price: "3.45",
        change24h: "25.6",
        volume24h: "123000000",
        marketCap: "3400000000",
        isHot: true,
      },
      {
        tokenSymbol: "BONK",
        price: "0.0000189",
        change24h: "5.4",
        volume24h: "67000000",
        marketCap: "1200000000",
        isHot: false,
      },
    ];

    for (const data of sampleMarketData) {
      await marketDataManager.createMarketData(data);
    }

    // 创建示例配置
    const sampleSettings = [
      { key: "system.theme", value: "dark", category: "ui" },
      { key: "system.language", value: "zh-CN", category: "ui" },
      { key: "trading.defaultChain", value: "solana", category: "trading" },
      { key: "trading.slippage", value: "1.0", category: "trading" },
    ];

    for (const setting of sampleSettings) {
      await settingsManager.setSetting(setting);
    }

    return NextResponse.json({
      success: true,
      message: "Sample data initialized successfully",
      data: {
        wallets: sampleWallets.length,
        marketData: sampleMarketData.length,
        settings: sampleSettings.length,
      },
    });
  } catch (error: any) {
    console.error("Error initializing data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to initialize data",
      },
      { status: 500 }
    );
  }
}

// GET /api/init - 检查初始化状态
export async function GET(request: NextRequest) {
  try {
    const [walletStats, marketData] = await Promise.all([
      walletManager.getWalletStats(),
      marketDataManager.getMarketData({ limit: 1 }),
    ]);

    const isInitialized =
      walletStats.total > 0 && marketData.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        initialized: isInitialized,
        walletCount: walletStats.total,
        marketDataCount: marketData.length,
      },
    });
  } catch (error: any) {
    console.error("Error checking init status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check init status",
      },
      { status: 500 }
    );
  }
}
