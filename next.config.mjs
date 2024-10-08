/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/lucia-starter",
  experimental: {
    serverComponentsExternalPackages: ["oslo"],
    taint: true,
  },
  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
    return config;
  },
};

export default nextConfig;
