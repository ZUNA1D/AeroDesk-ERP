# AeroDesk-ERP: Minimalist UI Redesign Specification & Agent Execution Guide

> **Target Agent:** Antigravity (Autonomous Coding Agent)  
> **Project:** AeroDesk-ERP (`https://github.com/ZUNA1D/AeroDesk-ERP`)  
> **Objective:** Complete UI/UX overhaul of the AeroDesk-ERP frontend into an ultra-clean, high-density, minimalist enterprise interface inspired by **Linear**, **Vercel**, **Stripe Dashboard**, and **modern glass-cockpit avionics**—while **100% preserving** all existing backend logic, API integrations, state management, routing, and data models.

---

## 0. CRITICAL GUARDRAILS FOR ANTIGRAVITY (READ FIRST)

Before modifying any file, you **MUST** adhere to the following non-negotiable rules:

1. **Zero Logic Regression:** Do **NOT** delete, rename, or break existing API endpoints, database queries, form submission handlers, authentication flows, state variables, or business logic calculations.
2. **Audit Before Edit:** Start by scanning the repository directory structure (`package.json`, routing files, layout components, global CSS/Tailwind config, and page views) to map out how styles and components are currently structured.
3. **Incremental Refactoring:** Execute the redesign in phases (Design Tokens $\rightarrow$ Layout Shell $\rightarrow$ Shared UI Primitives $\rightarrow$ Module Views) and verify that the project compiles cleanly after each phase.
4. **Eliminate Visual Clutter:** Strip out heavy drop shadows, gratuitous gradients, thick colored borders, oversized rounded corners, inconsistent spacing, and decorative animations. Replace them with sharp `1px` borders, subtle surface contrast, typographic hierarchy, and purposeful whitespace.

---

## 1. DESIGN PHILOSOPHY: "SWISS-PRECISION AVIATION MINIMALISM"

Aviation ERP users (dispatchers, MRO engineers, fleet managers, crew schedulers, and finance ops) process dense, mission-critical data where visual fatigue causes operational errors.

### Core Principles
* **High Signal-to-Noise Ratio:** Every pixel must serve data legibility. If an element is decorative rather than informational, remove it.
* **Flat & Crisp Depth:** Avoid heavy `box-shadow` elevations. Define hierarchy using subtle background surface shifts and `1px solid` hairline borders.
* **Monochrome Foundation + Semantic Color Only:** 95% of the UI should be neutral grayscale/zinc/slate. Color is reserved **exclusively** for operational status (`Airworthy`, `AOG / Grounded`, `Delayed / MEL`, `In-Flight`) and primary interactive actions.
* **Tabular Precision:** Aviation data relies on codes, timestamps, tail numbers, flight hours, and cycles. Numbers and codes must align vertically in tables and cards using monospace fonts and `font-variant-numeric: tabular-nums`.

---

## 2. DESIGN TOKENS & COLOR SYSTEM

Implement these tokens globally via CSS variables (`:root` and `.dark`) and map them into the project's styling system (e.g., Tailwind CSS config or global stylesheet).

### 2.1 Light Mode (Default Day Operations)
```css
:root {
  /* Backgrounds & Surfaces */
  --bg-canvas: #FAFAFA;          /* Main app background (Zinc 50) */
  --bg-surface: #FFFFFF;         /* Cards, tables, primary containers */
  --bg-subtle: #F4F4F5;          /* Table headers, secondary panels, hover states (Zinc 100) */
  --bg-muted: #E4E4E7;           /* Active toggles, skeleton loaders (Zinc 200) */

  /* Borders & Dividers */
  --border-subtle: #E4E4E7;      /* Default 1px card & table borders (Zinc 200) */
  --border-strong: #D4D4D8;      /* Input borders, focused container borders (Zinc 300) */

  /* Typography */
  --text-primary: #09090B;       /* Headings, primary data values (Zinc 950) */
  --text-secondary: #52525B;     /* Body copy, table cells, labels (Zinc 600) */
  --text-muted: #71717A;         /* Metadata, captions, placeholders (Zinc 500) */

  /* Brand & Primary Action (Deep Aviation Slate/Indigo) */
  --accent-primary: #18181B;     /* Primary CTA buttons (Zinc 900) */
  --accent-primary-hover: #27272A;
  --accent-brand: #2563EB;       /* Interactive links, active indicators, telemetry accent */
  --accent-brand-subtle: #EFF6FF;

  /* Aviation Semantic Status Tokens */
  --status-airworthy-bg: #ECFDF5;
  --status-airworthy-text: #065F46;
  --status-airworthy-border: #A7F3D0;
  --status-airworthy-dot: #10B981;   /* Airworthy / On-Time / Completed / In-Stock */

  --status-mel-bg: #FFFBEB;
  --status-mel-text: #92400E;
  --status-mel-border: #FDE68A;
  --status-mel-dot: #F59E0B;         /* MEL Deferred / Maintenance Due / Delayed / Low Stock */

  --status-aog-bg: #FEF2F2;
  --status-aog-text: #991B1B;
  --status-aog-border: #FECACA;
  --status-aog-dot: #EF4444;         /* AOG (Aircraft on Ground) / Critical / Overdue / Cancelled */

  --status-inflight-bg: #F0F9FF;
  --status-inflight-text: #075985;
  --status-inflight-border: #BAE6FD;
  --status-inflight-dot: #0EA5E9;    /* In-Flight / Dispatched / Active Work Order */

  /* Radii & Shadows */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  --shadow-float: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
}
```

