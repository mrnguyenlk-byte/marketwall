"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"

import { Plus, Star, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { clientDebug, features } from "@/lib/config/features"
import { useOpenSymbolDetail } from "@/hooks/useOpenSymbolDetail"
import { useLang } from "@/lib/i18n"
import {
  useCryptoMarkets,
  useGlobalMarkets,
  useVietnamMarkets,
} from "@/lib/swr/use-market-apis"
import { useWatchlist } from "@/lib/use-watchlist"
import { WATCHLIST_CATALOG, type WatchlistSymbol } from "@/lib/watchlist"
import { buildWatchlistQuoteMap, getWatchlistQuote, type WatchlistQuote } from "@/lib/watchlist-quotes"

import { ChangePill, Sparkline, SectionHeading, fmt, DashboardCard, DashboardCardBody } from "./shared"
import { SymbolLogo } from "./symbol-logo"

function WatchlistRow({
  symbol,
  quote,
  onRemove,
  onOpen,
  interactive,
}: {
  symbol: WatchlistSymbol
  quote: WatchlistQuote
  onRemove: (symbol: WatchlistSymbol) => void
  onOpen: (symbol: WatchlistSymbol) => void
  interactive: boolean
}) {
  const { lang, t } = useLang()
  const entry = WATCHLIST_CATALOG[symbol]
  const up = quote.trend === "up"
  const rowClassName =
    "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50"

  const content = (
    <>
      <SymbolLogo symbol={symbol} size="md" />
      <span
        className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground"
        title={`${symbol} — ${entry.name[lang]}`}
      >
        {symbol}
      </span>

      <Sparkline
        data={quote.sparkline}
        positive={up}
        className="hidden h-4 w-10 shrink-0 sm:block"
        width={40}
        height={16}
      />

      <div className="shrink-0 text-right">
        <p className="font-mono text-[11px] tabular-nums text-foreground">
          {fmt(quote.price)}
        </p>
        <ChangePill
          value={quote.changePercent}
          showIcon={false}
          className="mt-0.5 px-0.5 py-0 text-[9px]"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 text-muted-foreground hover:text-loss"
        aria-label={`${t("watchlist.remove")} ${symbol}`}
        onClick={(event) => {
          event.stopPropagation()
          onRemove(symbol)
        }}
      >
        <X className="size-3" aria-hidden />
      </Button>
    </>
  )

  if (interactive) {
    return (
      <li>
        <button type="button" className={rowClassName} onClick={() => onOpen(symbol)}>
          {content}
        </button>
      </li>
    )
  }

  return <li className={rowClassName}>{content}</li>
}

export function Watchlist() {
  const { t } = useLang()
  const { status } = useSession()
  const { symbols, add, remove, available } = useWatchlist()
  const { openSymbol, enabled: symbolClickEnabled } = useOpenSymbolDetail()

  const vietnam = useVietnamMarkets()
  const global = useGlobalMarkets()
  const crypto = useCryptoMarkets()

  const quotes = useMemo(() => {
    if (!features.liveClientFetch) {
      clientDebug("Watchlist", "using static fallback")
      return buildWatchlistQuoteMap(symbols)
    }

    return buildWatchlistQuoteMap(symbols, {
      vietnamIndices: vietnam.data?.indices ?? [],
      globalQuotes: global.data?.quotes ?? [],
      cryptoAssets: crypto.data?.assets ?? [],
    })
  }, [symbols, vietnam.data, global.data, crypto.data])

  return (
    <section aria-labelledby="watchlist-title">
      <SectionHeading
        title={t("sec.watchlist")}
        badge={<Star className="size-3.5 text-warn" aria-hidden />}
      />

      <DashboardCard className="ring-0">
        <DashboardCardBody className="pb-3">
          <p className="border-b border-border px-3 py-2 type-secondary-label leading-snug text-muted-foreground">
            {status === "authenticated" ? t("watchlist.synced") : t("watchlist.privacy")}
          </p>

          {symbols.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("watchlist.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {symbols.map((symbol) => {
                const quote = quotes.get(symbol) ?? getWatchlistQuote(symbol)
                return (
                  <WatchlistRow
                    key={symbol}
                    symbol={symbol}
                    quote={quote}
                    onRemove={remove}
                    interactive={symbolClickEnabled}
                    onOpen={(watchSymbol) =>
                      openSymbol(watchSymbol, {
                        hint: {
                          price: quote.price,
                          changePercent: quote.changePercent,
                        },
                      })
                    }
                  />
                )
              })}
            </ul>
          )}

          {available.length > 0 && (
            <div className="border-t border-border px-3 pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t("watchlist.addSymbol")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {available.map((symbol) => (
                  <Button
                    key={symbol}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => add(symbol)}
                  >
                    <Plus className="size-3" aria-hidden />
                    {symbol}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DashboardCardBody>
      </DashboardCard>
    </section>
  )
}

/** @deprecated Use Watchlist */
export const WatchlistPreview = Watchlist
