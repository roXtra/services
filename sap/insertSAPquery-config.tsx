import React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function insertSAPQueryConfig(): JSX.Element {
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
                <Semantic.Input id="ipAddress" fluid />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Port"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <Semantic.Input id="port" fluid />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Datenbank Benutzername"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <Semantic.Input id="databaseUsername" fluid />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Datenbankpasswort"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <Semantic.Input id="password" type="password" fluid />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Tenant"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <Semantic.Input id="tenant" fluid />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Tabellenname"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <Semantic.Input id="tableName" fluid />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Spalten"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <Semantic.Input id="columns" fluid />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Werte"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <Semantic.Input id="values" fluid />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>
      </div>
    </Semantic.Modal.Content>
  );
}
