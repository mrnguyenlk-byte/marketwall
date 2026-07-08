"use client"

import { useSyncExternalStore } from "react"

const LG_QUERY = "(min-width: 1024px)"

function subscribeLg(onStoreChange: () => void) {
  const mq = window.matchMedia(LG_QUERY)
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

function getLgSnapshot() {
  return window.matchMedia(LG_QUERY).matches
}

function getServerLgSnapshot() {
  // SSR defaults to mobile layout — desktop tree never mounts until ≥1024 confirmed.
  return false
}

/** True when viewport is ≥1024px (desktop / large tablet). */
export function useIsDesktopLg(): boolean {
  return useSyncExternalStore(subscribeLg, getLgSnapshot, getServerLgSnapshot)
}
