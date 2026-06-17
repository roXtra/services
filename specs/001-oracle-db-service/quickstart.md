# Quickstart: Oracle Database ServiceTask

**Feature**: `001-oracle-db-service` **Date**: 2026-03-17

## Prerequisites

- Node.js 22, npm 10
- Access to an Oracle Database 19c+ instance with a known service name
- roXtra application server with the service installed

## 1. Build the Service

```bash
cd oracle/
npm install
cd ..
npm run buildbundle
```

The Oracle service zip is included in `services.zip`.

## 2. Install the Service

1. Extract `oracle/` from `services.zip`
2. Copy it to `Roxtra/eformulare/node_modules/@eformservice/` on the roXtra application server
3. (Optional) Copy `configtemplate.json` to `config.json` and fill in the password secret:
   ```json
   {
     "secret": {
       "password": "my-oracle-password"
     }
   }
   ```
4. Restart the roXtra EFormulare Windows Service

## 3. Configure in a BPMN Process

1. Open a process in roXtra and add a **Service Task**
2. Select **Oracle Service → Abfrage ausführen** (or **Abfrage ohne Return ausführen**)
3. Fill in the configuration fields:

| Field        | Example Value                                                           |
| ------------ | ----------------------------------------------------------------------- |
| Server       | `myoraclehost.example.com`                                              |
| Port         | `1521`                                                                  |
| Benutzername | `hr`                                                                    |
| Passwort     | `secret['password']`                                                    |
| Service Name | `ORCLPDB1`                                                              |
| TLS          | ☐ (unchecked = plain TCP)                                               |
| Abfrage      | `SELECT name AS result FROM employees WHERE id = 'field['EmployeeId']'` |
| Ergebnis     | `EmployeeName` (process field)                                          |

4. Save the process and start an instance

## 4. Verify

- The process instance's `EmployeeName` field should contain the value returned from the Oracle query.
- If the query fails, check the roXtra server logs for `Oracle service error:` messages.

## 5. Run Bundle Tests

```bash
cd oracle/
npm test
```

Expected output: All exported methods (`executeQuery`, `executeQueryConfig`, `executeQueryNoReturn`, `executeQueryNoReturnConfig`) are verified as callable functions.
