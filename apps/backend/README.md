# EquiWage Analytics — Backend Server (`@equiwage/backend`)

## Overview
The **EquiWage Analytics Backend** is a high-performance, local-first Node.js & TypeScript server engineered to persist compensation structures in an embedded SQLite database, execute deterministic mathematical salary audits in under 1 second (`~1ms`), validate `.CSV` and `.XLSX` imports, manage local `.json` project sessions, and generate anonymized AI executive diagnostics.

---

## Technology Stack & Architecture

### 1. Runtime & Language
* **Node.js (ESM):** Modern asynchronous JavaScript runtime executing locally on the user's machine to guarantee data sovereignty (`RNF-001`).
* **TypeScript (`^5.7.3`) & `tsx` (`^4.19.2`):** Strictly typed backend architecture consuming shared schemas and interfaces from `@equiwage/shared`.

### 2. HTTP Framework & Middlewares
* **Express.js (`^4.21.2`):** Fast, modular HTTP framework exposing RESTful endpoints under `/api/*`.
* **CORS (`cors` `^2.8.5`):** Cross-origin resource sharing middleware configured for seamless local communication with `@equiwage/frontend`.
* **Environment Management (`dotenv` `^16.4.7`):** Loads runtime configuration (`PORT`, `HOST`, `CORS_ORIGIN`, `SQLITE_DB_PATH`, `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_TIMEOUT_MS`) from `.env`.
* **Request Validators & Structured Error Handlers:** Custom validation modules (`src/validators/`) and centralized `AppError` / `errorHandlerMiddleware` (`src/middlewares/`) returning clear, HR-friendly validation messages (`RNF-003`).

### 3. Local Database & Persistence Layer
* **SQLite (`node:sqlite` `DatabaseSync`):** Native, zero-configuration embedded SQLite relational database running in-process with `WAL` (Write-Ahead Logging) mode, foreign keys, and atomic `BEGIN IMMEDIATE` transactions (`< 2ms` response times per `RNF-002`).
* **Automatic Schema Initialization & Realistic Seed (`src/database/`):** Automatically initializes tables (`salary_bands`, `employees`, `simulation_settings`, `app_metadata`, `audit_snapshots`) and indexes on startup, populating a realistic initial seed (`L1–L8` market bands and 24 diverse employees with market gaps and internal inequities) when empty.

### 4. Deterministic Audit & Simulation Engine (`src/engines/`)
* **Zero Math Delegation to AI:** All compensation math is 100% deterministic and algorithmic:
  * **Market Gaps (`RF-003`):** `band-positioning.engine.ts` detects employees below `P25` (`minSalary`), computing exact dollar deficits, percentage deviations, compa-ratios, and band penetration.
  * **Internal Inequity (`RF-004`):** `inequity.engine.ts` groups peers by role and job level to flag salary spreads exceeding `10%` (`INEQUITY_THRESHOLD`), classifying severity levels.
  * **Real-Time Budget Simulator (`RF-005`):** `simulation.engine.ts` dynamically computes leveling costs to `P25` (Minimum) or `P50` (Market Median) with department filters, custom percentage adjustments, departmental cost shares, and `1–4` quarter rollout schedules.

### 5. File Processing, Validation & Session Export (`src/services/`)
* **Spreadsheet Parsing & Generation (`xlsx` `^0.18.5`, `multer` `^1.4.5-lts.1`):** Receives, parses, and validates `.CSV` and `.XLSX` uploads for both employee payroll (`RF-001`) and market salary bands (`RF-002`), verifying mandatory columns (`ID`, `Full Name`, `Job Title`, `Department`, `Job Level`, `Current Salary`) and data types.
* **Local Session Persistence & Reports (`RF-007`, `RF-008`):** Full `.json` project state export/restore (`session.service.ts`) and multi-sheet `.XLSX` executive report generation (`report.service.ts`).

### 6. Artificial Intelligence Integration with HR Anonymization Layer (`src/ai/`)
* **Multi-Provider LLM API Client (`llm.client.ts`):** Connects to Google Gemini or OpenAI-compatible REST APIs configured via `.env`, backed by an intelligent deterministic fallback generator (`fallback.generator.ts`) when offline or unconfigured.
* **Strict Privacy & Anonymization Layer (`anonymizer.service.ts`, `RF-007`):** Strips all Personal Identifiable Information (PII)—never transmitting employee names or personal IDs—and sends only aggregated statistical metrics verified by `@equiwage/shared`'s `hasNoPersonalIdentifiers()` guard.

---

## Available Scripts

From the monorepo root:
```bash
npm run dev:backend
npm run build:backend
```

Or directly inside `apps/backend`:
```bash
npm run dev       # Start local backend server in watch mode (http://127.0.0.1:4000)
npm run start     # Start local backend server
npm run build     # Compile TypeScript to dist/
npm run db:seed   # Verify or re-seed SQLite database (pass -- --reset to force reset)
npm run lint      # Run TypeScript typechecking
```
