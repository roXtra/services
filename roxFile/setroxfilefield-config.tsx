import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function setRoxFileFieldConfig(): JSX.Element {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Datei ID"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="fileId"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Feld ID"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="fieldId"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Wert"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="value"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

        </Semantic.Table.Body>
      </Semantic.Table>

      <Semantic.Table.Row>
        <Semantic.Table.Cell colSpan="2">
          <h3>Erklärung Datei ID</h3>
          <div>
            <p>Geben Sie die ID der Datei an.</p>
          </div>
          <h3>Erklärung Feld ID</h3>
          <div>
            <p>Geben Sie die ID des Feldes an, welches editiert werden soll.</p>
          </div>
          <h3>Erklärung Wert</h3>
          <div>
            <p>Geben Sie den Wert an, den das Feld der Datei haben soll.</p>
          </div>
        </Semantic.Table.Cell>
      </Semantic.Table.Row>
    </div>
  </Semantic.Modal.Content>;
}