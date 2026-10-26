# Development Plan: Interactive Operational Modules & Legal Minimum Wage Compliance — EquiWage Analytics

## 1. General Purpose & Architectural Freedom
Transform **EquiWage Analytics** from a static analytical viewer into an interactive, real-time compensation operations platform within the existing Monorepo architecture (`apps/frontend`, `apps/backend`, and `packages/shared`).

* **Total Freedom of File Creation:** You have full autonomy to create and modify as many files, SQLite tables, REST endpoints, controllers, `AuditEngine` services, modals, drawers, custom hooks, and atomic components as needed so these 5 new features operate seamlessly end-to-end.
* **Critical Stage-by-Stage Execution Rule (MANDATORY):** This plan is divided into **4 sequential Stages**. As a coding agent, **you MUST ONLY implement Stage 1 initially**. Upon completing each stage, present a summary of the changes and **STOP completely**, explicitly asking the user for confirmation (*"Do you confirm that Stage X works properly so we can proceed to Stage X+1?"*) before moving on to the next stage.

---

## 2. The 5 New Core Features to Implement

### A. Active Payroll Management (Employee CRUD Operations)
* **User Action:** In the Employees view (`/employees`) and accessible from the Dashboard, the HR analyst is no longer limited to re-uploading full CSV/Excel files. They can click `"+ Add Employee"` to register new hires manually (ID, Full Name, Job Title, Department, Level L1–L8, Fixed Base Salary), click any existing employee to edit their role/level/salary via an interactive modal or drawer, or delete records.
* **System Impact:** Every creation, edit, or deletion immediately updates the local SQLite database and recalculates all KPIs, distribution curves, and inequity alerts in real time (< 1s).

### B. Individual Manual Adjustments (1-on-1 Micro-Simulations)
* **User Action:** In the scatter plot (`/dashboard/distribution`), the critical alerts list, or the simulator table (`/dashboard/simulator`), clicking on any employee opens a quick **"Individual Salary Adjustment"** drawer/modal. The user can input a custom raise (by fixed amount `+$ USD` or percentage `+%`) and preview their new position within the salary band.
* **System Impact:** The employee's data point on the Scatter Plot and the total required budget update instantaneously to show whether the manual raise resolves their market gap or internal inequity.

### C. Future "Market Inflation" Simulator
* **User Action:** In the Simulator (`/dashboard/simulator`) and Salary Bands (`/bands`), add an interactive slider and numeric input titled **"Projected Market Inflation (0% to +25%)"**.
* **System Impact:** Adjusting the inflation percentage dynamically shifts all market salary bands (`min_salary` P25, `median_salary` P50, and `max_salary` P75) upward by that percentage. The `AuditEngine` recalculates in under 1 second how many currently aligned employees would fall below the band next year if no action is taken, updating the projected leveling budget.

### D. Country-Based Legal Minimum Wage Regulation (Legal Compliance Engine)
* **User Action:**
  1. In `/bands` or `/settings` (with quick controls in `/dashboard/simulator`), provide a **"Legal Minimum Wage Compliance"** card.
  2. Include an **Enable/Disable Toggle Switch** for minimum wage alerts.
  3. Include a **Country Selector Dropdown** (preloaded with reference minimum wages for key LATAM, North American, and European countries) paired with a **100% Editable Numeric Input** for *"Current Legal Minimum Wage"*. This empowers the HR analyst to tweak the exact statutory base value according to local decrees without relying on hardcoded laws.
  4. Include an informative **Tooltip** clearly stating that legal validation evaluates strictly the **Fixed Base Salary** (excluding variable bonuses or commissions).
* **Visual & Mathematical Impact:**
  * **Distinct Visual Severity:** Earning below a market band is a "Market/Retention Risk" (Red Alert `#EF4444`), whereas earning below the Legal Minimum Wage is a **"Critical Legal Violation"**. Flag these cases with a distinct high-priority badge (e.g., Deep Purple `#7C3AED` or Critical Amber with a legal shield/alert icon) on both the Scatter Plot and the Alerts Widget.
  * **Absolute Priority in Simulator:** When active, the `AuditEngine` must allocate budget **first and mandatorily** to bring all legal violators up to the Legal Minimum Wage floor before calculating P25 or P50 leveling adjustments.

### E. Payroll "Action Plan" Generator & Approval Workflow
* **User Action:** In the Simulator (`/dashboard/simulator`), after configuring macro policies, inflation, and individual adjustments, the user clicks the primary CTA **"Approve Adjustments & Generate Payroll Order"**.
* **System Impact:**
  * Optionally commits the approved salaries as the new current salaries in SQLite (with confirmation) and generates a downloadable **"Payroll Execution Order (.CSV / .XLSX)"** ready for the finance/payroll department. The file includes: *Employee ID, Full Name, Department, Level, Previous Base Salary, Approved Increase (+Amount & +%), New Effective Salary, and Adjustment Reason (Legal Compliance / Band Minimum P25 / Market Median P50 / Individual Manual Adjustment)*.

---

