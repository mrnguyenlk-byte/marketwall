# Sprint 21 — Data Accuracy Audit Deploy

**Date:** 2026-06-16  
**Scope:** Cross-provider Vietnam quote audit + Sprints 19–20 ship  
**Build:** `npm run build` ✅  
**Production:** https://btrading.org

## Summary

- **Sprint 19:** Currency strength footer, foreign flow today-only, production readiness doc
- **Sprint 20:** 75/25 trader layout, sector treemap heatmap, compact F&G sidebar
- **Sprint 21:** `DATA_ACCURACY_AUDIT.md` — MW vs VPS/SSI/FireAnt on 8 symbols

## Key audit finding (no code fix in this deploy)

Trading value display uses `price × lot` without ×10 share multiplier — documented P0 fix for follow-up.

## Verification

- [x] Local build passed
- [ ] Pushed to `main`
- [ ] Vercel production Ready
- [ ] Production APIs live
