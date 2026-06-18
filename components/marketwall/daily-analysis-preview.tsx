"use client"

import { DashboardCard, SectionHeading } from "./shared"
import { cn } from "@/lib/utils"

type AnalysisCard = {
  id: string
  market: string
  marketBadgeClass: string
  date: string
  title: string
  summary: string
  bullets: { label: string; text: string }[]
  chartColor: string
}

const MOCK_CARDS: AnalysisCard[] = [
  {
    id: "vnindex",
    market: "VNINDEX",
    marketBadgeClass: "bg-red-500/15 text-red-700 dark:text-red-300",
    date: "18/06/2026",
    title: "VN-Index duy trì xu hướng tích cực trong phiên",
    summary:
      "Thị trường trong nước tiếp tục được hỗ trợ bởi dòng tiền nội địa và nhóm ngân hàng dẫn dắt.",
    bullets: [
      { label: "Xu hướng", text: "Tăng ngắn hạn với nhịp điều chỉnh lành mạnh" },
      { label: "Kháng cự", text: "1.290 – 1.295 điểm" },
      { label: "Hỗ trợ", text: "1.265 – 1.270 điểm" },
    ],
    chartColor: "#22c55e",
  },
  {
    id: "xauusd",
    market: "XAUUSD",
    marketBadgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    date: "18/06/2026",
    title: "Vàng sideway chờ tín hiệu Fed",
    summary:
      "Giá vàng dao động trong biên hẹp khi nhà đầu tư theo dõi dữ liệu lạm phát và định hướng lãi suất.",
    bullets: [
      { label: "Xu hướng", text: "Sideway trong vùng 2.320 – 2.380" },
      { label: "Kháng cự", text: "2.380 – 2.395 USD/oz" },
      { label: "Hỗ trợ", text: "2.320 – 2.335 USD/oz" },
    ],
    chartColor: "#eab308",
  },
]

function PlaceholderChart({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 280 80"
      className="h-20 w-full text-muted-foreground/40"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`chart-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d="M0 55 L35 48 L70 52 L105 38 L140 42 L175 28 L210 32 L245 18 L280 22 L280 80 L0 80 Z"
        fill={`url(#chart-fill-${color})`}
      />
      <polyline
        points="0,55 35,48 70,52 105,38 140,42 175,28 210,32 245,18 280,22"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AnalysisPreviewCard({ card }: { card: AnalysisCard }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            card.marketBadgeClass,
          )}
        >
          {card.market}
        </span>
        <time className="text-[11px] text-muted-foreground">{card.date}</time>
      </div>
      <h3 className="text-sm font-semibold leading-snug text-foreground">{card.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{card.summary}</p>
      <ul className="mt-3 space-y-1.5 text-xs">
        {card.bullets.map((item) => (
          <li key={item.label} className="flex gap-2">
            <span className="shrink-0 font-semibold text-foreground">{item.label}:</span>
            <span className="text-muted-foreground">{item.text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-md bg-secondary/30 px-2 py-1">
        <PlaceholderChart color={card.chartColor} />
      </div>
      <button
        type="button"
        className="mt-4 self-start text-xs font-semibold text-primary transition-colors hover:text-primary/80"
      >
        Đọc Thêm →
      </button>
    </article>
  )
}

export function DailyAnalysisPreview() {
  return (
    <section id="daily-analysis" aria-labelledby="daily-analysis-title" className="min-w-0 scroll-mt-20">
      <SectionHeading
        id="daily-analysis-title"
        title="Phân Tích Hằng Ngày"
        subtitle="Tổng hợp các nhận định quan trọng về thị trường mỗi ngày"
      />
      <DashboardCard className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MOCK_CARDS.map((card) => (
            <AnalysisPreviewCard key={card.id} card={card} />
          ))}
        </div>
      </DashboardCard>
    </section>
  )
}
