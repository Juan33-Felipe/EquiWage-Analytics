# EquiWage Analytics — Frontend Application (`@equiwage/frontend`)

## Overview
The **EquiWage Analytics Frontend** is the interactive user interface for the Salary Structure Modeler and Validator. Designed with a **Warm Enterprise / Soft UI** aesthetic, it empowers HR and Compensation teams to visualize salary dispersion, audit internal equity, simulate leveling budgets in real time, and generate executive reports backed by the local SQLite server and anonymized AI diagnostics.

---

## Technology Stack & Architecture

### 1. Core Runtime & Bundler
* **React (`^19.2.8`) & React DOM (`^19.2.8`):** Component-based declarative UI library powering interactive dashboards, real-time simulation controls, and global contexts (`CompensationContext`, `LanguageContext`, `ThemeContext`).
* **Vite (`^8.3.0`) & `@vitejs/plugin-react`:** Lightning-fast development server with Hot Module Replacement (HMR), local `/api` proxy to `http://127.0.0.1:4000`, and optimized production bundling.

### 2. Styling & Design System
* **Tailwind CSS (`^3.4.19`):** Utility-first CSS framework configured with custom **Warm Enterprise / Soft UI** design tokens:
  * **Color Palette:** Warm alabaster background (`#F9FAFB`), crisp white surfaces (`#FFFFFF`), vibrant orange primary accents (`#F97316` / `#EA580C` / `#FDBA74`), semantic status colors (`#10B981` emerald for aligned, `#EF4444` crimson for below-band critical gaps), and full dark gray **Dark Mode** (`darkMode: 'class'`) support.
  * **Soft UI Elevation & Geometry:** Custom soft elevation shadows (`shadow-soft`) and generous rounded corners (`rounded-xl` at `24px`, `rounded-pill` at `9999px`) with `Inter` typography.
* **PostCSS (`^8.5.29`) & Autoprefixer (`^10.6.1`):** CSS processing and automatic vendor prefixing.

### 3. Component Architecture (Atomic Design)
The codebase follows the **Atomic Design** methodology under `src/`:
* **`components/atoms/`:** Foundational building blocks (`Avatar`, `Badge`, `Button`, `Card`, `SelectPill`, `SliderControl`).
* **`components/molecules/`:** Composed UI units (`AlertRow`, `FileDropzone`, `FilterBar`, `HeroCard`, `SearchInput`, `StatCard`, `TabPill`).
* **`components/organisms/`:** Complex domain sections (`BandMatrixTable`, `DepartmentImpactChart`, `Header`, `InequityAlertsWidget`, `ReportPreviewCard`, `SalaryDistributionChart`, `Sidebar`, `SimulatorControlsCard`, `SimulatorHeroCard`, `TopMetricsRow`).
* **`components/templates/`:** Layout shells (`DashboardLayout`).
* **`pages/`:** Route-level views (`OverviewPage`, `DistributionPage`, `SimulatorPage`, `EmployeesImportPage`, `SalaryBandsPage`, `ReportsPage`, `SettingsPage`).

### 4. Data Visualization & Charts
* **Recharts (`^3.10.1`):** Composable charting library used for:
  * **Salary Dispersion Scatter Plot & Band Curves:** Visualizes individual employees across Job Levels (`L1–L8`) overlaid against `P25` (Minimum), `P50` (Median), and `P75` (Maximum) market curves.
  * **Alignment Distribution Donut Chart:** Displays organizational band alignment proportions.
  * **Departmental Budget Impact Charts:** Visualizes leveling cost distribution across departments in the real-time simulator.

### 5. Iconography & Animations
* **Lucide React (`^1.52.0`):** Clean, consistent minimalist stroke iconography across navigation, KPIs, alerts, and actions.
* **Framer Motion (`^14.2.0`):** Smooth layout transitions, table row entrance animations, and tactile micro-interactions.

### 6. Routing, API Consumption, Hooks & Utilities
* **React Router DOM (`^7.18.4`):** Client-side declarative routing across all dashboard modules.
* **Backend HTTP Client Services (`src/services/`):**
  * `http.client.js`: Base HTTP client supporting JSON, `FormData` file uploads, binary `.xlsx` blobs, and structured `ApiClientError` extraction.
  * `compensation.api.js`: Connects all compensation, band editing, simulator, `.CSV`/`.XLSX` file import, report export, and `.json` session operations to the local SQLite backend.
  * `ai.api.js` & `src/hooks/useAiDiagnostics.js`: Requests anonymized AI executive diagnostics (`POST /api/ai/diagnostics`) for the Executive Reports module.
* **SheetJS (`xlsx` `^0.18.5`):** Spreadsheet parsing and `.XLSX` workbook generation.
* **`clsx` (`^2.1.1`) & `tailwind-merge` (`^3.7.0`):** Conditional class composition and conflict-free Tailwind class merging via `src/utils/cn.js`.
* **`@equiwage/shared`:** Workspace dependency providing shared TypeScript contracts, domain constants, validation schemas, and formatting utilities.

---

## Available Scripts

From the monorepo root:
```bash
npm run dev:frontend
npm run build:frontend
npm run lint:frontend
```

Or directly inside `apps/frontend`:
```bash
npm run dev       # Start Vite dev server
npm run build     # Build production bundle to dist/
npm run lint      # Run ESLint checks
npm run preview   # Preview production build locally
```
