import React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export const queryHint =
  <Semantic.Table.Cell colSpan="2">
    <h3>{PH.tl("Abfrage")}</h3>
    <div>
      <p>{PH.tl("Die SQL-Abfrage, die ausgeführt werden soll. Felder können mit field['Feldname'] in die Abfrage eingefügt werden, Rollen mit role['Lane'].")}</p>
      <br />
      <p>{PH.tl("Beispiel: ") + "UPDATE test_table SET abteilung='field['Abteilung']', name='role['Ersteller']' WHERE id='field['id']'"}</p>
    </div>
  </Semantic.Table.Cell>;

export function executeQueryConfig(): JSX.Element {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Server"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="server"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Benutzername"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="username"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Passwort"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="password"
                type="password"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Datenbank"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="database"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Abfrage"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="query"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Ergebnis"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="targetField"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>

      <Semantic.Table.Row>
        {queryHint}
      </Semantic.Table.Row>
    </div>
  </Semantic.Modal.Content>;
}