# Implementation Plan: Oracle Database ServiceTask

**Branch**: `001-oracle-db-service` | **Date**: 2026-03-17 | **Spec**: [spec.md](spec.md) **Input**: Feature specification from `/specs/001-oracle-db-service/spec.md`

## Summary

New ProcessHub service providing Oracle database connectivity via two BPMN service-task methods (`executeQuery` and `executeQueryNoReturn`). Uses `oracledb` in thin mode (pure
JS) with single-connection-per-call strategy, optional TLS toggle, and full alignment to existing MSSQL/MySQL service patterns (same directory structure, error handling,
config UI, build pipeline).

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js 22 / npm 10 **Primary Dependencies**: `oracledb` (thin mode, pure JS), `processhub-sdk` (v9.135.0), React 18 (config
UI), Chai (assertions) **Storage**: Oracle Database 19c+ (external, accessed via `oracledb` driver) **Testing**: Mocha + Chai (`.roxtest.ts` bundle test); Cypress E2E (for
configuration UI journey) **Target Platform**: Windows Server (roXtra application server), Node.js 22 **Project Type**: ProcessHub service module (BPMN service task plugin)
**Performance Goals**: Same interaction time as existing MSSQL/MySQL services (single-digit seconds per query execution) **Constraints**: Zero native dependencies (thin mode
only); single connection per call; Oracle 19c+ only **Scale/Scope**: Single service directory (~10 source files), 2 service methods, 1 bundle test file

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Principle                    | Applies? | Status  | Notes                                                                               |
| --- | ---------------------------- | -------- | ------- | ----------------------------------------------------------------------------------- |
| I   | BPMN-Compliance              | Yes      | ✅ PASS | Service integrates as a BPMN 2.0 service task via `service.json` action definitions |
| II  | Test-First (NON-NEGOTIABLE)  | Yes      | ✅ PASS | Bundle test (`.roxtest.ts`) specified in FR-009; Cypress E2E for config UI          |
| III | Audit Trail (NON-NEGOTIABLE) | No       | ✅ N/A  | Service executes queries on external DB; no internal state transitions to audit     |
| IV  | Service Architecture         | Yes      | ✅ PASS | FR-009 mandates standard directory structure; FR-008 mandates `configtemplate.json` |
| V   | Type Safety                  | Yes      | ✅ PASS | `strict: true` in `tsconfig.json`; explicit types on all public APIs                |
| VI  | Simplicity                   | Yes      | ✅ PASS | Single connection per call; no pooling; no TNS/SID; minimal file count              |

**Gate result: PASS** — all applicable principles satisfied; no violations to justify.

### Post-Design Re-Check (after Phase 1)

| #   | Principle            | Status  | Post-Design Notes                                                        |
| --- | -------------------- | ------- | ------------------------------------------------------------------------ |
| I   | BPMN-Compliance      | ✅ PASS | `service.json` contract defines standard BPMN service task actions       |
| II  | Test-First           | ✅ PASS | `oracleservice.roxtest.ts` verifies 4 exports; Cypress E2E for config UI |
| III | Audit Trail          | ✅ N/A  | Stateless external-DB service; no internal state transitions             |
| IV  | Service Architecture | ✅ PASS | Directory matches MSSQL/MySQL exactly                                    |
| V   | Type Safety          | ✅ PASS | `strict: true`; `oracledb` + `@types/oracledb` types                     |
| VI  | Simplicity           | ✅ PASS | Single connection per call; flat structure; no abstractions              |

**Post-design gate result: PASS** — no new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-oracle-db-service/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
oracle/
├── main.ts                             # Re-exports all config + service modules
├── service.json                        # Service metadata & action definitions
├── package.json                        # Dependencies (oracledb, processhub-sdk, react)
├── tsconfig.json                       # TypeScript strict config
├── tsconfig-webpack.json               # Webpack TS config (extends root)
├── configtemplate.json                 # Secret placeholder template
├── executequery-config.tsx             # Config UI for executeQuery
├── executequery-service.ts             # Service logic for executeQuery
├── executequerynoreturn-config.tsx     # Config UI for executeQueryNoReturn
├── executequerynoreturn-service.ts     # Service logic for executeQueryNoReturn
├── oracleservice.roxtest.ts            # Bundle test (Mocha + Chai)
├── .npmignore
└── .npmrc
```

**Structure Decision**: Single service directory at repository root (`oracle/`), matching existing services (`mssql/`, `mysql/`). No sub-directories needed — all files are at
the same level, consistent with the established convention.

## Complexity Tracking

No violations — table not needed.
