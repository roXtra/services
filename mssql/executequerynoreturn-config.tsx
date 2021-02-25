import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";
import { queryHint } from "./executequery-config";

export function executeQueryNoReturnConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Server"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="server" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Benutzername"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="username" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Passwort"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="password" type="password" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Datenbank"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="database" />
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
          </Semantic.Table.Body>
        </Semantic.Table>
        <Semantic.Table.Row>{queryHint}</Semantic.Table.Row>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>Mögliche Service Fehler</h3>
            <div>
              <p>DB_ERROR: Tritt dieser Fehler auf, konnte die Abfrage von der Datenbank nicht richtig verarbeitet werden.</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
