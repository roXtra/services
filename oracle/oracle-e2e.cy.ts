/**
 * Cypress E2E Smoke Test — Oracle Service Configuration UI
 *
 * DEFERRED: Requires a running roXtra test instance with the Oracle service installed.
 * This placeholder documents the intended test scenarios for future implementation.
 *
 * Prerequisites:
 * - roXtra test instance running at Cypress baseUrl
 * - Oracle service deployed to the instance
 * - A test process with an Oracle service task configured
 *
 * Test Scenarios:
 *
 * 1. executeQuery config form renders all expected fields:
 *    - Server (text input, id="server")
 *    - Port (text input, id="port")
 *    - Benutzername (text input, id="username")
 *    - Passwort (text input, id="password")
 *    - Service Name (text input, id="serviceName")
 *    - TLS verwenden (checkbox input, id="useTls")
 *    - Abfrage (text input, id="query")
 *    - Ergebnis (select, id="targetField")
 *
 * 2. executeQueryNoReturn config form renders all expected fields minus Ergebnis:
 *    - Server, Port, Benutzername, Passwort, Service Name, TLS, Abfrage
 *    - No targetField select
 *
 * 3. Query help text is displayed with field['...'] and role['...'] examples
 *
 * 4. Password secret hint is displayed with secret['password'] reference
 */

// Uncomment and implement when roXtra test instance is available:
//
// describe("Oracle Service Configuration UI", () => {
//   it("should render executeQuery config form with all fields", () => {
//     // Navigate to process designer with Oracle service task
//     // Verify all 8 fields are visible
//     cy.get("#server").should("be.visible");
//     cy.get("#port").should("be.visible");
//     cy.get("#username").should("be.visible");
//     cy.get("#password").should("be.visible");
//     cy.get("#serviceName").should("be.visible");
//     cy.get("#useTls").should("be.visible");
//     cy.get("#query").should("be.visible");
//     cy.get("#targetField").should("be.visible");
//   });
//
//   it("should render executeQueryNoReturn config form without Ergebnis", () => {
//     // Navigate to process designer with Oracle service task (no return)
//     cy.get("#server").should("be.visible");
//     cy.get("#port").should("be.visible");
//     cy.get("#username").should("be.visible");
//     cy.get("#password").should("be.visible");
//     cy.get("#serviceName").should("be.visible");
//     cy.get("#useTls").should("be.visible");
//     cy.get("#query").should("be.visible");
//     cy.get("#targetField").should("not.exist");
//   });
// });
