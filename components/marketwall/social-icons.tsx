import { cn } from "@/lib/utils"

export function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

/** Zalo brand icon (speech bubble). */
export function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden>
      <path d="M12.49 2.08c-3.38 0-6.49 1.01-8.84 2.75-.36.27-.48.75-.28 1.16l2.21 4.9c.15.33.06.72-.22.94-1.1.84-1.8 2.1-1.8 3.51 0 2.49 2.57 4.51 5.74 4.51.67 0 1.31-.1 1.91-.28.39-.12.81.04 1.04.36l1.6 2.24c.28.39.86.42 1.18.07 2.47-2.27 4.02-5.52 4.02-9.13 0-6.89-5.35-12.51-11.94-12.51h-.04zm-.29 1.5h.04c5.82 0 10.56 4.96 10.56 11.01 0 3.12-1.37 5.92-3.56 7.82-.15.13-.38.04-.44-.14l-1.6-2.24a2.25 2.25 0 0 0-2.08-1.38c-.55.14-1.12.22-1.71.22-2.58 0-4.74-1.62-4.74-3.51 0-.98.55-1.86 1.42-2.53.65-.5.85-1.36.5-2.13l-2.01-4.45c-.12-.27 0-.58.27-.73 2.1-1.28 4.56-2.02 7.18-2.02z" />
    </svg>
  )
}
