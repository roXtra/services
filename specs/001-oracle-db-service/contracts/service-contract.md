# Service Contract: Oracle Database ServiceTask

**Feature**: `001-oracle-db-service` **Date**: 2026-03-17

## service.json — Action Definitions

The Oracle service exposes two actions via `service.json`, consumed by the roXtra BPMN engine.

```json
{
  "id": "oracle-service",
  "name": "Oracle Service",
  "minRoXtraVersion": "8.009.0",
  "actions": [
    {
      "id": "executeQuery",
      "label": "Abfrage ausführen",
      "configMethod": "executeQueryConfig",
      "settings": "main.mjs",
      "serviceFile": "main.mjs",
      "serviceMethod": "executeQuery",
      "fields": [
        { "name": "server", "type": "text" },
        { "name": "port", "type": "text" },
        { "name": "username", "type": "text" },
        { "name": "password", "type": "text" },
        { "name": "serviceName", "type": "text" },
        { "name": "useTls", "type": "text" },
        { "name": "query", "type": "text" },
        { "name": "targetField", "type": "select", "onload": "fields" }
      ]
    },
    {
      "id": "executeQueryNoReturn",
      "label": "Abfrage ohne Return ausführen",
      "configMethod": "executeQueryNoReturnConfig",
      "settings": "main.mjs",
      "serviceFile": "main.mjs",
      "serviceMethod": "executeQueryNoReturn",
      "fields": [
        { "name": "server", "type": "text" },
        { "name": "port", "type": "text" },
        { "name": "username", "type": "text" },
        { "name": "password", "type": "text" },
        { "name": "serviceName", "type": "text" },
        { "name": "useTls", "type": "text" },
        { "name": "query", "type": "text" }
      ]
    }
  ]
}
```

## TypeScript Exports — main.ts

```typescript
// Re-exports all config and service modules
export * from "./executequery-config.js";
export * from "./executequery-service.js";
export * from "./executequerynoreturn-config.js";
export * from "./executequerynoreturn-service.js";
```

## Service Method Signatures

### executeQuery

```typescript
export async function executeQuery(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean>;
```

**Input**: BPMN service task environment with configured fields (server, port, username, password, serviceName, useTls, query, targetField).

**Behaviour**:

1. Extracts & validates all config fields
2. Resolves `secret['...']` references in password
3. Builds connect string: `[tcps://]{server}:{port}/{serviceName}`
4. Creates connection via `oracledb.getConnection()`
5. Substitutes `field['...']` and `role['...']` tokens in query
6. Executes query via `connection.execute(query, [], { outFormat: OUT_FORMAT_OBJECT, autoCommit: true })`
7. If rows returned: writes `rows[0].result` to target field, updates instance
8. Closes connection in `finally` block

**Output**: `true` on success

**Errors**: Throws `BpmnError("DB_ERROR", message)` on any failure

### executeQueryNoReturn

```typescript
export async function executeQueryNoReturn(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean>;
```

**Input**: BPMN service task environment with configured fields (server, port, username, password, serviceName, useTls, query). No `targetField`.

**Behaviour**: Same as `executeQuery` steps 1–6, but skips step 7 (no result extraction).

**Output**: `true` on success

**Errors**: Throws `BpmnError("DB_ERROR", message)` on any failure

## Config UI Methods

### executeQueryConfig

```typescript
export function executeQueryConfig(config: IServiceTaskConfig): JSX.Element;
```

Renders a React form with fields: Server, Port, Benutzername, Passwort, Service Name, TLS (Checkbox), Abfrage, Ergebnis (select).

### executeQueryNoReturnConfig

```typescript
export function executeQueryNoReturnConfig(config: IServiceTaskConfig): JSX.Element;
```

Same form as `executeQueryConfig` without the Ergebnis (target field) selector.

## Error Contract

| Error Code     | Trigger                                        | Message Format                                                |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| `DB_ERROR`     | Any `oracledb` error during connect or execute | `String(ex)` — includes Oracle error code (e.g., `ORA-00942`) |
| (thrown Error) | Missing required config field                  | `"{field} is undefined, cannot proceed with service!"`        |

## configtemplate.json

```json
{
  "secret": {
    "password": ""
  }
}
```