### 2.2 Dark Mode (Optional / Night OCC & Cockpit Mode)
```css
.dark {
  --bg-canvas: #09090B;          /* Zinc 950 */
  --bg-surface: #121215;         /* Custom deep surface */
  --bg-subtle: #18181B;          /* Zinc 900 */
  --bg-muted: #27272A;           /* Zinc 800 */

  --border-subtle: #27272A;      /* Zinc 800 */
  --border-strong: #3F3F46;      /* Zinc 700 */

  --text-primary: #FAFAFA;       /* Zinc 50 */
  --text-secondary: #A1A1AA;     /* Zinc 400 */
  --text-muted: #71717A;         /* Zinc 500 */

  --accent-primary: #FAFAFA;     /* High-contrast light button on dark surface */
  --accent-primary-hover: #E4E4E7;
  --accent-brand: #3B82F6;
  --accent-brand-subtle: rgba(59, 130, 246, 0.12);
}
```

---

## 3. TYPOGRAPHY & DATA FORMATTING

### 3.1 Font Stack
Import from Google Fonts (`Inter` and `JetBrains Mono`) if not already present:
* **Sans-Serif (UI & Copy):** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
* **Monospace (Aviation Telemetry & Codes):** `'JetBrains Mono', 'Fira Code', monospace`

### 3.2 Typographic Scale & Rules
| Element | Size | Weight | Tracking / Line Height | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title (`h1`)** | `20px` (`1.25rem`) | `600` (SemiBold) | `-0.02em` / `1.3` | No giant hero headers; keep titles compact |
| **Section Header (`h2`)** | `15px` (`0.9375rem`) | `600` (SemiBold) | `-0.01em` / `1.4` | Used for card headers & panel titles |
| **Table Header / Label** | `11px` (`0.6875rem`) | `600` (SemiBold) | `+0.05em` / `1.2` | `UPPERCASE`, `color: var(--text-muted)` |
| **Body / Table Cell** | `13px` (`0.8125rem`) | `400` or `500` | `0em` / `1.5` | Crisp 13px font allows high-density ERP tables |
| **KPI Metric Value** | `24px` (`1.5rem`) | `600` (SemiBold) | `-0.03em` / `1.2` | Must use `tabular-nums` |
| **Caption / Micro** | `12px` (`0.75rem`) | `400` (Regular) | `0em` / `1.4` | Secondary hints, timestamps |

### 3.3 Mandatory Monospace Usage
Apply `font-mono tabular-nums text-xs` to **all** of the following data points across the entire application:
* Aircraft Tail / Registration Numbers (e.g., `N842AD`, `S2-AJA`)
* Flight Numbers & Routes (e.g., `AD-402`, `DAC → DXB`)
* Airframe Hours & Cycles (e.g., `14,280.5 FH`, `6,120 FC`)
* Part Numbers, Serial Numbers & Work Order IDs (e.g., `PN-8841-02`, `WO-2026-089`)
* UTC / Zulu Timestamps (e.g., `14:30 UTC`)
* Financial figures, invoices, and fuel quantities

---

## 4. APPLICATION SHELL & LAYOUT ARCHITECTURE

Replace any bulky navigation bars, multi-colored sidebars, or cluttered headers with a unified **3-Zone App Shell**:

