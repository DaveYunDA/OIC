import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  // 确保客户端路由正常工作
  trailingSlash: false,
  // 添加重写规则确保 SPA 路由正常工作
  async rewrites() {
    return [
      {
        source: '/((?!api|_next|_static|favicon.ico).*)',
        destination: '/',
      },
    ];
  },
  // 添加错误处理
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
