"use client"

import { useEffect, useState } from "react"

import { Plus, Star, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { useWatchlist } from "@/lib/use-watchlist"
import { WATCHLIST_CATALOG, type WatchlistSymbol } from "@/lib/watchlist"
import { buildWatchlistQuoteMap, getWatchlistQuote, type WatchlistQuote } from "@/lib/watchlist-quotes"
import type { CryptoAsset } from "@/lib/providers/crypto-provider"
import type { GlobalQuote } from "@/lib/providers/global-market-provider"
import type { VietnamMarketIndex } from "@/lib/providers/vietnam-market-provider"

import { ChangePill, Sparkline, SectionHeading, fmt } from "./shared"
import { SymbolLogo } from "./symbol-logo"

type MarketsBundle = {
  vietnamIndices: VietnamMarketIndex[]
  globalQuotes: GlobalQuote[]
  cryptoAssets: CryptoAsset[]
}

function WatchlistRow({
  symbol,
  quote,
  onRemove,
}: {
  symbol: WatchlistSymbol
  quote: WatchlistQuote
  onRemove: (symbol: WatchlistSymbol) => void
}) {
  const { lang, t } = useLang()
  const entry = WATCHLIST_CATALOG[symbol]
  const up = quote.trend === "up"

  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-secondary/40">
      <div className="flex min-w-0 items-center gap-2">
        <SymbolLogo symbol={symbol} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{symbol}</p>
          <p className="truncate text-xs text-muted-foreground">{entry.name[lang]}</p>
        </div>
      </div>

      <Sparkline
        data={quote.sparkline}
        positive={up}
        className="hidden h-7 w-16 shrink-0 sm:block"
      />

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-sm tabular-nums text-foreground">
            {fmt(quote.price)}
          </span>
          <ChangePill value={quote.changePercent} showIcon={false} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-loss"
          aria-label={`${t("watchlist.remove")} ${symbol}`}
          onClick={() => onRemove(symbol)}
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>
    </li>
  )
}

export function Watchlist() {
  const { t } = useLang()
  const { symbols, add, remove, available } = useWatchlist()
  const [quotes, setQuotes] = useState<Map<WatchlistSymbol, WatchlistQuote>>(() =>
    buildWatchlistQuoteMap(symbols),
  )

  useEffect(() => {
    let cancelled = false

    async function loadQuotes() {
      try {
        const [vietnamRes, globalRes, cryptoRes] = await Promise.all([
          fetch("/api/vietnam-markets", { cache: "no-store" }),
          fetch("/api/global-markets", { cache: "no-store" }),
          fetch("/api/crypto", { cache: "no-store" }),
        ])

        const bundle: MarketsBundle = {
          vietnamIndices: [],
          globalQuotes: [],
          cryptoAssets: [],
        }

        if (vietnamRes.ok) {
          const data = (await vietnamRes.json()) as { indices?: VietnamMarketIndex[] }
          bundle.vietnamIndices = data.indices ?? []
        }

        if (globalRes.ok) {
          const data = (await globalRes.json()) as { quotes?: GlobalQuote[] }
          bundle.globalQuotes = data.quotes ?? []
        }

        if (cryptoRes.ok) {
          const data = (await cryptoRes.json()) as { assets?: CryptoAsset[] }
          bundle.cryptoAssets = data.assets ?? []
        }

        if (!cancelled) {
          setQuotes(
            buildWatchlistQuoteMap(symbols, {
              vietnamIndices: bundle.vietnamIndices,
              globalQuotes: bundle.globalQuotes,
              cryptoAssets: bundle.cryptoAssets,
            }),
          )
        }
      } catch {
        if (!cancelled) setQuotes(buildWatchlistQuoteMap(symbols))
      }
    }

    loadQuotes()
    return () => {
      cancelled = true
    }
  }, [symbols])

  return (
    <section aria-labelledby="watchlist-title">
      <SectionHeading
        title={t("sec.watchlist")}
        badge={<Star className="size-3.5 text-warn" aria-hidden />}
      />

      <Card className="py-0">
        <CardContent className="px-0 pb-3">
          <p className="border-b border-border px-3 py-2 text-[11px] leading-snug text-muted-foreground">
            {t("watchlist.privacy")}
          </p>

          {symbols.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("watchlist.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {symbols.map((symbol) => (
                <WatchlistRow
                  key={symbol}
                  symbol={symbol}
                  quote={quotes.get(symbol) ?? getWatchlistQuote(symbol)}
                  onRemove={remove}
                />
              ))}
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
        </CardContent>
      </Card>
    </section>
  )
}

/** @deprecated Use Watchlist */
export const WatchlistPreview = Watchlist
