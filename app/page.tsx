import type { Metadata } from "next"

import { LandingPage } from "@/components/landing/landing-page"

export const metadata: Metadata = {
  title: "BTrading Market Insights | Hệ sinh thái cho trader",
  description:
    "Kiến thức, phân tích thị trường và công cụ theo dõi dành cho trader Việt Nam.",
  alternates: { canonical: "/" },
}

export default function Page() {
  return <LandingPage />
}
