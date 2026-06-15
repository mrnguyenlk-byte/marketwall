import Image from "next/image"
import Link from "next/link"
import { SITE_LOGO, SITE_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"

const LOGO_ASPECT = 1024 / 682

type BrandLogoProps = {
  href?: string
  height?: number
  className?: string
  priority?: boolean
}

export function BrandLogo({
  href = "/",
  height = 48,
  className,
  priority = false,
}: BrandLogoProps) {
  const width = Math.round(height * LOGO_ASPECT)

  const image = (
    <Image
      src={SITE_LOGO}
      alt={SITE_NAME}
      width={width}
      height={height}
      className={cn("bg-transparent object-contain", className)}
      style={{ height, width }}
      priority={priority}
    />
  )

  if (!href) return image

  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label={SITE_NAME}>
      {image}
    </Link>
  )
}
