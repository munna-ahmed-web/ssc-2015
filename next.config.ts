import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // ImgBB (direct image hosts + share-page domains)
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ibb.co.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
