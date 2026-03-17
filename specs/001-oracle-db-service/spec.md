# Feature Specification: Oracle Database ServiceTask

**Feature Branch**: `001-oracle-db-service` **Created**: 2026-03-17 **Status**: Draft **Input**: User description: "Erstelle einen neuen ServiceTask zur Anbindung von
Oracle-Datenbanken, ausgerichtet an den bestehenden ServiceTasks für MS SQL und MySQL (gleicher Tech-Stack, Coding-Guidelines, Ordnerstruktur, Telemetrie, Fehler- und
Rückgabemuster)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Execute Query with Result (Priority: P1)

A process designer configures a BPMN service task to run a SELECT query against an Oracle database. The query result is written back into a designated process field so that
subsequent process steps can use the retrieved data.

**Why this priority**: This is the core use case — reading data from Oracle into a running process instance. Without it, the service has no value.

**Independent Test**: Can be fully tested by configuring a service task with valid Oracle connection details, running a SELECT query that returns a single-column `result` row,
and verifying the process field is populated with the returned value.

**Acceptance Scenarios**:

1. **Given** a BPMN process with an Oracle `executeQuery` service task configured with valid connection details and a SELECT query, **When** the service task executes,
   **Then** the first row's `result` column value is written to the configured target field on the process instance.
2. **Given** a configured Oracle `executeQuery` service task whose SELECT returns zero rows, **When** the service task executes, **Then** the target field remains unchanged
   and the task completes without error.
3. **Given** a configured Oracle `executeQuery` service task with query tokens (`field['...']`, `role['...']`), **When** the service task executes, **Then** tokens are
   substituted with actual field/role values before execution.
4. **Given** a configured Oracle `executeQuery` service task whose password references a secret (`secret['password']`), **When** the service task executes, **Then** the
   password is resolved from `config.json` and never exposed in logs.

---

### User Story 2 — Execute Query without Result (Priority: P2)

A process designer configures a BPMN service task to run a DML statement (INSERT, UPDATE, DELETE) against an Oracle database without returning results to the process instance.

**Why this priority**: Many process automations write data (e.g., status updates, audit inserts) without needing a return value. This completes the read-write story and
mirrors the MSSQL `executeQueryNoReturn` method.

**Independent Test**: Can be fully tested by configuring a service task with valid Oracle connection details and an INSERT/UPDATE statement, executing it, and confirming the
data change in the database.

**Acceptance Scenarios**:

1. **Given** a BPMN process with an Oracle `executeQueryNoReturn` service task configured with valid connection details and an INSERT statement, **When** the service task
   executes, **Then** the row is inserted into the Oracle database and the task completes successfully.
2. **Given** a configured Oracle `executeQueryNoReturn` service task with an UPDATE statement using field tokens, **When** the service task executes, **Then** tokens are
   substituted and the database row is updated.
3. **Given** a configured Oracle `executeQueryNoReturn` service task whose query is syntactically invalid, **When** the service task executes, **Then** the task throws a
   `DB_ERROR` BPMN error with a descriptive message.

---

### User Story 3 — Service Configuration UI (Priority: P3)

A process designer uses the roXtra service configuration interface to set up Oracle connection parameters (server, port, username, password, database/service name, query,
target field) with inline help and secret support — matching the look and feel of the existing MSSQL and MySQL configuration screens.

**Why this priority**: Usability for the designer; a consistent configuration experience reduces training effort and support requests.

**Independent Test**: Can be verified by opening the service configuration UI, confirming all expected input fields render correctly, and that the help text/syntax examples
match Oracle conventions.

**Acceptance Scenarios**:

1. **Given** a process designer opens the Oracle `executeQuery` service task configuration, **When** the form loads, **Then** input fields for Server, Port, Username,
   Password, Database (Service Name), Query, and Target Field are displayed with German labels consistent with the MSSQL/MySQL services.
2. **Given** a process designer opens the Oracle `executeQueryNoReturn` service task configuration, **When** the form loads, **Then** the same fields appear except the Target
   Field, matching the MSSQL `executeQueryNoReturn` pattern.
