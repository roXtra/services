# Research: Oracle Database ServiceTask

**Feature**: `001-oracle-db-service` **Date**: 2026-03-17

## R1 — Oracle Driver Choice

**Decision**: `oracledb` npm package (v6.x, latest stable)

**Rationale**:

- Official Oracle-maintained Node.js driver
- Thin mode (default since v6.0) is pure JavaScript — zero native dependencies
- Ships TypeScript type definitions; `@types/oracledb` also available as alternative
- Tested with Node.js 22; Apache-2.0 / UPL-1.0 dual-licensed
- Supports Oracle Database 12.1+ in thin mode (our target: 19c+)

**Alternatives considered**:

- `node-oracledb` (same package, older name) — same library, now published as `oracledb`
- Generic ODBC drivers (`odbc`, `better-odbc`) — require native compilation, no thin mode, poor TS support
- `typeorm` with Oracle driver — adds ORM layer not needed; existing services use raw SQL

## R2 — Thin Mode vs Thick Mode

**Decision**: Thin mode only (default, no code needed to enable)

**Rationale**:

- Thin mode is the default in `oracledb` v6+; `oracledb.thin === true` by default
- Zero native dependencies — matches deployment simplicity of `mssql` and `mysql2`
- Covers all standard SQL query operations required by the spec
- No `oracledb.initOracleClient()` call needed

**Alternatives considered**:

- Thick mode — requires Oracle Instant Client installed on every roXtra application server; rejected per clarification

## R3 — Connection Strategy

**Decision**: Single connection per call (create → execute → close)

**Rationale**:

- Matches MySQL service pattern
- Each BPMN service task fires independently; no session reuse needed
- Avoids pool lifecycle complexity (idle timeout, max connections, draining)
- `oracledb.getConnection()` + `connection.close()` is efficient for thin mode

**Alternatives considered**:

- Connection pool (`oracledb.createPool()`) — used by MSSQL via `database.ts`; rejected per clarification as unnecessary complexity

## R4 — Connection String Format

**Decision**: Easy Connect syntax: `host:port/serviceName` (plain TCP) or `tcps://host:port/serviceName` (TLS)

**Rationale**:

- Easy Connect is Oracle's recommended lightweight format for thin mode
- Supports service name only (not SID) — aligns with clarification decision
- Default Oracle port is 1521
- TLS variant uses `tcps://` protocol prefix

**Alternatives considered**:

- Full Connect Descriptor (`(DESCRIPTION=(ADDRESS=(...))...)`) — verbose, error-prone for UI input
- TNS name lookup (`tnsnames.ora`) — requires config directory, out of scope per spec

## R5 — TLS Toggle Implementation

**Decision**: Config UI boolean toggle; when enabled, connect string uses `tcps://` prefix

**Rationale**:

- `oracledb` thin mode supports `tcps://host:port/serviceName` natively
- No certificate configuration needed for basic TLS (server-side cert only)
- Matches simplicity principle — single toggle, no additional cert fields in v1

**Implementation pattern**:

```typescript
const protocol = useTls ? "tcps://" : "";
const connectString = `${protocol}${server}:${port}/${serviceName}`;
```

**Alternatives considered**:

- mTLS with wallet — requires `walletLocation` and `walletPassword` fields; too complex for v1
- No TLS at all — rejected per clarification; user needs the option

## R6 — Error Handling Pattern

**Decision**: `console.error` + `BpmnError(ErrorCodes.DB_ERROR, ...)` on all failures

**Rationale**:

- Matches MySQL service pattern (log then throw)
- `oracledb` errors expose `message`, `code` (e.g., `"ORA-00942"`), `errorNum`, `offset`
- `String(ex)` captures the Oracle error message for the BPMN error payload
- Connection close errors in `finally` block are logged but not re-thrown

**Implementation pattern**:

```typescript
try {
  connection = await oracledb.getConnection({...});
  // ... execute ...
} catch (ex) {
  console.error(`Oracle service error: ${JSON.stringify(ex)}`);
  throw new BpmnError(ErrorCodes.DB_ERROR, String(ex));
} finally {
  if (connection) {
    try { await connection.close(); } catch (closeErr) {
      console.error(`Oracle service error closing connection: ${String(closeErr)}`);
    }
  }
}
```

## R7 — Query Execution & Result Mapping

**Decision**: Use `connection.execute()` with `outFormat: oracledb.OUT_FORMAT_OBJECT` and `autoCommit: true`

**Rationale**:

- `OUT_FORMAT_OBJECT` returns rows as `{ columnName: value }` objects — allows `rows[0].result` access (consistent with MSSQL pattern)
- `autoCommit: true` ensures DML statements are committed without explicit `connection.commit()`
- Result shape: `{ rows: Array<object>, metaData: Array, rowsAffected: number }`

**Mapping to existing pattern**:

- MSSQL: `pool.request().query<{ result: FieldValueType }>(query)` → `result.recordset[0].result`
- MySQL: `connection.query({ sql })` → `res[0]["result"]`
- Oracle: `connection.execute(query, [], { outFormat: OUT_FORMAT_OBJECT, autoCommit: true })` → `result.rows[0].result`

## R8 — TypeScript Types

**Decision**: Install `oracledb` (ships built-in types) + `@types/oracledb` as devDependency for stricter definitions

**Rationale**:

- The `oracledb` package includes type definitions
- `@types/oracledb` provides additional strict typing (optional but helpful)
- Consistent with how MSSQL uses `@types/mssql` as devDependency

## R9 — `autoCommit` Setting

**Decision**: Set `autoCommit: true` at the execute level for both methods

**Rationale**:

- `executeQueryNoReturn` runs DML (INSERT/UPDATE/DELETE) — must be committed
- `executeQuery` runs SELECT — autoCommit has no effect but is harmless
- Setting it at execute level (not global) avoids side effects
- MSSQL auto-commits by default; MySQL auto-commits by default; Oracle requires explicit opt-in

**Alternatives considered**:

- Global `oracledb.autoCommit = true` — affects all connections in the process; risky if other services share the runtime
- Explicit `connection.commit()` — works but adds an extra call; `autoCommit` option is cleaner
