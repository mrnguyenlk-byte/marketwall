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
    ]
  },
}

export default nextConfig
