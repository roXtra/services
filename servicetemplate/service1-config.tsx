import React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function service1Config(): JSX.Element {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Eingabefeld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="inputField"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Auswahlfeld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="selectField"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>

      <Semantic.Table.Row>
        <Semantic.Table.Cell colSpan="2">
          <h3>Erklärung Eingabefeld</h3>
          <div>
            <p>Ein Eingabefeld dient der textuellen Eingabe.</p>
          </div>
          <h3>Erklärung Auswahlfeld</h3>
          <div>
            <p>Ein Auswahlfeld dient der Auswahl verschiedener exestierender Felder.</p>
          </div>
        </Semantic.Table.Cell>
      </Semantic.Table.Row>
    </div>
  </Semantic.Modal.Content>;
}