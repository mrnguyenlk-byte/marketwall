/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com", pathname: "/**" },
      { protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons/**" },
      { protocol: "https", hostname: "ssi.com.vn", pathname: "/**" },
      { protocol: "https", hostname: "vndirect.com.vn", pathname: "/**" },
      { protocol: "https", hostname: "tcbs.com.vn", pathname: "/**" },
      { protocol: "https", hostname: "vps.com.vn", pathname: "/**" },
      { protocol: "https", hostname: "hsc.com.vn", pathname: "/**" },
      { protocol: "https", hostname: "mbs.com.vn", pathname: "/**" },
      { protocol: "https", hostname: "exness.com", pathname: "/**" },
      { protocol: "https", hostname: "icmarkets.com", pathname: "/**" },
      { protocol: "https", hostname: "xm.com", pathname: "/**" },
      { protocol: "https", hostname: "pepperstone.com", pathname: "/**" },
      { protocol: "https", hostname: "fbs.com", pathname: "/**" },
      { protocol: "https", hostname: "fxtm.com", pathname: "/**" },
    ],
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
