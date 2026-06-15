/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/platforms",
        destination: "/brokers",
        permanent: true,
      },
      {
        source: "/ads/banner-promo.png",
        destination: "/banners/promo-trade.png",
        permanent: true,
      },
      {
        source: "/ads/banner-partner.png",
        destination: "/banners/partner-platform.png",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
