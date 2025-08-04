import type {NextConfig} from 'next';

// Forcing a server restart to ensure new environment variables are loaded.
const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
   webpack: (config) => {
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;
