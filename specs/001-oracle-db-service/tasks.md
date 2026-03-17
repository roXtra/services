# Tasks: Oracle Database ServiceTask

**Input**: Design documents from `/specs/001-oracle-db-service/` **Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md,
contracts/

**Tests**: Unit tests (`.roxtest.ts` bundle test) and Cypress E2E tests are REQUIRED per constitution principle II (Test-First) and FR-009.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single service directory: `oracle/` at repository root (matching `mssql/`, `mysql/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — create the `oracle/` service directory with all boilerplate and config files required by every user story.

- [ ] T001 Create `oracle/package.json` with dependencies (`oracledb`, `processhub-sdk`, `react`, `react-dom`, `chai`) and devDependencies (`@types/oracledb`, `@types/mocha`,
      `@types/node`, `@types/react`, `typescript`, `mocha`, `ts-loader`, `webpack`, `webpack-cli`, `bestzip`, `copyfiles`, `cross-env`, `eslint`), engines `node: 22, npm: 10`
      in `oracle/package.json`
- [ ] T002 [P] Create `oracle/tsconfig.json` with `strict: true`, target ES2022, module NodeNext, jsx react-jsx, matching MSSQL/MySQL pattern in `oracle/tsconfig.json`
- [ ] T003 [P] Create `oracle/tsconfig-webpack.json` extending `../tsconfig-webpack.json` with `files: ["main.ts"]` in `oracle/tsconfig-webpack.json`
- [ ] T004 [P] Create `oracle/service.json` with two actions (`executeQuery`, `executeQueryNoReturn`) and field definitions per service contract in `oracle/service.json`.
      Note: includes explicit `port` field (following MySQL pattern, not MSSQL which has no port field)
- [ ] T005 [P] Create `oracle/configtemplate.json` with `{ "secret": { "password": "" } }` in `oracle/configtemplate.json`
- [ ] T006 [P] Create `oracle/main.ts` re-exporting all config and service modules in `oracle/main.ts`
- [ ] T007 [P] Create `oracle/.npmignore` and `oracle/.npmrc` matching MSSQL/MySQL pattern in `oracle/.npmignore` and `oracle/.npmrc`

**Checkpoint**: `oracle/` directory exists with all boilerplate files. `npm install` succeeds. Webpack can resolve `main.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Bundle test file that verifies all exports — MUST exist before any service/config implementation so the Test-First cycle can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T008 Create `oracle/oracleservice.roxtest.ts` bundle test verifying that `executeQuery`, `executeQueryConfig`, `executeQueryNoReturn`, and `executeQueryNoReturnConfig`
      are exported as functions (Mocha + Chai, matching MSSQL pattern) in `oracle/oracleservice.roxtest.ts`

**Checkpoint**: Bundle test exists and FAILS (exports not yet implemented). Red phase of Red-Green-Refactor confirmed.

---

## Phase 3: User Story 1 — Execute Query with Result (Priority: P1) 🎯 MVP

**Goal**: A process designer can run a SELECT query against an Oracle database and have the first row's `result` value written to a process field.

**Independent Test**: Configure a service task with valid Oracle connection, run a SELECT returning a `result` column, verify the process field is populated.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [US1] Verify `oracleservice.roxtest.ts` includes assertion for `executeQuery` export type `"function"` in `oracle/oracleservice.roxtest.ts` (already created in
      T008, validate it covers US1)

### Implementation for User Story 1

- [ ] T010 [US1] Implement `executeQuery` service method in `oracle/executequery-service.ts`: extract config fields (server, port, username, password, serviceName, useTls,
      query, targetField), validate all required fields, resolve password secrets via `replaceObjectReferences`, build connect string using TLS logic
      (`useTls === "true" ? "tcps://" : ""` + `{server}:{port}/{serviceName}` — see research.md R5), create connection via
      `oracledb.getConnection({ user, password, connectString })`, substitute `field['...']`/`role['...']` tokens via `parseAndInsertStringWithFieldContent`, execute query
      with `{ outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true }`, if rows returned write `rows[0].result` to target field and update instance, close connection in
      `finally` block, log errors via `console.error` and throw `BpmnError(DB_ERROR)` on failure
- [ ] T011 [US1] Verify bundle test passes for `executeQuery` and `executeQueryConfig` exports — run `npm test` in `oracle/`

**Checkpoint**: User Story 1 is fully functional. `executeQuery` connects to Oracle, runs SELECT, writes result to process field. Bundle test passes for US1 exports.

---

## Phase 4: User Story 2 — Execute Query without Result (Priority: P2)

**Goal**: A process designer can run DML statements (INSERT, UPDATE, DELETE) against an Oracle database without returning results.

**Independent Test**: Configure a service task with valid Oracle connection, run an INSERT, verify data change in database. Invalid queries throw `DB_ERROR`.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T012 [US2] Verify `oracleservice.roxtest.ts` includes assertion for `executeQueryNoReturn` export type `"function"` in `oracle/oracleservice.roxtest.ts` (already created
      in T008, validate it covers US2)

### Implementation for User Story 2

- [ ] T013 [US2] Implement `executeQueryNoReturn` service method in `oracle/executequerynoreturn-service.ts`: import `ErrorCodes` from `./executequery-service.js`, extract
      config fields (server, port, username, password, serviceName, useTls, query — no targetField), validate all required fields, resolve password secrets, build connect
      string using TLS logic (`useTls === "true" ? "tcps://" : ""` + `{server}:{port}/{serviceName}`), create connection, substitute tokens, execute query with
      `{ autoCommit: true }`, skip result extraction, close connection in `finally` block, log errors via `console.error` and throw `BpmnError(ErrorCodes.DB_ERROR)` on failure
- [ ] T014 [US2] Verify bundle test passes for `executeQueryNoReturn` and `executeQueryNoReturnConfig` exports — run `npm test` in `oracle/`

**Checkpoint**: User Stories 1 AND 2 work independently. Both service methods connect, execute, handle errors, and close connections correctly.

---

## Phase 5: User Story 3 — Service Configuration UI (Priority: P3)

**Goal**: A process designer sees a consistent, German-labelled configuration form for both Oracle service methods, with inline help and secret support.

**Independent Test**: Open service config UI, verify all fields render with correct labels, check help text shows query syntax examples.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [US3] Verify `oracleservice.roxtest.ts` includes assertions for `executeQueryConfig` and `executeQueryNoReturnConfig` export types `"function"` in
      `oracle/oracleservice.roxtest.ts` (already created in T008, validate it covers US3)

### Implementation for User Story 3

- [ ] T016 [P] [US3] Implement `executeQueryConfig` React component in `oracle/executequery-config.tsx`: render form inputs for Server, Port, Benutzername, Passwort, Service
      Name, TLS (checkbox, default unchecked), Abfrage (with query syntax help text showing `field['...']`, `role['...']`, `secret['...']` examples), and Ergebnis (target
      field select) — German labels matching MSSQL/MySQL config pattern
- [ ] T017 [P] [US3] Implement `executeQueryNoReturnConfig` React component in `oracle/executequerynoreturn-config.tsx`: same form as `executeQueryConfig` minus the Ergebnis
      (target field) selector, add error documentation noting `DB_ERROR` may occur — German labels matching MSSQL `executeQueryNoReturn` config pattern
- [ ] T018 [US3] Verify bundle test passes for all 4 exports — run `npm test` in `oracle/`

**Checkpoint**: All 3 user stories are independently functional. Config UI renders correctly. All bundle tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, final integration checks, documentation.

- [ ] T019 Run `npm install` in `oracle/` and verify zero dependency errors
- [ ] T020 Run `npm run buildbundle` from repository root and verify `oracle/` service is included in `services.zip` output. Confirm `buildScript.js` auto-discovers the
      `oracle/` directory; if not, add it to the build manifest
- [ ] T021 Run ESLint and Prettier checks on all `oracle/` source files and fix any violations
- [ ] T022 Verify `oracle/service.json` action field definitions match implemented config field keys exactly
- [ ] T023 Run quickstart.md validation: walk through build → install → configure → verify flow described in `specs/001-oracle-db-service/quickstart.md`
- [ ] T024 [US3] Create Cypress E2E smoke test for the Oracle service configuration UI: verify that the `executeQuery` config form renders all expected fields (Server, Port,
      Benutzername, Passwort, Service Name, TLS, Abfrage, Ergebnis) and the `executeQueryNoReturn` form renders the same fields minus Ergebnis. Requires a running roXtra test
      instance — if unavailable, document deferral reason and create a placeholder test spec

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001–T007) — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase (T008) completion
  - US1 (Phase 3) can start after T008
  - US2 (Phase 4) can start after T008 — independent of US1
  - US3 (Phase 5) can start after T008 — independent of US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete (T009–T018)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — independent of US1 but may reuse `ErrorCodes` enum from `executequery-service.ts`
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — independent of US1/US2 (config UIs are standalone React components)

