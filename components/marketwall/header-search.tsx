"use client"

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { ChangePill, fmt } from "@/components/marketwall/shared"
import { useHeatmapDetail } from "@/lib/heatmap-detail-context"
import { useLang } from "@/lib/i18n"
import { buildVnSearchAssets, filterSymbolSearch } from "@/lib/market/symbol-search"
import { useHeatmapMarket } from "@/lib/swr/use-market-apis"
import type { MarketAsset } from "@/types/market"
import { cn } from "@/lib/utils"

const DEBOUNCE_MS = 200
const RESULT_LIMIT = 8

export function HeaderSearch() {
  const { t, lang } = useLang()
  const { openAsset } = useHeatmapDetail()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const vnHeatmap = useHeatmapMarket("vn")

  const assets = useMemo(
    () => buildVnSearchAssets(vnHeatmap.data?.items),
    [vnHeatmap.data?.items],
  )

  const results = useMemo(
    () => filterSymbolSearch(assets, debouncedQuery, lang, RESULT_LIMIT),
    [assets, debouncedQuery, lang],
  )

  const showDropdown = open && debouncedQuery.trim().length > 0

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [debouncedQuery, results.length])

  useEffect(() => {
    if (!showDropdown) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [showDropdown])

  const selectAsset = useCallback(
    (asset: MarketAsset) => {
      openAsset(asset)
      setQuery("")
      setDebouncedQuery("")
      setOpen(false)
    },
    [openAsset],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (event.key === "ArrowDown" && query.trim()) setOpen(true)
      return
    }

    if (event.key === "Escape") {
      setOpen(false)
      return
    }

    if (results.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % results.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const picked = results[activeIndex]
      if (picked) selectAsset(picked)
    }
  }

  return (
    <div ref={rootRef} className="relative hidden w-44 min-w-0 sm:block md:w-48 lg:w-56">
      <Search className="absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          showDropdown && results[activeIndex]
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        placeholder={t("action.searchFull")}
        aria-label={t("action.searchFull")}
        value={query}
        autoComplete="off"
        className="h-8 w-full rounded-md border-border bg-surface-muted pl-8 text-xs"
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t("action.searchFull")}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[60] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
        >
          {results.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((asset, index) => {
                const name = asset.name[lang].trim() || asset.name.en
                const active = index === activeIndex
                return (
                  <li key={asset.symbol} role="presentation">
                    <button
                      id={`${listboxId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs transition-colors",
                        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectAsset(asset)}
                    >
                      <span className="min-w-[2.75rem] shrink-0 font-bold tabular-nums">
                        {asset.symbol}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{name}</span>
                      <span className="shrink-0 font-mono tabular-nums">{fmt(asset.price)}</span>
                      <ChangePill value={asset.changePercent} className="shrink-0" />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">{t("search.noResults")}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