```
+-----------------------------------------------------------------------+
| [AeroDesk]  | Breadcrumb / Page Title      [Search Cmd+K] [18:45 UTC] | <- 52px Topbar
+-------------+---------------------------------------------------------+
|             |                                                         |
|  OVERVIEW   |  Page Header + Primary Action CTA                       |
|  - Dashboard|  -----------------------------------------------------  |
|             |  [KPI Card]   [KPI Card]   [KPI Card]   [KPI Card]      |
|  OPERATIONS |                                                         |
|  - Fleet    |  +---------------------------------------------------+  |
|  - Flights  |  | Filter Bar: [Search...] [Status v] [Aircraft v]   |  |
|  - Crew     |  +---------------------------------------------------+  |
|             |  | TAIL #  | TYPE    | STATUS     | HOURS   | ACTION |  |
|  TECHNICAL  |  |---------|---------|------------|---------|--------|  |
|  - MRO / WO |  | N842AD  | B737-8  | ● Airworthy| 12,410  |  ...   |  |
|  - Parts    |  | N109AD  | A320neo | ● AOG      |  8,120  |  ...   |  |
|             |  +---------------------------------------------------+  |
|  FINANCE    |                                                         |
|  - Billing  |                                                         |
|             |                                                         |
| [User/Role] |                                                         |
+-------------+---------------------------------------------------------+
  220px Fixed                   Fluid Main Workspace
   Sidebar                     (24px padding, max-w-1600px)
```

### 4.1 Left Navigation Sidebar (`220px` width, collapsible to `60px`)
* **Background:** `var(--bg-canvas)` (blends seamlessly with the app canvas, separated only by a `1px solid var(--border-subtle)` right border).
* **Brand Header (`52px` height):** Minimal geometric aircraft/wing icon + `AeroDesk` in `14px` semi-bold tracking-tight text, plus a small muted badge `ERP`.
* **Navigation Groups:** Grouped logically with `10px` uppercase muted section headers (`OPERATIONS`, `TECHNICAL / MRO`, `SUPPLY CHAIN`, `ADMINISTRATION`).
* **Nav Items:**
  * Height: `32px`, padding `0 10px`, border-radius `6px`, font-size `13px`, gap `10px`.
  * Icons: `16px x 16px` stroke icons (`stroke-width: 1.75`, e.g., Lucide Icons).
  * **Inactive State:** `color: var(--text-secondary)`, transparent background.
  * **Hover State:** `background: var(--bg-subtle)`, `color: var(--text-primary)`.
  * **Active State:** `background: var(--bg-muted)` (or `#FFFFFF` with `1px solid var(--border-subtle)` and `--shadow-subtle`), `color: var(--text-primary)`, `font-weight: 500`. No thick colored bars on the side.
* **Footer:** Compact user profile row (`36px` height) showing user avatar initials, name, role badge (e.g., `Dispatcher`, `MRO Lead`), and logout/settings trigger.

### 4.2 Top Utility Bar (`52px` height, sticky)
* **Background:** `rgba(255, 255, 255, 0.85)` with `backdrop-filter: blur(8px)`, bottom border `1px solid var(--border-subtle)`.
* **Left Side:** Dynamic Breadcrumb (`Operations` `/` `Fleet Registry` `/` `N842AD`) in `13px` text (parent muted, current page primary medium).
* **Right Side:**
  1. **Global Command Search Trigger:** Minimal pill input (`Search tail #, flight, part... ⌘K`) styled like a `28px` height button with `var(--bg-subtle)` and `var(--border-subtle)`.
  2. **Live UTC Clock Pill:** Aviation operations run on Zulu time. Display a live badge in monospace: `UTC 18:44:12Z` with a subtle pulsing green dot.
  3. **Theme / Notification Icons:** Subtle `28px x 28px` ghost icon buttons.

### 4.3 Main Content Canvas
* **Background:** `var(--bg-canvas)` (`#FAFAFA` in light mode) or pure `#FFFFFF` with structured container borders.
* **Padding:** `24px` (`1.5rem`) on desktop, `16px` on tablet/mobile.
* **Max Width:** `1600px` centered (or `100%` fluid for dense schedule/Gantt views).
* **Vertical Rhythm:** `20px` (`1.25rem`) vertical spacing between major page sections.

---

## 5. CORE COMPONENT SPECIFICATIONS

Refactor or build shared UI primitives to enforce strict visual consistency across all modules.

### 5.1 Page Header Pattern
Every module page must start with the same clean header block:
* **Left:** Page Title (`20px`, semi-bold, `var(--text-primary)`) + 1-line subtitle (`13px`, `var(--text-muted)`).
* **Right:** Secondary actions (e.g., `Export CSV`, `Filter`) as subtle outline buttons + 1 Primary CTA button (e.g., `+ New Work Order`, `+ Log Flight`) in solid `var(--accent-primary)`.

