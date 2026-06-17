<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (MAJOR — initial ratification)

  Modified principles: N/A (initial version)

  Added sections:
    - Core Principles (6 principles)
    - Technology & Compliance Constraints
    - Development Workflow & Quality Gates
    - Governance

  Removed sections: N/A

  Templates requiring updates:
    - .specify/templates/plan-template.md        ✅ no update needed (dynamic Constitution Check)
    - .specify/templates/spec-template.md         ✅ no update needed (generic placeholders)
    - .specify/templates/tasks-template.md        ✅ no update needed (generic placeholders)
    - .specify/templates/checklist-template.md    ✅ no update needed (generic placeholders)

  Follow-up TODOs: none
-->

# ProcessHub BPMN Services Constitution

## Core Principles

### I. BPMN-Compliance

All process definitions MUST conform to the BPMN 2.0 notation standard.

- Process models MUST use only BPMN 2.0 elements (events, gateways, tasks, sequence flows, pools, lanes).
- Proprietary extensions to the notation are NOT permitted unless explicitly approved and documented in this constitution.
- Every process model MUST be parseable and renderable by any BPMN 2.0-compliant engine or viewer.

**Rationale**: Standardised notation guarantees interoperability, tooling compatibility, and a shared visual language across teams.

### II. Test-First (NON-NEGOTIABLE)

Every feature MUST be covered by both unit tests and Cypress E2E tests before it is considered complete.

- Unit tests (`.roxtest.ts` / Mocha + Chai) MUST exist for every service method, model transformation, and utility function.
- Cypress tests MUST cover critical user journeys: process creation, instance start/stop, state transitions, and audit trail viewing.
- Red-Green-Refactor cycle: write failing tests first, then implement until tests pass, then refactor.
- No pull request may be merged with declining test coverage.

**Rationale**: Dual-layer testing catches regressions at both the logic level (unit) and the interaction level (E2E), reducing production defects.

### III. Audit Trail (NON-NEGOTIABLE)

Every state change of a process definition or process instance MUST produce an immutable audit record.

- Audit records MUST capture: timestamp (ISO 8601), actor (user ID), action (create/update/delete/transition), entity type (process | instance), entity ID, previous state, and
  new state.
- Audit records MUST NOT be editable or deletable through the application layer.
- The audit trail MUST be queryable by entity, actor, time range, and action type.
- Retention policy MUST comply with the organisation's data governance rules.

**Rationale**: Traceability of every change is a regulatory and operational requirement for process management systems.

### IV. Service Architecture

All modules MUST follow the established ProcessHub service structure and conventions.

- Each service resides in its own directory with `main.ts`, `service.json`, `package.json`, `tsconfig.json`, and at least one `*-config.tsx` and `*-service.ts` file.
- Services MUST be independently buildable via the shared `webpack.config.mjs` and `buildScript.js` pipeline.
- Service configuration secrets MUST use `config.json` (from `configtemplate.json`) and the `secret['key']` convention.
- Shared logic MUST be consumed from `processhub-sdk`; duplicating SDK functionality inside a service is prohibited.

**Rationale**: Uniform structure enables automated builds, consistent deployments, and fast onboarding of new contributors.

### V. Type Safety

TypeScript strict mode MUST be enabled for all service code.

- `strict: true` in every service's `tsconfig.json`.
- `any` types are prohibited except where strictly required by third-party library boundaries; each usage MUST include a justifying comment.
- All public API boundaries (service methods, config types) MUST have explicit type annotations.

**Rationale**: Strong typing catches a large class of errors at compile time and serves as living documentation of contracts.

### VI. Simplicity

Start simple. YAGNI (You Aren't Gonna Need It) applies at every level.

- Implement only what is specified—no speculative features, extra configurability, or premature abstractions.
- Prefer flat, readable code over deep inheritance hierarchies.
- Complexity MUST be justified in a PR description when it exceeds the minimum needed solution.

**Rationale**: Unnecessary complexity increases maintenance burden, slows reviews, and introduces hidden defect surface area.

## Technology & Compliance Constraints

- **Runtime**: Node.js 22, npm 10.
- **Language**: TypeScript (strict mode) with React for config UIs.
- **SDK**: `processhub-sdk` — version MUST match the target roXtra release.
- **Build**: Webpack via `webpack.config.mjs` and `buildScript.js`.
- **Unit Testing**: Mocha + Chai (`.roxtest.ts` convention).
- **E2E Testing**: Cypress for all user-facing workflows.
- **Linting/Formatting**: ESLint (`eslint.config.js`) + Prettier.
- **BPMN Engine**: MUST support BPMN 2.0 standard elements; engine choice documented in the implementation plan.
- **Audit Storage**: Audit records MUST be persisted in a tamper-evident store; implementation details determined per deployment (database, append-only log, etc.).

## Development Workflow & Quality Gates

1. **Spec → Plan → Tasks → Implement** — follow the SpecKit workflow; no implementation without an approved spec.
2. **Quality gates before merge**:
   - All unit tests pass (`npm test` / roxtest runner).
   - All Cypress E2E tests pass for affected user journeys.
   - ESLint and Prettier report zero violations.
   - Audit trail coverage verified for new state transitions.
   - `npm run buildbundle` succeeds without errors.
3. **Code review** — at least one reviewer MUST verify compliance with this constitution before merge approval.
4. **Version alignment** — `processhub-sdk` version MUST match the target roXtra version; mismatches block the release.

## Governance

This constitution supersedes all other project practices and conventions. In case of conflict, the constitution wins.

- **Amendments** require: (1) a written proposal describing the change, (2) approval by at least one project maintainer, and (3) a migration plan for existing code if the
  change is backward-incompatible.
- **Versioning** follows Semantic Versioning:
  - MAJOR — principle removed or redefined in a backward-incompatible way.
  - MINOR — new principle or section added, or material expansion of existing guidance.
  - PATCH — clarifications, typo fixes, non-semantic wording changes.
- **Compliance review** — every pull request MUST include a brief constitution-compliance note confirming adherence to all applicable principles.

**Version**: 1.0.0 | **Ratified**: 2026-03-17 | **Last Amended**: 2026-03-17
