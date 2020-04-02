import React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";
import { queryHint } from "./executequery-config";

export function executeQueryNoReturnConfig(): JSX.Element {
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

        </Semantic.Table.Body>
      </Semantic.Table>
      <Semantic.Table.Row>
        {queryHint}
      </Semantic.Table.Row>
    </div>
  </Semantic.Modal.Content>;
}