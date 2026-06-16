# Sprint 26 — Default Language = Vietnamese

**Date:** 2026-06-16  
**Scope:** Default MarketWall UI language to Vietnamese; persist user choice in `localStorage`  
**Build:** `npm run build` ✅

---

## Previous behavior

| Area | Before |
|------|--------|
| `LanguageProvider` initial state | `useState<Lang>("en")` — **always English** |
| `localStorage` | **Not used** — language switch did not persist |
| `<html lang>` | `"en"` |
| First visit (incognito) | English UI |
| Return visit after switching | Reset to English |

---

## New behavior

| Area | After |
|------|--------|
| Default locale | **`vi`** (Vietnamese) |
| Priority | 1) `localStorage.language` → 2) `"vi"` → never default to `"en"` |
| Persistence | `setLang()` writes `localStorage.setItem("language", …)` |
| `<html lang>` | `"vi"` SSR default; blocking script sets `en` only if stored |
| First visit | Vietnamese UI immediately |
| User switches to English | Saved as `localStorage.language = "en"` |
| Return visit | Respects saved `en` or `vi` |

### Selection logic

```text
if localStorage.language === "en" or "vi":
  use localStorage.language
else:
  use "vi"
```

---

## Files changed

| File | Change |
|------|--------|
| `lib/i18n.tsx` | `defaultLocale = "vi"`, `LANG_STORAGE_KEY = "language"`, read/persist helpers, `useEffect` hydration from storage |
| `app/layout.tsx` | `<html lang="vi">`, `langInitScript` before theme script |

**Not changed:** routing, APIs, heatmap, auth, database.

---

## Constants

| Name | Value |
|------|-------|
| `defaultLocale` | `"vi"` |
| `LANG_STORAGE_KEY` | `"language"` |
| English fallback | Only when user explicitly selects English or `localStorage.language === "en"` |

---

## UI verification (first visit / incognito)

Expected Vietnamese labels:

| Section | Vietnamese |
|---------|------------|
| Homepage nav | Tổng quan, Thị trường, Bản đồ nhiệt… |
| Heatmap tabs | Thị trường Mỹ / Việt Nam / Crypto |
| Vietnam Dashboard | Bảng giá thị trường Việt Nam |
| Fear & Greed | Chỉ số Sợ hãi & Tham lam |
| Breaking News | Tin nóng |
| Calendar | Lịch kinh tế toàn cầu |
| Watchlist | Danh mục theo dõi |

---

## Incognito verification

1. Open Incognito / private window  
2. Navigate to https://btrading.org  
3. **Expected:** Vietnamese UI on first paint (no prior `localStorage`)  
4. Switch language to English → reload → English persists  
5. Clear site data → reload → Vietnamese again  

**Note:** Returning English users may see one brief Vietnamese paint before React applies stored preference (SSR default is `vi`). `<html lang>` is corrected immediately by `langInitScript`.

---

## Build result

```
prisma generate && npm run build — passed ✅
```

---

## Manual test checklist

- [ ] Incognito → https://btrading.org → Vietnamese
- [ ] Switch to EN → reload → English
- [ ] Switch to VI → reload → Vietnamese
- [ ] `localStorage.language` in DevTools matches selection