3. **Given** a process designer enters `secret['password']` in the password field, **When** the service executes, **Then** the password is resolved from the server-side
   `config.json` without being exposed.

---

### Edge Cases

- What happens when the Oracle server is unreachable or the connection times out? — The service MUST throw a `DB_ERROR` BPMN error with the connection-level error message.
- What happens when the configured Oracle user has insufficient privileges for the query? — The service MUST throw a `DB_ERROR` BPMN error with the privilege/permission error
  from Oracle.
- What happens when the query returns multiple rows? — Only the first row's `result` column is used (consistent with MSSQL/MySQL behaviour).
- What happens when the query returns a row but no `result` column alias? — Behaviour is undefined; documentation should instruct users to alias the desired column as
  `result`.
- What happens when required configuration fields are left blank? — The service MUST throw an error before attempting a database connection.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an `executeQuery` service method that connects to an Oracle database, runs a user-defined SQL query, and writes the first row's `result`
  value into a configurable process field.
- **FR-002**: System MUST provide an `executeQueryNoReturn` service method that connects to an Oracle database and runs a user-defined DML statement without returning results.
- **FR-003**: Both methods MUST substitute `field['FieldName']` and `role['LaneName']` tokens in the query string with actual process-instance values before execution.
- **FR-004**: Both methods MUST support password resolution from a server-side `config.json` via the `secret['key']` syntax.
- **FR-005**: Both methods MUST throw a BPMN error with code `DB_ERROR` and a descriptive message on any database or connection failure.
- **FR-006**: Both methods MUST validate that all required configuration fields (server, username, password, database/service name, query) are defined before attempting a
  connection.
- **FR-007**: The configuration UI MUST expose input fields for Server, Port, Username, Password, Database (Service Name), and Query — plus a Target Field selector for
  `executeQuery`.
- **FR-008**: The service directory MUST include a `configtemplate.json` with a `secret.password` placeholder, matching the MSSQL/MySQL pattern.
- **FR-009**: The service MUST follow the established ProcessHub service directory structure: `main.ts`, `service.json`, `package.json`, `tsconfig.json`,
  `tsconfig-webpack.json`, config/service TypeScript files, and a `.roxtest.ts` bundle test file.
- **FR-010**: The connection to the Oracle database MUST be reliably closed after each execution, even if the query fails.

### Key Entities

- **Oracle Connection**: Represents the set of parameters needed to establish a database session — server hostname/IP, port, username, password, and database or service name.
- **Service Method Configuration**: The user-facing configuration for each service method — query text, token references, target field (for `executeQuery`), and secret
  references.
- **Query Result**: The single-row, single-column (`result`) value returned from a SELECT query and written to a process field.

## Assumptions

- The Oracle driver will follow the same Node.js ecosystem conventions (npm package, TypeScript type definitions) as the existing `mssql` and `mysql2` drivers.
- Oracle connection strings use a host + port + service-name pattern (the most common configuration); TNS-based connections are out of scope for the initial version.
- The `result` column alias convention (query must alias the desired return value as `result`) is carried over from MSSQL/MySQL and does not need to change.
- Error codes and BPMN error patterns (`BpmnError`, `ErrorCodes.DB_ERROR`) are already available in the `processhub-sdk` and will be reused.
- German-language labels in the configuration UI are the default, consistent with existing services.
- The service will support Oracle Database 19c and later (current long-term support releases).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A process designer can configure and execute an Oracle SELECT query from a BPMN service task and see the result written to a process field within the same
  interaction time as the existing MSSQL/MySQL services.
- **SC-002**: A process designer can configure and execute an Oracle INSERT/UPDATE/DELETE from a BPMN service task and confirm the data change in the database.
- **SC-003**: 100 % of required configuration fields are validated before a connection attempt; missing fields produce a clear error message without contacting the database.
- **SC-004**: All database and connection errors surface as `DB_ERROR` BPMN errors with a human-readable description — no silent failures.
- **SC-005**: The Oracle service passes a bundle test (`.roxtest.ts`) verifying that all exported methods are callable, matching the test pattern of existing services.
- **SC-006**: The Oracle service builds successfully via the shared `buildScript.js` / Webpack pipeline and is included in the `services.zip` release artefact.
