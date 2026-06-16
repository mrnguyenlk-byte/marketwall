"use client"

import dynamic from "next/dynamic"

export const StockDetailModal = dynamic(
  () =>
    import("@/components/heatmap/StockDetailModal").then((mod) => ({
      default: mod.StockDetailModal,
    })),
  { ssr: false },
)
