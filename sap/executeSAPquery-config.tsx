import React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function executeSAPQueryConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"IP Adresse"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="ipAddress" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Port"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="port" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Datenbank Benutzername"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="databaseUsername" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Datenbankpasswort"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="password" type="password" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Tenant"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="tenant" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Abfrage"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="query" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell></Semantic.Table.Cell>
              <Semantic.Table.Cell></Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Ergebnis"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="targetFieldTable" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"CSV Export"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="targetFieldCSV" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>
      </div>
    </Semantic.Modal.Content>
  );
}
