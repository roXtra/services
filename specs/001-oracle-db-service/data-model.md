# Data Model: Oracle Database ServiceTask

**Feature**: `001-oracle-db-service` **Date**: 2026-03-17

## Entities

### OracleConnection

Represents the parameters needed to establish a database session.

| Field       | Type   | Required | Validation                      | Notes                               |
| ----------- | ------ | -------- | ------------------------------- | ----------------------------------- |
| server      | string | Yes      | Non-empty                       | Oracle DB hostname or IP            |
| port        | string | Yes      | Non-empty, parseable as integer | Default: 1521                       |
| username    | string | Yes      | Non-empty                       | Oracle DB user                      |
| password    | string | Yes      | Non-empty                       | Supports `secret['key']` references |
| serviceName | string | Yes      | Non-empty                       | Oracle service name (not SID)       |
| useTls      | string | No       | `"true"` or `"false"`           | Default: `"false"` (plain TCP)      |

**Connection string derivation**:

```
useTls === "true"  → "tcps://{server}:{port}/{serviceName}"
useTls === "false" → "{server}:{port}/{serviceName}"
```

### ServiceMethodConfig (executeQuery)

| Field       | Type            | Required | Notes                                                         |
| ----------- | --------------- | -------- | ------------------------------------------------------------- |
| server      | string          | Yes      | From OracleConnection                                         |
| port        | string          | Yes      | From OracleConnection                                         |
| username    | string          | Yes      | From OracleConnection                                         |
| password    | string          | Yes      | From OracleConnection                                         |
| serviceName | string          | Yes      | From OracleConnection                                         |
| useTls      | string          | No       | From OracleConnection                                         |
| query       | string          | Yes      | SQL query with optional `field['...']` / `role['...']` tokens |
| targetField | string (select) | Yes      | Process field name to write the result into                   |

### ServiceMethodConfig (executeQueryNoReturn)

Same as `executeQuery` minus `targetField`.

### QueryResult

| Field        | Type                             | Notes                                                       |
| ------------ | -------------------------------- | ----------------------------------------------------------- |
| rows         | `Array<Record<string, unknown>>` | Returned by `connection.execute()` with `OUT_FORMAT_OBJECT` |
| metaData     | `Array<{ name: string }>`        | Column metadata                                             |
| rowsAffected | number                           | For DML statements                                          |

Only `rows[0].result` is extracted and written to the target field (consistent with MSSQL/MySQL).

## Relationships

```
ServiceMethodConfig ──contains──▶ OracleConnection parameters
ServiceMethodConfig ──references──▶ Process field (targetField)
executeQuery() ──produces──▶ QueryResult ──maps to──▶ Process field value
executeQueryNoReturn() ──produces──▶ (no output; DML committed)
```

## State Transitions

N/A — stateless service. Each invocation is an independent connection lifecycle:

```
IDLE → CONNECTING → EXECUTING → CLOSING → DONE
                                         ↘ ERROR → CLOSING → DONE
```

## Validation Rules

1. All OracleConnection fields (server, port, username, password, serviceName) MUST be non-empty strings — validated before any connection attempt.
2. `query` MUST be a non-empty string — validated before connection attempt.
3. `targetField` MUST be a non-empty string for `executeQuery` — validated before connection attempt.
4. `port` MUST be parseable as an integer.
5. `password` may contain `secret['key']` references — resolved via `replaceObjectReferences()` before use.
6. `useTls` defaults to `"false"` if not provided.
