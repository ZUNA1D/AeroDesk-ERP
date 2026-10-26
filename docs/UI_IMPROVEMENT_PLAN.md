# AeroDesk ERP — UI/UX Improvement Plan

> **Audited**: September 2026  
> **Scope**: Full frontend codebase analysis (~15 pages, 8 UI components, 3 form components, 3 contexts, 14 API modules)  
> **Goal**: Transform AeroDesk from a functional ERP into a **polished, modern, production-grade** SaaS product.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Color Palette Consolidation](#2-color-palette-consolidation)
3. [Redundancy Audit & Removal](#3-redundancy-audit--removal)
4. [User Friendliness Improvements](#4-user-friendliness-improvements)
5. [Form UX Overhaul](#5-form-ux-overhaul)
6. [Mobile Responsiveness](#6-mobile-responsiveness)
7. [Additional Recommendations](#7-additional-recommendations)
8. [Implementation Priority & Phases](#8-implementation-priority--phases)

---

## 1. Executive Summary

### What's Already Good ✅
- **Clean design system foundation**: CSS variables for light/dark themes are well-organized in `index.css`
- **Component library exists**: `Button`, `Card`, `Modal`, `Badge`, `InputField`, `SelectField`, `StatCard`, `ConfirmDialog` are reusable
- **Sidebar/Header architecture**: Collapsible sidebar with mobile drawer is properly implemented
- **Tailwind + CSS variables hybrid**: Smart approach for themeable Tailwind
- **Dark mode works end-to-end**: Theme toggling is functional across all pages
- **Mobile sidebar drawer**: Already implemented with overlay and slide animation

### What Needs Work ❌
- **Color sprawl**: 10+ hardcoded color values scattered across pages outside the design system
- **Massive page files**: `ReportsPage.jsx` (890 lines), `SuppliersPage.jsx` (797 lines), `LedgerPage.jsx` (601 lines) — these are unmaintainable
- **Redundant route aliases**: `/welcome`, `/landing`, `/signup`, `/register` all point to the same pages
- **Redundant navigation**: `NavTabs.jsx` exists but is **never used** anywhere
- **Inline style soup**: Pages use `style={{ color: 'var(--text-secondary)' }}` hundreds of times instead of Tailwind utility classes
- **No toast/notification system**: Success/error states are manually coded in every page
- **No loading skeletons**: Loading states show plain text ("Loading ledger transactions...") instead of skeleton UI
- **`window.confirm()` usage**: SuppliersPage still uses browser `window.confirm()` instead of the existing `ConfirmDialog` component
- **Forms lack validation feedback**: No real-time inline validation, no progress indicators for multi-step forms
- **Tables are not responsive**: Complex 10-column tables break on mobile
- **No empty state illustrations**: Empty lists show plain text without visual context

---

## 2. Color Palette Consolidation

### Current Problem
The codebase uses **too many one-off color values**. While the CSS variable system in `index.css` is well-structured, individual pages bypass it with hardcoded values:

| Hardcoded Color | Used In | Should Be |
|---|---|---|
| `#eab308`, `#d97706` | `Sidebar.jsx`, `Header.jsx` | `var(--warning)` or new `--super-admin` token |
| `text-emerald-600`, `text-rose-600` | `InvoicePage`, `RegisterPage`, `PassengerRowsTable` | `var(--success)` / `var(--danger)` |
| `text-amber-500`, `text-amber-600` | `LoginPage`, `Sidebar`, `Header` | `var(--warning)` |
| `bg-brand-50`, `dark:bg-brand-950/60` | `PassengerRowsTable`, `LandingPage` | New `--brand-muted` CSS variable |
| `text-slate-400` | `RegisterPage` | `var(--text-tertiary)` |
| `bg-slate-100 dark:bg-slate-800` | `NavTabs.jsx` | `var(--sidebar-hover)` |
| `rgba(234, 179, 8, ...)` | `Header.jsx` | `var(--warning-muted)` |

### Proposed Unified Color Palette

**Keep the existing CSS variable system** but add a few missing tokens and enforce their usage:

```css
/* ─── Add to :root and .dark ─── */
:root {
  /* Super Admin accent (currently hardcoded amber everywhere) */
  --super-admin: #d97706;
  --super-admin-muted: rgba(217, 119, 6, 0.08);
  --super-admin-border: rgba(217, 119, 6, 0.25);

  /* Brand muted (for icon backgrounds, badges referencing brand) */
  --brand-muted: rgba(37, 99, 235, 0.06);

  /* Info variant (currently missing — purple is hardcoded) */
  --info: #8b5cf6;
  --info-muted: rgba(139, 92, 246, 0.08);
}

.dark {
  --super-admin: #fbbf24;
  --super-admin-muted: rgba(251, 191, 36, 0.12);
  --super-admin-border: rgba(251, 191, 36, 0.25);
  --brand-muted: rgba(96, 165, 250, 0.1);
  --info: #a78bfa;
  --info-muted: rgba(167, 139, 250, 0.12);
}
```

### Action Items

- [ ] Add the 6 missing CSS variable tokens above to `index.css`
- [ ] **Find & replace all hardcoded amber/emerald/rose/slate colors** across every page with CSS variables
- [ ] Replace `Badge` variant `purple` hardcoded RGBA with `var(--info)` / `var(--info-muted)`
- [ ] Remove all `text-emerald-600`, `text-rose-600`, `text-amber-*`, `text-slate-*` from JSX — use `style={{ color: 'var(--success)' }}` etc.
- [ ] Create Tailwind utility classes in `index.css` for the most common inline-style patterns to reduce `style={{}}` boilerplate

---

## 3. Redundancy Audit & Removal

### 3.1 Dead / Unused Component: `NavTabs.jsx`

**File**: `src/components/layout/NavTabs.jsx` (82 lines)

This component is **imported nowhere** in the codebase. The sidebar already handles all navigation. `NavTabs` is a leftover from a tabbed-navigation design that was replaced by the sidebar layout.

- [ ] **Delete** `NavTabs.jsx` entirely

### 3.2 Redundant Route Aliases in `router.jsx`

```
/welcome → LandingPage  (alias of /)
/landing → LandingPage  (alias of /)
/signup  → RegisterPage (alias of /register)
/register → RegisterPage
```

Four routes where two are sufficient. This creates confusion and dilutes SEO.

- [ ] Remove `/welcome` and `/landing` routes — keep only `/` as the landing
- [ ] Remove `/register` — keep only `/signup` (or vice versa, pick one and update all `<Link>` references)

### 3.3 Duplicate Branding Code (Sidebar Mobile + Desktop)

The Sidebar component renders the AeroDesk logo/branding block **twice** — once for mobile drawer (lines 174-202) and once for desktop (lines 218-244). These are nearly identical blocks.

- [ ] Extract a `<SidebarBranding collapsed={collapsed} />` sub-component
- [ ] Use it in both mobile and desktop sections

### 3.4 Duplicate Navigation Config (Sidebar + NavTabs)

Both `Sidebar.jsx` and `NavTabs.jsx` independently define the same nav item arrays with the same icons and labels. Even after deleting `NavTabs`, the nav config should be extracted to a single source:

- [ ] Create `src/config/navigation.js` exporting a `getNavGroups(user)` function
- [ ] Import from both sidebar (and any future nav component)

### 3.5 Repeated Inline Alert/Error/Success Banners

Every page (InvoicePage, SuppliersPage, LoginPage, RegisterPage, VisaPage) manually builds error and success banners with nearly identical markup:

```jsx
/* This pattern is copy-pasted across 6+ pages */
<div className="rounded-xl p-4 flex items-center gap-3 text-xs border" style={{
  backgroundColor: 'var(--danger-muted)',
  borderColor: 'rgba(239, 68, 68, 0.2)',
  color: 'var(--danger)',
}}>
  <AlertTriangle className="w-5 h-5" />
  <span>{errorMessage}</span>
</div>
```

- [ ] Create `<Alert variant="error|success|warning|info" message={msg} />` component
- [ ] Replace all inline banners across 6+ pages

### 3.6 Repeated Table Markup (Reports)

`ReportsPage.jsx` (890 lines!) contains 5 nearly identical table structures for Client Statement, Supplier Statement, Ticket Profit, Visa Profit, and Client Aging. The thead/tbody/row-hover pattern is copy-pasted.

- [ ] Create `<DataTable columns={[...]} rows={[...]} />` reusable component
- [ ] Create `<ReportFilterCard />` for the date-range + selector pattern
- [ ] Create `<SummaryGrid items={[...]} />` for the colored stat boxes grid
- [ ] This alone can reduce ReportsPage from **890 lines to ~300 lines**

### 3.7 Repeated `onMouseEnter/onMouseLeave` Hover Patterns

Multiple pages use manual `onMouseEnter`/`onMouseLeave` JavaScript handlers for hover effects, especially in SuppliersPage (lines 355-362, 376-383, 480-487, 500-507). This is anti-pattern — CSS handles hover natively.

- [ ] Replace all JS hover handlers with CSS `hover:` Tailwind classes or a `.hover-action-btn` CSS class
- [ ] At least 8 instances across SuppliersPage alone

### 3.8 `StatCard` Backward Compatibility Variants

`StatCard.jsx` still maps old variant names (`sky` → `blue`, `emerald` → `green`, `rose` → `red`). DashboardPage still uses the old names.

- [ ] Update DashboardPage to use new variant names (`blue`, `green`, `red`, `amber`)
- [ ] Remove the backward-compat mapping from StatCard

---

## 4. User Friendliness Improvements

### 4.1 Add a Global Toast/Notification System

Currently every page manages its own success/error state with useState. This means:
- Users can't see notifications from actions initiated on other pages
- Error messages disappear on navigation
- No consistent position/animation

**Recommendation**: Add a lightweight toast library or build one:
- [ ] Install `react-hot-toast` or `sonner` (both are ~3KB)
- [ ] Create a `<Toaster />` component mounted in `App.jsx`
- [ ] Replace all per-page `setErrorMessage` / `setSuccessTx` patterns with `toast.success()` / `toast.error()`

### 4.2 Add Skeleton Loading States

Replace all "Loading..." plain text with proper skeleton loaders:

```jsx
// Current (bad)
<div className="card p-12 text-center">Loading ledger transactions...</div>

// Proposed (good)
<div className="space-y-2">
  {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
</div>
```

The `.skeleton` CSS class already exists in `index.css` but is never used!

- [ ] Create `<TableSkeleton rows={5} cols={8} />` component
- [ ] Create `<CardSkeleton />` component
- [ ] Replace loading text in: DashboardPage, LedgerPage, SuppliersPage, ReportsPage, AgenciesPage

### 4.3 Add Empty State Illustrations

When tables or lists are empty, show a meaningful visual:

- [ ] Create `<EmptyState icon={...} title="..." description="..." action={<Button>} />` component
- [ ] Use in: Ledger (no transactions), Suppliers (no portals/agencies), Reports (no data), Receipts (no receipts)

### 4.4 Add Keyboard Shortcuts

For a desktop-heavy ERP, keyboard shortcuts dramatically improve productivity:

- [ ] `Ctrl+K` or `/` → Global search/command palette
- [ ] `N` on Invoice page → Focus first passenger name field
- [ ] `Esc` → Close modals (already implemented ✅)

### 4.5 Improve Select/Dropdown UX

The current `<select>` elements are native HTML selects — they work but are not searchable. For dropdowns with 100+ clients:

- [ ] Add a searchable combobox for Client selector (InvoicePage, VisaPage, ReceiptsPage, ReportsPage)
- [ ] Add a searchable combobox for Supplier selector
- [ ] Can build custom or use a lightweight library like `@headlessui/react` Combobox

### 4.6 Add Breadcrumbs

Users can lose context within nested sections:

- [ ] Add breadcrumbs below the header showing: `Dashboard > Issue Ticket Invoice`
- [ ] Can derive from `react-router-dom` location automatically

### 4.7 Replace `window.confirm()` with `ConfirmDialog`

`SuppliersPage.jsx` uses native `window.confirm()` in 2 places (lines 370, 494) for delete confirmation. The project already has a `ConfirmDialog` component.

- [ ] Replace both `window.confirm()` calls with `<ConfirmDialog>`

---

## 5. Form UX Overhaul

### 5.1 Password Input Component

The password field with show/hide toggle is **copy-pasted identically** across `LoginPage.jsx` and `RegisterPage.jsx` (twice on register — password + confirm). Create a reusable component:

- [ ] Create `<PasswordField label value onChange showToggle />` component
- [ ] Reuse in LoginPage and RegisterPage

### 5.2 Multi-Step Registration Form

`RegisterPage.jsx` (395 lines) crams two logical sections into one long form. Modern apps use stepped/wizard forms:

- [ ] Convert to a 2-step wizard:
  - **Step 1**: Agency workspace details (name, phone, address, currency)
  - **Step 2**: Administrator account (name, email, password)
- [ ] Add a progress indicator (`Step 1 of 2`)
- [ ] Add "Back" / "Next" navigation between steps
- [ ] Validate each step before allowing progression

### 5.3 Invoice Form — Inline Cost/Sell Feedback

The PassengerRowsTable calculates profit but the user only sees totals at the bottom. Improve with:

- [ ] Show per-row profit inline (already done on mobile cards but not desktop table ✅ — verify consistency)
- [ ] Color the profit cell: green for positive, red for negative
- [ ] Add a subtle "profitable" / "loss" indicator next to each row

### 5.4 Form Auto-Save / Draft Recovery

For complex forms like InvoicePage:

- [ ] Save form state to `localStorage` on change (debounced 1s)
- [ ] On page load, check for saved draft and offer "Resume Draft?" option
- [ ] Clear draft on successful submission

### 5.5 Better Date Picker UX

Multiple pages use native `<input type="date">` which is inconsistent across browsers:

- [ ] Add preset quick-select buttons: "Today", "This Week", "This Month", "This Quarter", "This Year"
- [ ] These can be simple buttons that programmatically set the date range state
- [ ] Add to: DashboardPage, LedgerPage, ReportsPage

### 5.6 Required Field Markers

Currently `*` is embedded in label text strings (e.g., `"Invoice Date *"`). This should be standardized:

- [ ] Update `InputField` and `SelectField` to accept a `required` prop and auto-render a red asterisk
- [ ] Remove manual `*` from all label strings
- [ ] Style the asterisk: `<span className="text-red-500 ml-0.5">*</span>`

### 5.7 Client Quick-Add Improvements

The "Quick Add" inline modal for adding a new client (in `QuickAddInline.jsx`) is good, but:

- [ ] After adding, auto-select the newly created client in the dropdown
- [ ] Show a brief success toast
- [ ] Add an "Add Another" option without closing the modal

---

## 6. Mobile Responsiveness

### 6.1 Current State Assessment

| Component | Mobile Status | Issues |
|---|---|---|
| **Sidebar** | ✅ Good | Drawer pattern works well |
| **Header** | ✅ Good | Responsive hide/show for labels |
| **Landing Page** | ✅ Good | Stacks properly, responsive text sizing |
| **Login/Register** | ✅ Good | Centered card, appropriate widths |
| **Dashboard** | ⚠️ Acceptable | Grid stacks, but date inputs are cramped |
| **Invoice Form** | ⚠️ Acceptable | Mobile card view exists for passengers |
| **Ledger Table** | ❌ Broken | 10-column table overflows, requires horizontal scroll |
| **Reports Tables** | ❌ Broken | Same problem, even more columns |
| **Suppliers Page** | ⚠️ Acceptable | Cards stack, but action buttons are small |

### 6.2 Table Responsiveness Strategy

Tables are the biggest mobile challenge. Recommended approach:

**Option A (Recommended): Card-Based Mobile View**  
Switch tables to card-based layouts on mobile, similar to what `PassengerRowsTable` already does:

```jsx
{/* Desktop: Table */}
<div className="hidden md:block">
  <table>...</table>
</div>

{/* Mobile: Cards */}
<div className="block md:hidden space-y-3">
  {rows.map(row => <MobileRowCard key={row.id} data={row} />)}
</div>
```

- [ ] Implement for Ledger table
- [ ] Implement for all 5 Reports tables
- [ ] Implement for Audit Log table

**Option B: Priority Column Hiding**  
Hide less important columns on smaller screens:

```jsx
<th className="hidden lg:table-cell">Net Profit</th>
```

- [ ] This is a quick win that can be done immediately alongside Option A

### 6.3 Mobile Touch Targets

Several interactive elements are too small for mobile (< 44px):

- [ ] Increase all icon-only action buttons to minimum `w-10 h-10` (40px) on mobile
- [ ] Add `min-h-[44px]` to all tap targets (buttons, links, selectable areas)
- [ ] The expand/collapse chevrons in Ledger rows are only `p-1 rounded` — too small

### 6.4 Mobile Filter Bar Improvements

The Ledger filter bar has 7+ filter fields that stack vertically on mobile, pushing the actual data far below the fold:

- [ ] Collapse filters behind a "Filters" toggle button on mobile
- [ ] Show only the search input by default
- [ ] Add filter count badge: "Filters (3)"

### 6.5 Bottom Navigation Bar for Mobile

For frequently accessed sections on mobile, consider a bottom tab bar:

- [ ] Dashboard, Invoice, Visa, Receipts, Ledger
- [ ] Sticky at the bottom of viewport on `< md` screens
- [ ] This replaces the hamburger → sidebar flow for the most common actions

### 6.6 Mobile-Specific Meta Tags

- [ ] Add `<meta name="theme-color" content="#2563eb">` in `index.html` (changes browser chrome color)
- [ ] Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- [ ] Set appropriate favicon for PWA manifest (if applicable)

---

## 7. Additional Recommendations

### 7.1 Reduce Inline Style Usage (High Priority)

The codebase uses `style={{ color: 'var(--text-secondary)' }}` on **hundreds of elements** when Tailwind utility classes via the `@layer components` system would be cleaner and more maintainable.

**Current Pattern** (repeated 200+ times):
```jsx
<span style={{ color: 'var(--text-tertiary)' }}>Some label</span>
```

**Better Pattern**:
```css
/* In index.css @layer components */
.text-theme-primary { color: var(--text-primary); }
.text-theme-secondary { color: var(--text-secondary); }
.text-theme-tertiary { color: var(--text-tertiary); }
.text-theme-accent { color: var(--accent); }
.text-theme-success { color: var(--success); }
.text-theme-danger { color: var(--danger); }
.text-theme-warning { color: var(--warning); }
.bg-theme-surface { background-color: var(--surface); }
.bg-theme-surface-secondary { background-color: var(--surface-secondary); }
.border-theme { border-color: var(--border); }
```

Then:
```jsx
<span className="text-theme-tertiary">Some label</span>
```

- [ ] Add ~15 theme utility classes to `index.css`
- [ ] Progressively replace inline styles (can be done page-by-page)

### 7.2 Page Component Decomposition (High Priority)

Several pages are far too large and should be decomposed:

| Page | Lines | Recommended Split |
|---|---|---|
| `ReportsPage.jsx` | **890** | Extract 5 sub-views into separate components: `ClientStatementReport.jsx`, `SupplierStatementReport.jsx`, `TicketProfitReport.jsx`, `VisaProfitReport.jsx`, `ClientAgingReport.jsx` |
| `SuppliersPage.jsx` | **797** | Extract: `PortalsList.jsx`, `AgenciesList.jsx`, `SupplierFormModal.jsx`, `DepositModal.jsx`, `PaymentModal.jsx` |
| `LedgerPage.jsx` | **601** | Extract: `LedgerFilters.jsx`, `LedgerTable.jsx`, `VoidModal.jsx` |
| `PassengerRowsTable.jsx` | **493** | Extract: `MobilePassengerCard.jsx`, `DesktopPassengerRow.jsx` |

### 7.3 Add Page Transition Animations

The `animate-fade-in` class is used on page wrappers, which is good. Enhance with:

- [ ] Stagger child animations for dashboard cards (card 1 appears, then card 2, etc.)
- [ ] Add `animate-slide-in-up` for modal content
- [ ] Add number counting animation for StatCard values (count up from 0)

### 7.4 Accessibility Improvements

- [ ] Add `aria-label` to all icon-only buttons (theme toggle, logout, sidebar collapse)
- [ ] Add `role="alert"` to error/success banners
- [ ] Ensure focus trapping in Modal component (currently it just traps scrolling)
- [ ] Add `aria-expanded` to sidebar collapse button
- [ ] Add `aria-current="page"` to active nav links

### 7.5 Performance Optimizations

- [ ] Add `React.lazy()` + `Suspense` for page-level code splitting — most pages are never visited in a single session
- [ ] The Reports page loads 5 queries even though only 1 tab is visible — queries are already gated with `enabled`, which is good ✅
- [ ] Add `useMemo` for expensive computations (passenger totals, filtered lists)

### 7.6 SEO & Meta Improvements

- [ ] Add `react-helmet-async` or use `document.title` updates per page
- [ ] Each page should set its own `<title>`: "Issue Ticket | AeroDesk ERP"
- [ ] Add OpenGraph meta tags for the landing page
- [ ] Add structured data (JSON-LD) for the SaaS landing page

### 7.7 Error Boundary

- [ ] Add a global `ErrorBoundary` component wrapping `<RouterProvider>`
- [ ] Show a friendly "Something went wrong" UI with a "Reload" button
- [ ] Currently, any unhandled error will crash to a white screen

### 7.8 Centralized API Error Handling

The Axios client in `client.js` should have a global error interceptor:

- [ ] 401 responses → auto-redirect to `/login`
- [ ] 500 responses → show a global toast with "Server error, please try again"
- [ ] Network errors → show "You appear to be offline"

---

## 8. Implementation Priority & Phases

### Phase 1: Quick Wins (1–2 days)
These changes have maximum impact with minimum effort:

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | Delete unused `NavTabs.jsx` | Clean code | 5 min |
| 2 | Remove redundant route aliases | Clean URLs | 15 min |
| 3 | Add theme utility classes to `index.css` | Foundation | 30 min |
| 4 | Add missing CSS variable tokens (super-admin, brand-muted, info) | Foundation | 15 min |
| 5 | Replace `window.confirm()` with `ConfirmDialog` in SuppliersPage | UX consistency | 20 min |
| 6 | Update StatCard variant names in DashboardPage | Clean code | 10 min |
| 7 | Add `<meta name="theme-color">` to `index.html` | Mobile polish | 5 min |

### Phase 2: Component Extraction (3–5 days)
Build reusable components to reduce duplication:

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | Create `<Alert>` component, replace 6+ inline banners | DRY code | 2 hr |
| 2 | Create `<PasswordField>` component | DRY code | 1 hr |
| 3 | Create `<DataTable>` reusable component | Foundation | 4 hr |
| 4 | Create `<EmptyState>` component | UX polish | 1 hr |
| 5 | Create `<TableSkeleton>` and `<CardSkeleton>` | UX polish | 1 hr |
| 6 | Create `<SidebarBranding>` sub-component | DRY code | 30 min |
| 7 | Extract navigation config to `src/config/navigation.js` | Maintainability | 30 min |
| 8 | Create `<ReportFilterCard>` and `<SummaryGrid>` | DRY code | 2 hr |

### Phase 3: Page Decomposition (3–5 days)
Break apart large pages using the new components:

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | Decompose `ReportsPage.jsx` → 5 sub-views | Maintainability | 4 hr |
| 2 | Decompose `SuppliersPage.jsx` → 5 sub-components | Maintainability | 3 hr |
| 3 | Decompose `LedgerPage.jsx` → 3 sub-components | Maintainability | 2 hr |
| 4 | Convert `RegisterPage` to multi-step wizard | UX improvement | 3 hr |

### Phase 4: Mobile & Polish (3–5 days)
Make the app truly mobile-ready:

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | Create mobile card views for Ledger and Report tables | Mobile UX | 6 hr |
| 2 | Add collapsible filter bar for mobile | Mobile UX | 2 hr |
| 3 | Add toast notification system (sonner/react-hot-toast) | Global UX | 2 hr |
| 4 | Add searchable combobox for Client/Supplier selectors | Form UX | 4 hr |
| 5 | Add date preset buttons (Today, This Month, etc.) | Form UX | 1 hr |
| 6 | Increase mobile touch targets | Accessibility | 1 hr |
| 7 | Add keyboard shortcuts (Ctrl+K command palette) | Power users | 4 hr |

### Phase 5: Architecture & Performance (2–3 days)
Long-term health improvements:

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | Add `React.lazy()` code splitting for all pages | Performance | 2 hr |
| 2 | Add `ErrorBoundary` component | Reliability | 1 hr |
| 3 | Add global Axios error interceptor | UX consistency | 1 hr |
| 4 | Progressive inline style → utility class migration | Maintainability | Ongoing |
| 5 | Add accessibility attributes (aria-labels, focus trapping) | Accessibility | 3 hr |
| 6 | Add page-level document titles | SEO | 1 hr |

---

## Summary

The AeroDesk ERP frontend has a **solid architectural foundation** — proper React patterns, good component separation, working theme system, and functional mobile sidebar. The main issues are:

1. **Code duplication** — inline styles, repeated patterns, and oversized page components
2. **Color inconsistency** — hardcoded values bypassing the design system
3. **Missing polish** — no toasts, no skeletons, no empty states, no search in dropdowns
4. **Mobile tables** — critical gap for field agents using the app on phones

Following this plan from Phase 1 to Phase 5 will transform the app from a functional prototype into a **production-grade, modern SaaS product** without requiring any backend changes.

---

*Document prepared by automated codebase analysis. All file references are relative to `frontend/src/`.*