## 3. Mandatory Design System & UI Rules
* **Warm Enterprise / Soft UI Aesthetic:** Strictly preserve the `#F9FAFB` canvas, solid white `#FFFFFF` cards, `24px` rounded corners (`rounded-xl`), diffused `shadow-soft`, primary orange `#F97316`, and full support for the project's existing dark gray **Dark Mode**.
* **ZERO Glassmorphism & ZERO Engineering Jargon:** Never use blurry transparencies or display requirement codes (`RF-001`, `RNF-002`) in the UI.
* **Smooth Micro-Interactions:** Use `framer-motion` for modals, drawers, inflation slider transitions, and interactive chart feedback.

---

## 4. Step-by-Step Execution Plan (Staged with Confirmation)

### STAGE 1: SQLite Database Expansion, Shared Contracts, and Legal Compliance Schema
**Goal:** Prepare the local persistence layer and TypeScript contracts to support employee CRUD, manual adjustments, country minimum wage settings, and approved payroll plans.
1. Update `packages/shared` with new interfaces (`LegalComplianceConfig`, `ManualAdjustment`, `InflationSimulationParams`, `PayrollActionPlanItem`).
2. Update the SQLite schema in `apps/backend` to store:
   * Legal compliance settings (selected country code, editable minimum wage value, enabled/disabled boolean).
   * Support in the `employees` table (or auxiliary table) for proposed manual adjustments.
   * Seed catalog of reference countries with default minimum wage values (editable by the user).

> 🛑 **CHECKPOINT 1:** Once Stage 1 is complete, stop completely, display the schema and shared contract updates, and ask the user for confirmation before proceeding to Stage 2.

---

### STAGE 2: `AuditEngine` Upgrade and New REST Endpoints in the Backend
**Goal:** Equip the backend with sub-second (< 1s) operational CRUD, inflation projection, and legal compliance calculations.
1. Implement Employee CRUD endpoints in `apps/backend`:
   * `POST /api/employees` (Create single employee with validation).
   * `PUT /api/employees/:id` (Update base salary, role, department, level, or individual manual adjustment).
   * `DELETE /api/employees/:id` (Remove employee).
2. Implement Legal Compliance endpoints (`GET / PUT /api/compliance/minimum-wage`).
3. Upgrade `AuditEngine` to:
   * Evaluate **Legal Minimum Wage violations** (Priority 1) separately from market band gaps (Priority 2).
   * Apply the **Market Inflation multiplier (% inflation)** dynamically across P25, P50, and P75 band thresholds.
   * Merge macro simulation rules with **Individual Manual Adjustments**.
4. Implement `POST /api/simulator/approve-plan` to optionally commit approved raises to SQLite and return the structured **Payroll Execution Order** dataset.

> 🛑 **CHECKPOINT 2:** Once Stage 2 is complete, stop completely, list the new REST endpoints and `AuditEngine` capabilities, and ask the user for confirmation before proceeding to Stage 3.

---

### STAGE 3: Frontend UI for Active Employee Management, Legal Compliance & Micro-Simulations
**Goal:** Build the interactive UI components for managing employees, configuring country minimum wages, and executing 1-on-1 salary adjustments.
1. In `/employees` (`EmployeesImportPage.jsx`):
   * Add an interactive employee directory table with search, a `"+ Add Employee"` button (opening a clean Soft-UI Modal/Drawer), and row actions to **Edit** or **Delete** employees in real time.
2. In `/bands` and `/dashboard/simulator`:
   * Build the **"Legal Minimum Wage Compliance"** card featuring the activation toggle, country preset selector, editable statutory minimum wage input, and base-salary legal tooltip.
3. In `/dashboard/distribution` and `/dashboard/overview`:
   * Render the distinct **"Legal Alert (< Min Wage)"** badge and chart point styling alongside standard market disparity alerts.
   * Allow clicking any employee row or scatter point to open the **"Individual Adjustment"** drawer/modal, previewing the immediate impact on their band position and budget.

> 🛑 **CHECKPOINT 3:** Once Stage 3 is complete, stop completely, explain the new interactive UI flows, and ask the user for confirmation before proceeding to Stage 4.

---

### STAGE 4: Live Market Inflation Slider, Payroll Action Plan Generator & Full Sync
**Goal:** Integrate future inflation modeling and the payroll execution approval workflow into the Simulator and Reports.
1. In `/dashboard/simulator` (`SimulatorPage.jsx`):
   * Add the **"Projected Market Inflation (0% - 25%)"** slider control, dynamically shifting band ranges and displaying how many additional employees would fall behind market rates.
   * Break down the Hero budget metrics into: *Legal Compliance Cost*, *Band Leveling Cost*, and *Manual Adjustments*.
2. Implement the **"Approve Adjustments & Export Payroll Order"** workflow:
   * Generate and download the `.CSV` / `.XLSX` payroll execution file and allow applying the new salaries to the active SQLite payroll with visual confirmation.
3. Update `CompensationContext` and the anonymized AI report payload (`aiService`) so executive diagnostics also reflect legal compliance status and inflation risk when enabled.

> 🛑 **FINAL CHECKPOINT:** Present a complete summary of all 5 interactive features and ask the user to verify the end-to-end operational workflow of EquiWage Analytics.