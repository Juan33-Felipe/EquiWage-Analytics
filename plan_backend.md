# Backend & Monorepo Implementation Plan — EquiWage Analytics (plan_backend.md)

## 1. General Context, Robustness, and Architectural Freedom
* **Project Name:** EquiWage Analytics (Salary Structure Modeler and Validator).
* **Backend Purpose:** Provide a robust, high-performance local server in Node.js (TypeScript/JavaScript) with local SQLite persistence and API-based AI integration, designed to completely replace frontend mock data and process real-time salary audits.
* **Total Freedom of File Creation (ROBUST PROJECT):**
  This document defines the **functional and architectural goals**, NOT a restricted or closed list of files. Since this is a robust enterprise project, you have **absolute freedom** to design and create as many files, folders, subfolders, controllers, repositories, services, calculation engines, validators, middlewares, error handlers, helpers, hooks, and HTTP clients as you deem necessary across `apps/backend`, `packages/shared`, and `apps/frontend`. Never limit yourself to a single file if separating responsibilities improves code quality, modularity, and scalability.
* **Critical Stage-by-Stage Execution Rule (MANDATORY):**
  This plan is divided into **5 sequential Stages**. As a coding agent, **you MUST ONLY implement Stage 1 initially**. Upon completing each stage, you must present a summary of the folders and files created/modified and **STOP completely**, explicitly asking the user for confirmation (*"Do you confirm that Stage X works properly so we can proceed to Stage X+1?"*) before moving on to the next stage.

---

## 2. Backend Responsibilities and Core Requirements
To ensure the proper operation of EquiWage Analytics, the backend must strictly fulfill the following responsibilities:

1. **Robust Local Database Management (SQLite):**
   * Persistently store salary bands (Job Levels L1 to L8 with P25 minimum, P50 median, and P75 maximum), the employee payroll, and any auxiliary tables or audit/scenario history you consider useful for system robustness.
   * Automatically initialize the database schema and populate a comprehensive initial seed if the database is empty so that the application is 100% functional from the very first launch.
2. **Strict File Import, Parsing, and Validation (RF-001, RF-002, RNF-003):**
   * Process `.CSV` and `.XLSX` files for both employee payroll and market salary bands.
   * Validate the presence of mandatory columns (ID, Full Name, Job Title, Department, Job Level, Current Salary) and ensure data type coherence. If any column is missing or formatting errors occur, return a structured, clear, and user-friendly error message indicating exactly what is missing, avoiding raw engineering jargon.
3. **Deterministic Mathematical & Algorithmic Audit Engine (RF-003, RF-004, RF-005, RNF-002):**
   * **Zero mathematical delegation to AI:** All numerical calculations must be deterministic and respond in **under 1 second (< 1s)**.
   * **Market Gaps (RF-003):** Identify employees whose current salary falls below the minimum (`minSalary` / P25) of their corresponding band, calculating exact deviation amounts and percentages.
   * **Internal Inequity (RF-004):** Identify employees within the same role/level whose salary difference exceeds `10%` compared to peers or the role average, classifying them by severity.
   * **Real-Time Budget Simulator (RF-005):** Dynamically calculate the exact cost of leveling lagging salaries to the band minimum (`P25`) or market median (`P50`), supporting department filters, percentage adjustments, departmental cost breakdowns, and phased rollouts (*1 to 4 quarters*).
4. **API-Based Artificial Intelligence Module with Anonymization (RF-007):**
   * Connect via API to an LLM provider (configured via `.env` environment variables).
   * **Privacy Rule:** NEVER send employee full names or personal IDs to the external API. Build an anonymization layer that sends only aggregated statistical metrics (total analyzed, gap counts, most affected department, required budget, band compression) so the AI can draft executive diagnostics, strategic findings, and action plans for management.
5. **Report Export & Local Project Session Persistence (RF-007, RF-008):**
   * Provide structured data or generated files for exporting executive reports in PDF and Excel formats.
   * Allow exporting the complete state of the current analysis into a local `.json` project file and restoring it entirely when loaded by the user.

---

## 3. Root Monorepo Workspace Structure
The repository must be organized at the root using **Workspaces** with three main spaces. Inside each workspace (`apps/frontend`, `apps/backend`, and `packages/shared`), you have **full autonomy** to design the internal folder and file architecture:

equiwage-analytics/
├── package.json            # Root Monorepo configuration (workspaces and global scripts)
├── plan_backend.md         # This staged implementation plan
├── README.md               # General Monorepo documentation
├── packages/
│   └── shared/             # Space for shared types, interfaces, schemas, DTOs, or utilities (free internal structure)
└── apps/
    ├── frontend/           # Existing user interface application (React + Vite + Tailwind CSS)
    │   └── README.md       # Documentation of technologies used in the Frontend
    └── backend/            # Local server: Node.js + TypeScript/JS + SQLite + AI API (free modular internal architecture)
        └── README.md       # Documentation of technologies used in the Backend

---

## 4. Module README Specifications

### A. Mandatory Content for `apps/frontend/README.md`
Must clearly document the architecture and technologies used in the Frontend:
* **Core:** React, Vite.
* **Styling & Design System:** Tailwind CSS (Configured with *Warm Enterprise / Soft UI* Design Tokens and dark gray *Dark Mode* support), PostCSS, Autoprefixer.
* **Component Architecture:** *Atomic Design* methodology (`atoms`, `molecules`, `organisms`, `templates`, `pages`).
* **Data Visualization & Charts:** `recharts` (Salary dispersion Scatter Plot, P25-P50-P75 curves, and budget impact charts).
* **Iconography & Animations:** `lucide-react` (minimalist icons), `framer-motion` (smooth transitions and micro-interactions).
* **Routing, API Consumption & Utilities:** `react-router-dom`, `clsx`, `tailwind-merge`, and any additional libraries used for export or state management.