### 5.2 Minimalist KPI Stat Cards
Remove colorful card backgrounds, oversized circular icon badges, and decorative wave graphics.
* **Container:** `background: var(--bg-surface)`, `border: 1px solid var(--border-subtle)`, `border-radius: 8px`, `padding: 16px`.
* **Top Row:** Label in `12px` medium `var(--text-secondary)` on the left; subtle `14px` muted icon on the right.
* **Middle Row:** Value in `24px` semi-bold `var(--text-primary)` (`tabular-nums`).
* **Bottom Row:** Compact delta badge or context subtext in `11px` (e.g., `+2.4% vs last 30d` or `2 aircraft scheduled for A-Check`).

### 5.3 High-Density ERP Data Tables
Tables are the backbone of AeroDesk-ERP. They must look like Linear/Stripe tables:
* **Wrapper:** `background: var(--bg-surface)`, `border: 1px solid var(--border-subtle)`, `border-radius: 8px`, `overflow: hidden`.
* **Integrated Filter Bar (Top of Table):**
  * Placed inside the table card header (`padding: 10px 16px`, `border-bottom: 1px solid var(--border-subtle)`).
  * Contains a compact search input (`height: 32px`, `width: 240px`), segmented status tabs (`All`, `Airworthy`, `Maintenance`, `AOG`), and a column/export button on the far right.
* **Table Header (`<thead>`):**
  * `background: var(--bg-subtle)`, `border-bottom: 1px solid var(--border-subtle)`.
  * Cells: `padding: 8px 16px`, `font-size: 11px`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.05em`, `color: var(--text-muted)`.
* **Table Body (`<tbody>`):**
  * Row height: Compact (`40px` to `44px` max).
  * Cell padding: `8px 16px`, `font-size: 13px`, `color: var(--text-secondary)`, `white-space: nowrap`.
  * Primary identifier column (e.g., Tail Number, Work Order #, Flight #): `color: var(--text-primary)`, `font-weight: 500`, `font-family: monospace`.
  * Row dividers: `border-bottom: 1px solid var(--border-subtle)`.
  * Row hover: `background: #F8FAFC` (or `var(--bg-subtle)`).
* **Row Actions:** Right-aligned subtle three-dot menu (`⋯`) or inline quick-action text button that brightens on row hover.

### 5.4 Aviation Status Badges (Pill / Dot Style)
Replace bulky solid-colored rectangles with refined hairline status pills:
* **Dimensions:** `height: 22px`, `padding: 0 8px`, `border-radius: 9999px`, `font-size: 11px`, `font-weight: 500`, `display: inline-flex`, `align-items: center`, `gap: 6px`.
* **Structure:** A `6px x 6px` rounded circle dot (`border-radius: 50%`) + label text, wrapped in the semantic background and `1px solid` semantic border defined in Section 2.1.
  * *Example (Airworthy):* Bg `#ECFDF5`, Border `#A7F3D0`, Dot `#10B981`, Text `#065F46`.
  * *Example (AOG):* Bg `#FEF2F2`, Border `#FECACA`, Dot `#EF4444` (with subtle pulse animation for active AOG), Text `#991B1B`.

### 5.5 Buttons & Controls
* **Height:** Standard `32px` (`h-8`) for toolbars/tables, `36px` (`h-9`) for primary forms.
* **Font:** `13px`, `font-weight: 500`, `border-radius: 6px`.
* **Variants:**
  * **Primary:** `background: var(--accent-primary)` (`#18181B`), `color: #FFFFFF`, hover `#27272A`.
  * **Secondary / Outline:** `background: var(--bg-surface)`, `border: 1px solid var(--border-strong)`, `color: var(--text-primary)`, hover `var(--bg-subtle)`.
  * **Ghost:** `background: transparent`, `color: var(--text-secondary)`, hover `var(--bg-subtle)` and `var(--text-primary)`.
  * **Destructive:** Subtle red tint (`background: #FEF2F2`, `border: 1px solid #FECACA`, `color: #DC2626`), turning solid red on hover.

