/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEOCODE_API_KEY: process.env.GEOCODE_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  typescript: {
    // Exclude Supabase Edge Functions from TypeScript checking
    ignoreBuildErrors: true
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self' https://*.supabase.co https://*.opencagedata.com https://generativelanguage.googleapis.com https://cdn.jsdelivr.net https://js.stripe.com; connect-src 'self' https://*.supabase.co https://*.opencagedata.com https://generativelanguage.googleapis.com https://cdn.jsdelivr.net https://api.openai.com https://api.stripe.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://js.stripe.com; script-src-elem 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://js.stripe.com; media-src 'self' blob: https://d4qgj78fzsl5j.cloudfront.net; img-src 'self' data: blob: https://*.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com;"
        }
      ]
    }
  ],
  webpack: (config) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, 'lib'),
    };

    config.module.rules.push({
      test: /\.(mp4|webm)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/',
          outputPath: 'static/',
          name: '[name].[hash].[ext]',
        },
      },
    });

    // Handle Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: require.resolve('stream-browserify'),
      zlib: require.resolve('browserify-zlib'),
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
      process: require.resolve("process/browser")
    };

    // Add buffer polyfill
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    // Exclude problematic files
    config.module.rules.push({
      test: /onnxruntime_binding\.node$/,
      use: 'null-loader',
    });

    // Handle CSS files with built-in Next.js CSS handling

    return config;
  },
}

module.exports = nextConfig
