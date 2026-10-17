# `@equiwage/shared` — Shared Domain Contracts, Schemas & Utilities

This workspace package provides shared TypeScript type definitions, domain constants, validation schemas, and formatting utilities used across both `apps/frontend` and `apps/backend`.

## Internal Structure
* `src/constants/compensation.constants.js` (`.d.ts`): Shared HR policy thresholds (`INEQUITY_THRESHOLD = 0.10`), departments, job levels (`L1–L8`), required import column definitions, header aliases, initial seed datasets (`DEFAULT_SALARY_BANDS`, `DEFAULT_SEED_EMPLOYEES`), and canonical REST API endpoint paths (`API_ENDPOINTS`).
* `src/types/`:
  * `domain.types.d.ts`: Core domain interfaces (`SalaryBand`, `Employee`, `EnrichedEmployee`, `MarketGapItem`, `InequityFlaggedEmployee`, `SimulationParams`, `SimulationResult`, `AuditMetrics`, `ProjectSessionPayload`).
  * `api.types.d.ts`: HTTP request/response envelopes (`ApiSuccessResponse`, `ApiErrorResponse`, `AuditSummaryPayload`, `ImportValidationResult`, `HealthCheckResponse`).
  * `ai.types.d.ts`: Privacy-first anonymized AI payload contracts (`AnonymizedAuditContext`, `AiExecutiveDiagnosticRequest`, `AiExecutiveDiagnosticResponse`).
* `src/schemas/`:
  * `import.schema.js` (`.d.ts`): Deterministic validation and normalization for `.CSV` and `.XLSX` payroll and salary band rows with user-friendly missing-column error reporting (RNF-003).
  * `session.schema.js` (`.d.ts`): Structural validation for local `.json` project session files (RF-008).
* `src/utils/`:
  * `normalizers.js` (`.d.ts`): Header key normalization, currency/level parsing, and `hasNoPersonalIdentifiers()` PII guard for AI requests.
  * `formatters.js` (`.d.ts`): Currency, percentage, and avatar initials formatters.