### B. Mandatory Content for `apps/backend/README.md`
Must clearly document the architecture and all technologies implemented in the Backend:
* **Runtime & Language:** Node.js, TypeScript / JavaScript.
* **HTTP Framework & Middlewares:** Express.js (or Fastify), CORS, environment variable management (`dotenv`), validators, and error handlers.
* **Local Database:** SQLite (e.g., `better-sqlite3` or chosen ORM) for ultra-fast embedded persistence (< 1s) without external database servers.
* **File Processing & Export:** Installed libraries for receiving, validating, reading, and writing `.CSV` and `.XLSX` spreadsheets.
* **Artificial Intelligence Integration:** LLM API client/SDK with an HR sensitive-data anonymization architecture.

---

## 5. Step-by-Step Execution Plan (Staged with Confirmation)

### STAGE 1: Monorepo Restructuring, Shared Package, and README Documentation
**Goal:** Cleanly organize the monorepo workspaces without breaking the existing frontend and document each module's tech stack.
1. Create the monorepo workspace structure (`apps/frontend`, `apps/backend`, and `packages/shared`).
2. Move the current frontend project into `apps/frontend/`, ensuring all dependencies, assets, imports, and scripts continue working seamlessly.
3. Configure the root `package.json` with NPM Workspaces and convenient scripts to run the frontend, backend, or both concurrently.
4. Create `apps/frontend/README.md` and `apps/backend/README.md` detailing the technologies specified in Section 4.
5. Design inside `packages/shared` all type definitions, data contracts, constants, or schemas useful for sharing between frontend and backend.

> 🛑 **CHECKPOINT 1:** Once Stage 1 is complete, stop completely, display a summary of the monorepo organization, and ask the user for confirmation before proceeding to Stage 2.

---

### STAGE 2: Base Backend Server Architecture and SQLite Persistence Layer
**Goal:** Set up a robust, modular backend server in Node.js/TypeScript and build the entire local SQLite database layer with its initial seed.
1. Initialize `apps/backend` and install all dependencies and dev tools needed for a robust server.
2. Design the internal folder architecture of the backend (e.g., config, database, migrations/schemas, repositories/DAOs, models, error middlewares, etc., creating as many files as needed).
3. Implement the local SQLite connection, automatic table/index creation, and a rich, realistic seed system (L1-L8 bands and a diverse employee payroll featuring real cases of market gaps and internal inequities) so the DB starts populated if empty.
4. Start the HTTP server with base middlewares and healthcheck/diagnostic endpoints.

> 🛑 **CHECKPOINT 2:** Once Stage 2 is complete, stop completely, explain the created structure, show how to verify that the server and SQLite are working, and ask the user for confirmation before proceeding to Stage 3.

---

### STAGE 3: Algorithmic Audit Engine, Simulator, File Importers, and REST API
**Goal:** Build deterministic business logic modules (< 1s), file processors, and all controllers/routes required to power the system.
1. Develop the salary audit engine modules:
   * General KPI calculation, market gap detection (below P25 minimum), and band positioning (*compa-ratio* / percentiles).
   * Internal inequity detection (> 10% disparity within the same role/level) and critical outlier detection for the scatter plot.
   * Real-time dynamic budget simulation engine (policies for P25 or P50, department inclusion/exclusion, 1-to-4 quarter rollout, departmental cost impact, and detailed employee adjustment breakdown).
2. Develop `.CSV` and `.XLSX` import services and validators for payroll and salary bands, ensuring friendly, detailed error responses when mandatory columns are missing.
3. Develop local session management services (full export and restore of `.json` projects) and executive report data generators.
4. Create all controllers, request validators, and REST routes to expose these capabilities cleanly.

> 🛑 **CHECKPOINT 3:** Once Stage 3 is complete, stop completely, list the created modules and available REST endpoints, and ask the user for confirmation before proceeding to Stage 4.

---

### STAGE 4: API-Based Artificial Intelligence Module with Anonymization Layer
**Goal:** Build a robust AI integration to generate executive diagnostics, statistical findings, and leveling action plans without exposing personal employee data.
1. Configure environment variable handling (`.env` and `.env.example`) and AI provider settings in the backend.
2. Design and create the anonymization modules, executive prompt builders, and LLM communication services, guaranteeing that employee names or personal IDs are never transmitted.
3. Implement controllers and endpoints allowing the frontend to request executive narrative analyses, departmental strategic recommendations, and management report summaries.
4. Implement resilient error handling and an intelligent fallback generator in case the user has not configured an API Key or network issues occur.

> 🛑 **CHECKPOINT 4:** Once Stage 4 is complete, stop completely, explain how the AI flow and its fallback mechanism work, and ask the user for confirmation before proceeding to Stage 5.

---

### STAGE 5: Full Frontend-Backend Integration and Removal of Mock Data
**Goal:** Connect all frontend views and components to the real backend, remove simulated mock data, and ensure a seamless end-to-end experience.
1. Create in `apps/frontend` all HTTP client services, custom hooks, adapters, or utilities needed to communicate with every backend endpoint.
2. Update the global state and all application screens (`Overview`, `Distribution`, `Simulator`, `Employees & Import`, `Salary Bands`, `Reports` with AI diagnostics, and `Settings` with local session management) to operate in real time against the backend and SQLite database.
3. Ensure smooth loading states, friendly validation notifications/messages, and immediate synchronization after importing files or editing salary bands.
4. Remove dependencies on static mock data and update the `README.md` files if new libraries or scripts were added during implementation.

> 🛑 **FINAL CHECKPOINT:** Present a complete summary of the final implemented architecture and ask the user to verify the end-to-end operation of EquiWage Analytics.