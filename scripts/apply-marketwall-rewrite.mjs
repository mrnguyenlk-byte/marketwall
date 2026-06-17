#!/usr/bin/env node
/**
 * Marketwall rewrite apply stub — no external rewrite package in this repo.
 * Heatmap work lives on branch `heatmap-rewrite`; use build/lint to validate.
 */
import { spawnSync } from "node:child_process"

console.log(
  "[apply-marketwall-rewrite] No rewrite package bundled — running build only.",
)

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
})

process.exit(result.status ?? 1)
