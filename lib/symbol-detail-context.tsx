"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { features } from "@/lib/config/features"
import { resolveSymbolDetail, type SymbolDetailRecord } from "@/lib/symbol-detail"

type SymbolDetailContextValue = {
  openSymbol: string | null
  record: SymbolDetailRecord | null
  openDetail: (symbol: string) => void
  closeDetail: () => void
}

const NOOP_CONTEXT: SymbolDetailContextValue = {
  openSymbol: null,
  record: null,
  openDetail: () => {},
  closeDetail: () => {},
}

const SymbolDetailContext = createContext<SymbolDetailContextValue | null>(null)

function SymbolDetailProviderEnabled({ children }: { children: ReactNode }) {
  const [openSymbol, setOpenSymbol] = useState<string | null>(null)

  const record = useMemo(
    () => (openSymbol ? resolveSymbolDetail(openSymbol) : null),
    [openSymbol],
  )

  const openDetail = useCallback((symbol: string) => {
    if (resolveSymbolDetail(symbol)) setOpenSymbol(symbol)
  }, [])

  const closeDetail = useCallback(() => setOpenSymbol(null), [])

  const value = useMemo(
    () => ({ openSymbol, record, openDetail, closeDetail }),
    [openSymbol, record, openDetail, closeDetail],
  )

  return (
    <SymbolDetailContext.Provider value={value}>
      {children}
    </SymbolDetailContext.Provider>
  )
}

export function SymbolDetailProvider({ children }: { children: ReactNode }) {
  if (!features.symbolModal) {
    return (
      <SymbolDetailContext.Provider value={NOOP_CONTEXT}>
        {children}
      </SymbolDetailContext.Provider>
    )
  }

  return <SymbolDetailProviderEnabled>{children}</SymbolDetailProviderEnabled>
}

export function useSymbolDetail() {
  const ctx = useContext(SymbolDetailContext)
  if (!ctx) {
    throw new Error("useSymbolDetail must be used within SymbolDetailProvider")
  }
  return ctx
}
