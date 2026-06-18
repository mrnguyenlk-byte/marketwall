"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export type DivergingFlowSide = {
  symbol: string
  sector?: string
  displayValue: number
  rawValue: number
}

export type DivergingFlowRow = {
  rank: number
  buy?: DivergingFlowSide
  sell?: DivergingFlowSide
}

export function maxDivergingMagnitude(rows: DivergingFlowRow[]): number {
  let max = 0
  for (const row of rows) {
    if (row.buy) max = Math.max(max, row.buy.displayValue)
    if (row.sell) max = Math.max(max, row.sell.displayValue)
  }
  return max || 1
}

function SideTooltip({
  side,
  formatValue,
}: {
  side: DivergingFlowSide
  formatValue: (side: DivergingFlowSide) => string
}) {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <p className="font-semibold">{side.symbol}</p>
      <p>{formatValue(side)} VND</p>
      {side.sector ? (
        <p className="text-background/70">
          {t("label.sector")}: {side.sector}
        </p>
      ) : null}
    </div>
  )
}

function FlowBar({
  side,
  direction,
  widthPct,
  formatValue,
}: {
  side: DivergingFlowSide
  direction: "buy" | "sell"
  widthPct: number
  formatValue: (side: DivergingFlowSide) => string
}) {
  const isBuy = direction === "buy"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              "group relative flex h-7 min-w-[2rem] items-center rounded-sm px-1 transition-opacity hover:opacity-90 sm:h-8",
              isBuy ? "justify-start bg-gain/85" : "justify-end bg-loss/85",
            )}
            style={{ width: `${Math.max(widthPct, 6)}%` }}
            aria-label={`${side.symbol} ${formatValue(side)}`}
          />
        }
      />
      <TooltipContent side="top" className="p-2.5">
        <SideTooltip side={side} formatValue={formatValue} />
      </TooltipContent>
    </Tooltip>
  )
}

export function DivergingFlowChart({
  rows,
  formatValue,
  unitLabel,
}: {
  rows: DivergingFlowRow[]
  formatValue: (side: DivergingFlowSide) => string
  unitLabel?: string
}) {
  const { t } = useLang()
  const maxMag = maxDivergingMagnitude(rows)

  return (
    <TooltipProvider delay={120}>
      <div className="relative">
        <div className="mb-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>{t("foreignFlow.netSell")}</span>
          <span>{t("foreignFlow.netBuy")}</span>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 left-1/2 top-6 z-10 w-px -translate-x-1/2 bg-border"
          aria-hidden
        />

        <div className="space-y-1.5">
          {rows.map((row) => (
            <div
              key={`diverging-flow-${row.rank}`}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
            >
              <div className="flex items-center justify-end gap-2">
                {row.sell ? (
                  <>
                    <span className="hidden font-mono text-[10px] tabular-nums text-loss sm:inline">
                      {formatValue(row.sell)}
                    </span>
                    <FlowBar
                      side={row.sell}
                      direction="sell"
                      widthPct={(row.sell.displayValue / maxMag) * 100}
                      formatValue={formatValue}
                    />
                    <span className="w-10 shrink-0 text-right text-[10px] font-semibold text-foreground sm:w-11">
                      {row.sell.symbol}
                    </span>
                  </>
                ) : (
                  <span className="h-7 sm:h-8" />
                )}
              </div>

              <span className="w-5 text-center font-mono text-[9px] text-muted-foreground">
                {row.rank}
              </span>

              <div className="flex items-center gap-2">
                {row.buy ? (
                  <>
                    <span className="w-10 shrink-0 text-[10px] font-semibold text-foreground sm:w-11">
                      {row.buy.symbol}
                    </span>
                    <FlowBar
                      side={row.buy}
                      direction="buy"
                      widthPct={(row.buy.displayValue / maxMag) * 100}
                      formatValue={formatValue}
                    />
                    <span className="hidden font-mono text-[10px] tabular-nums text-gain sm:inline">
                      {formatValue(row.buy)}
                    </span>
                  </>
                ) : (
                  <span className="h-7 sm:h-8" />
                )}
              </div>
            </div>
          ))}
        </div>

        {unitLabel ? (
          <p className="mt-3 text-center text-[10px] text-muted-foreground">{unitLabel}</p>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