### 5.6 Forms, Modals & Slide-Over Drawers
* **Prefer Slide-Over Drawers Over Center Modals:** For creating/editing records (e.g., logging a flight discrepancy, creating a Work Order, inspecting a part), use a right-hand slide-over drawer (`width: 480px`, `height: 100vh`, `border-left: 1px solid var(--border-subtle)`, `--shadow-float`) so the user maintains visual context of the underlying table.
* **Form Inputs:**
  * `height: 36px`, `padding: 0 12px`, `font-size: 13px`, `border-radius: 6px`.
  * `background: var(--bg-surface)`, `border: 1px solid var(--border-strong)`, `color: var(--text-primary)`.
  * **Focus State:** `outline: none`, `border-color: var(--text-primary)` (or `var(--accent-brand)`), `box-shadow: 0 0 0 2px rgba(24, 24, 27, 0.08)`.
  * **Labels:** `12px`, `font-weight: 500`, `color: var(--text-primary)`, placed `6px` above the input.

### 5.7 Charts & Data Visualizations
If the app uses charts (Recharts, Chart.js, ApexCharts, or custom SVG):
* Remove chart background fills, 3D effects, and heavy gridlines.
* Use horizontal dashed gridlines only (`#E4E4E7`, `stroke-dasharray="3 3"`).
* Hide axis lines (`axisLine={false}`, `tickLine={false}`); style axis labels in `11px` muted monospace.
* Limit chart color palettes to `#18181B` (primary metric), `#94A3B8` (secondary comparison), and `#2563EB` or `#10B981` (highlight metric).
* Style tooltips with `background: #18181B`, `color: #FAFAFA`, `border-radius: 6px`, `font-size: 12px`, `padding: 8px 12px`.

---

## 6. MODULE-BY-MODULE UI BLUEPRINTS

Apply these specific layout patterns to the existing modules in **AeroDesk-ERP**:

### 6.1 Operations Control Center (Main Dashboard)
* **Row 1 (4-Column KPI Grid):**
  1. `Fleet Availability` (e.g., `91.7%` — `11/12 Airworthy`)
  2. `Active Flights / Dispatch` (e.g., `6 Airborne` — `2 Boarding`)
  3. `Open Work Orders / MELs` (e.g., `14 Open` — `1 Critical AOG`)
  4. `On-Time Performance (OTP)` (e.g., `96.4%` — `+1.2% vs target`)
* **Row 2 (Asymmetric 2-Column Split: `2fr` Left, `1fr` Right):**
  * **Left (`2fr`): Live Flight & Fleet Status Board:** A compact, tabbed table switching between `Active Flights`, `Upcoming Departures`, and `Aircraft Status`.
  * **Right (`1fr`): Actionable Alerts & AOG/MEL Feed:** A vertical timeline list showing urgent maintenance deferrals, expiring crew certifications, or low-stock critical rotables—each item clickable with a monospace timestamp and severity dot.

### 6.2 Fleet & Aircraft Registry View
* **View Switcher:** Allow toggling between **Table View** (default high-density registry) and **Compact Grid View** (3 columns of minimalist aircraft cards).
* **Aircraft Card Design (if Grid View is used):**
  * Top: Tail Number in `15px` bold monospace (`N842AD`) + Aircraft Type badge (`B737-800`) on the left; Status Pill (`Airworthy`) on the right.
  * Middle: A clean `2x2` micro-grid with `1px` internal hairlines showing `Total Flight Hours (TFH)`, `Total Cycles (TFC)`, `Next Check Due (e.g., C-Check in 142 FH)`, and `Current Location (ICAO)`.
  * Bottom: Subtle footer with `View Tech Log →` link.

### 6.3 MRO, Maintenance & Work Orders View
* **Header Tabs:** `All Work Orders`, `Line Maintenance`, `Heavy / Hangar`, `MEL / CDL Deferrals`, `AD / SB Compliance`.
* **Table Columns:** `WO #` (mono) | `Tail #` (mono) | `ATA Chapter` (mono badge, e.g., `ATA 29 - Hydraulic`) | `Discrepancy Summary` | `Priority` | `Assigned Engineer` | `Status` | `Due Date (UTC)`.
* **Visual Priority Indicator:** Use a minimalist vertical `3px` status bar or micro icon for priority (`Routine`, `Urgent`, `AOG Critical`) rather than coloring the entire table row.

### 6.4 Spare Parts, Rotables & Inventory Management
* **Quick Filter Pills:** `All Parts`, `Rotables`, `Consumables`, `Low Stock Alert`, `Quarantined / Unserviceable`.
* **Table Columns:** `Part Number (P/N)` (mono) | `Serial Number (S/N)` (mono) | `Description` | `Condition` (`SV - Serviceable`, `OH - Overhauled`, `US - Unserviceable`) | `Bin / Warehouse` | `Qty On Hand` (with subtle inline progress bar relative to min-stock threshold) | `Unit Cost`.

