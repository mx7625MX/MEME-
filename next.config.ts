import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // 优化构建内存使用
  swcMinify: true,
  compress: true,
  // 减少并行构建
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
