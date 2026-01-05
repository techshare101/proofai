# Agent Rules — ProofAI

## 🚨 READ THIS FIRST

This document defines production-locked files that **MUST NOT** be modified by any AI agent without explicit human approval.

---

## 🚫 DO NOT MODIFY (CANONICAL FILES)

These files are production-stable. Any modification will break critical flows.

### Core Recording Pipeline
- `app/components/Recorder.tsx` — Single recorder UI (state machine)
- `app/lib/uploadRecording.ts` — Upload + transcription + PDF generation
- `app/hooks/useRecorder.ts` — Recording state management

### PDF Generation
- `app/services/clientPdfService.ts` — PDF generation service
- `app/services/pdfService.ts` — Server-side PDF service
- `app/utils/generatePDF.ts` — PDF utilities

### Location Pipeline
- `app/api/geocode/route.ts` — Server-side geocoding (OpenCage)
- `app/utils/geocodeAddress.ts` — Address formatting

### Plan & Limit Logic
- `app/lib/plans/getUserPlan.ts` — Plan detection from Stripe
- `app/lib/plans/checkRecordingLimit.ts` — Recording limit enforcement
- `app/hooks/useUserPlan.ts` — Client-side plan hook
- `app/hooks/useRecordingLimit.ts` — Client-side limit hook

### Authentication
- `app/contexts/AuthContext.tsx` — Auth state management
- `middleware.ts` — Route protection

---

## ✅ ALLOWED ACTIONS

- **New files** — Create new components, pages, utilities
- **Bug fixes** — ONLY when explicitly requested by user
- **Tests** — Add test files
- **Comments** — Add documentation
- **Styling** — CSS/Tailwind changes to non-canonical files
- **Dashboard UI** — Modify dashboard components (except canonical ones)
- **New features** — Add new pages and functionality

---

## ⚠️ IF UNSURE: STOP

If a task requires modifying a canonical file:

1. **STOP** — Do not proceed
2. **ASK** — Request explicit human approval
3. **PROPOSE** — Suggest a wrapper or new file instead

---

## 🔒 WHY THESE FILES ARE LOCKED

| File | Reason |
|------|--------|
| `Recorder.tsx` | State machine UI — any change causes UI regression |
| `uploadRecording.ts` | Complex pipeline — transcription, PDF, storage |
| `getUserPlan.ts` | Stripe integration — affects billing |
| `geocode/route.ts` | API key security — server-side only |
| `clientPdfService.ts` | PDF layout — legal document format |

---

## 📋 CANONICAL FILE HEADER

All locked files contain this header:

```typescript
/**
 * 🚨 CANONICAL FILE — DO NOT MODIFY 🚨
 *
 * This file is production-locked.
 * Any changes will cause regressions.
 *
 * Allowed actions:
 *  - Read only
 *  - Import only
 *
 * DO NOT:
 *  - Refactor
 *  - Reformat
 *  - Rename
 *  - "Improve"
 *
 * Changes require explicit human approval.
 */
```

---

## 🛡️ ENFORCEMENT

1. **Header comments** — All canonical files have the header above
2. **This document** — Agents should read this file
3. **Git discipline** — Changes to canonical files require review
4. **Pre-commit hooks** — (Optional) Block changes to locked files

---

## 📅 Last Updated

2026-01-05 — Initial lock after v1.0 stabilization