### Within Each User Story

- Tests MUST exist and FAIL before implementation begins
- Service logic before integration verification
- Bundle test verification after implementation

### Parallel Opportunities

- All Setup tasks marked [P] (T002–T007) can run in parallel after T001
- US1, US2, US3 can all start in parallel once T008 is complete (if team capacity allows)
- T016 and T017 (config UI components) are marked [P] — can run in parallel within US3
- Sequential order recommended for solo developer: Phase 1 → Phase 2 → US1 → US2 → US3 → Phase 6

---

## Parallel Example: User Story 1

```text
T001 (package.json)
  ├── T002 (tsconfig.json)         ─┐
  ├── T003 (tsconfig-webpack.json) ─┤
  ├── T004 (service.json)          ─┤── All parallel after T001
  ├── T005 (configtemplate.json)   ─┤
  ├── T006 (main.ts)              ─┤
  └── T007 (.npmignore/.npmrc)     ─┘
       └── T008 (bundle test)
            └── T009 (verify test covers US1)
                 └── T010 (implement executeQuery)
                      └── T011 (verify tests pass)
```

---

## Implementation Strategy

**MVP**: User Story 1 alone (Phase 1 + Phase 2 + Phase 3) delivers a functional Oracle SELECT service usable in BPMN processes.

**Incremental delivery**:

1. MVP — `executeQuery` works end-to-end ← **demo-ready**
2. - US2 — `executeQueryNoReturn` adds DML support ← **feature-complete**
3. - US3 — Config UIs provide designer-friendly forms ← **user-ready**
4. - Polish — Build pipeline, lint, quickstart validation ← **release-ready**
