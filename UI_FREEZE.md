# 🔒 UI FREEZE CHECKLIST (v1 Dashboard)

**Rule:** No visual/layout changes in these files unless it's a production bug or accessibility fix.

---

## 🚫 Files We STOP TOUCHING (Layout / Structure)

### 🎯 Core Dashboard UI (Frozen)

```
app/components/dashboard/FolderGroupedDashboard.tsx
app/components/dashboard/FolderSidebar.tsx
app/components/dashboard/FolderList.tsx
app/components/dashboard/ReportCard.tsx
app/dashboard/page.tsx
app/dashboard/layout.tsx
```

**Freeze includes:**
- JSX structure
- Button order
- Spacing / grid
- Icons & labels
- Folder sidebar width
- Card layout

**Only allowed changes here:**
- Conditional disabling (logic-only)
- Data wiring fixes
- Error handling
- Performance (memoization, keys)

### 🎨 Styling (Frozen)

```
app/components/dashboard/*.css
app/components/dashboard/*.module.css
global.css (dashboard-related classes only)
```

**No:**
- Color tweaks
- Padding adjustments
- Font changes
- Hover effects

This preserves user trust memory.

---

## ⚠️ Files Allowed to Change (Logic Only)

These are safe zones:

```
app/utils/fetchReportsByFolder.ts
app/lib/reports.ts
app/lib/folders.ts
app/lib/uploadRecording.ts
app/lib/plans/getUserPlan.ts
app/hooks/useUserPlan.ts
app/hooks/useRecordingLimit.ts
```

**You may:**
- Fix queries
- Add guards
- Improve error handling
- Enforce limits

**🚫 You may NOT:**
- Change returned data shape without updating UI
- Rename fields
- Remove fields used by UI

---

## 🧪 Test / Debug Files (Safe)

```
scripts/*
tests/*
__tests__/*
```

---

## 🧾 Rule of Engagement

> **If a change would alter what the screenshot looks like, it's forbidden.**
> **If it only affects behavior, it's allowed.**

---

## 🗂️ FOLDER EDGE CASES (Authoritative)

### 1️⃣ Deleting a Folder With Reports Inside

**Expected Behavior:**
- Folder is deleted
- Reports are NOT deleted
- Reports move to: **All Reports** (`folder_id = null`)

**Required SQL:**
```sql
UPDATE reports SET folder_id = null WHERE folder_id = :deletedFolderId;
DELETE FROM folders WHERE id = :deletedFolderId;
```

⚠️ **Never cascade delete reports.**

### 2️⃣ Deleting a Report From Inside a Folder

**Expected:**
- Report disappears from current folder AND All Reports
- File remains in storage until explicit cleanup policy

**UI Requirement:**
- Delete confirmation
- Optimistic UI update
- Rollback if delete fails

### 3️⃣ Moving a Report Between Folders

**Expected:**
- Immediate visual move
- No page refresh
- All Reports remains unchanged

**Failure Cases to Guard:**
- Folder deleted mid-move → fallback to All Reports
- Network error → revert card to original folder

### 4️⃣ Folder With Zero Reports

**Expected:**
- Folder still visible
- Empty state text: "No reports in this folder yet"

🚫 **Do NOT auto-delete empty folders.**

### 5️⃣ Duplicate Folder Names

**Policy:** Allow duplicates, scoped per user. Disambiguate via internal ID.

**Reason:** Users think in names, not IDs. Legal folders often reuse names ("Incident", "Evidence").

### 6️⃣ Deleting the Last Folder

**Expected:**
- Sidebar remains
- "All Reports" always exists
- No crashes, no redirect loops

### 7️⃣ Report Without PDF or Video

**Expected UI:**
- Missing link button is **disabled**
- Tooltip: "Not available"

🚫 **Never hide buttons completely** (Users think something is broken.)

### 8️⃣ Cross-Tab Sync

**Minimum acceptable behavior:**
- On action failure → show "Refresh" hint
- No websockets required yet

---

## 📅 Frozen Date

**UI Frozen:** January 5, 2026

**Next allowed UI changes:** v2 planning phase only.
