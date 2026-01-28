import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Meme Master Pro',
    template: '%s | Meme Master Pro',
  },
  description:
    'Meme Master Pro - 一站式 Meme 代币管理平台，支持多链钱包管理、一键发币、市场监控、闪电卖出、AI情绪分析、自动交易等功能。',
  keywords: [
    'Meme Master Pro',
    'Meme Token',
    '加密货币',
    '代币管理',
    'Solana',
    'BSC',
    '钱包管理',
    '代币发行',
    '市场监控',
    '自动交易',
    'AI情绪分析',
  ],
  authors: [{ name: 'Meme Master Pro Team' }],
  openGraph: {
    title: 'Meme Master Pro | Meme 代币管理平台',
    description:
      '一站式 Meme 代币管理平台，支持多链钱包管理、一键发币、市场监控、闪电卖出、AI情绪分析、自动交易等功能。',
    siteName: 'Meme Master Pro',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