### 6.5 Flight Operations, Dispatch & Crew Scheduling
* **Schedule Timeline / Roster:** Use a clean horizontal grid or high-density table with monospace departure/arrival blocks (`STD 08:15Z` $\rightarrow$ `STA 11:40Z`), block hours calculation, assigned PIC/SIC crew initials, and fuel load metrics.
* **Flight Duty Period (FDP) Indicators:** Represent crew legality and rest hours using ultra-thin `4px` horizontal progress bars (`#10B981` normal, `#F59E0B` approaching limit, `#EF4444` max duty exceeded).

### 6.6 Authentication / Login Screen (If Applicable)
* **Centered Minimalist Card (`max-width: 380px`)** on a `#FAFAFA` canvas with a subtle radial dot-matrix or technical grid background pattern (`background-image: radial-gradient(#E4E4E7 1px, transparent 1px); background-size: 20px 20px;`).
* Clean AeroDesk emblem at top, concise title `Sign in to AeroDesk ERP`, stacked inputs, and a full-width `#18181B` submit button.

---

## 7. ANTI-PATTERNS TO REMOVE IMMEDIATELY

When refactoring existing files in `AeroDesk-ERP`, actively search for and remove:
1. **Heavy Shadows:** Replace `shadow-lg`, `shadow-xl`, `shadow-md` on static cards with `border border-zinc-200 shadow-none` (or `shadow-2xs`).
2. **Oversized Padding & Rounded Corners:** Replace `rounded-2xl` / `rounded-3xl` and `p-8` on cards with `rounded-lg` (`8px`) and `p-4` or `p-5`.
3. **Rainbow Dashboards:** Remove multi-colored card backgrounds (e.g., solid blue card, solid purple card, solid green card). Keep all cards white (`#FFFFFF`) on a `#FAFAFA` canvas.
4. **Inconsistent Icon Sizes:** Standardize all sidebar and button icons to `16px` (`w-4 h-4`) and card header icons to `16px` or `18px`.
5. **Unformatted Numbers & Codes:** Never render tail numbers, flight numbers, timestamps, or currencies in proportional sans-serif without `tabular-nums`.

---

## 8. STEP-BY-STEP EXECUTION PLAN FOR ANTIGRAVITY

Execute the redesign in this exact sequence:

### Phase 1: Repository Discovery & Token Setup
- [ ] Inspect `package.json` and existing stylesheets to determine the framework (React/Next.js/Vue/Angular/Blade/Django/etc.) and CSS engine (Tailwind, CSS Modules, Styled Components, or Vanilla CSS).
- [ ] Configure global fonts (`Inter` + `JetBrains Mono`) and inject the CSS variables from **Section 2**.
- [ ] Set base body styles (`background-color: var(--bg-canvas)`, `color: var(--text-primary)`, `-webkit-font-smoothing: antialiased`).

### Phase 2: Application Shell & Navigation
- [ ] Refactor the main Layout / Sidebar / Topbar components according to **Section 4**.
- [ ] Add the live UTC/Zulu clock indicator and clean breadcrumb header in the top bar.
- [ ] Verify that all existing navigation links and role-based route guards work identically to before.

### Phase 3: Shared UI Primitives
- [ ] Refactor (or create) shared components for `Button`, `Badge` (Aviation Status Pills), `Card` (KPI & Container), `Table`, `Input`/`Select`, and `Drawer`/`Modal` according to **Section 5**.

### Phase 4: Module Views Refactoring
- [ ] **Dashboard / OCC:** Apply the 4-column KPI row + asymmetric 2-column operations board (**Section 6.1**).
- [ ] **Fleet & Aircraft Module:** Apply high-density table + monospace tail/airframe formatting (**Section 6.2**).
- [ ] **MRO & Maintenance Module:** Apply ATA badges, subtle priority indicators, and clean filter tabs (**Section 6.3**).
- [ ] **Inventory / Parts, Crew & Finance Modules:** Standardize all tables, forms, and action bars (**Sections 6.4–6.5**).
- [ ] **Auth / Settings Pages:** Apply the minimalist technical grid card style (**Section 6.6**).

### Phase 5: Quality Assurance & Build Verification
- [ ] Run the project build/linter (`npm run build` / `npm run lint` or equivalent) to confirm zero broken imports, missing variables, or TypeScript/syntax errors.
- [ ] Verify responsive behavior on desktop (`1440px+`), laptop (`1280px`), and tablet (`768px`).