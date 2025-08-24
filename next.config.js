/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-wasm']
  },
  webpack: (config) => {
    // 允许 WebAssembly (WASM) 在构建中使用
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
      layers: true
    };
    return config;
  }
};

export default nextConfig;
