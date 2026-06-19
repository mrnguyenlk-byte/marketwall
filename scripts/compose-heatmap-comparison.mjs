import sharp from "sharp"

const fireant = "docs/fireant-vn-sector-reference.png"
const marketwall = "docs/marketwall-vn-sector-heatmap.png"
const out = "docs/heatmap-fireant-vs-marketwall.png"

const fMeta = await sharp(fireant).metadata()
const mMeta = await sharp(marketwall).metadata()
const targetH = 900
const fw = Math.round(fMeta.width * (targetH / fMeta.height))
const mw = Math.round(mMeta.width * (targetH / mMeta.height))
const left = await sharp(fireant).resize({ height: targetH }).toBuffer()
const right = await sharp(marketwall).resize({ height: targetH }).toBuffer()
const gap = 8
const labelH = 36
const totalW = fw + gap + mw
const totalH = targetH + labelH
const svg = `<svg width="${totalW}" height="${labelH}">
  <rect width="100%" height="100%" fill="#111"/>
  <text x="${Math.round(fw / 2)}" y="24" fill="#fff" font-family="Arial" font-size="16" text-anchor="middle">FireAnt reference</text>
  <text x="${fw + gap + Math.round(mw / 2)}" y="24" fill="#fff" font-family="Arial" font-size="16" text-anchor="middle">MarketWall (btrading.org)</text>
</svg>`

await sharp({
  create: {
    width: totalW,
    height: totalH,
    channels: 4,
    background: { r: 17, g: 17, b: 17, alpha: 1 },
  },
})
  .composite([
    { input: Buffer.from(svg), top: 0, left: 0 },
    { input: left, top: labelH, left: 0 },
    { input: right, top: labelH, left: fw + gap },
  ])
  .png()
  .toFile(out)

console.log(`Wrote ${out}`)
