import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function csvreaderConfig() {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>

        <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Dateipfad"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="filePath"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Sheet Name"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="sheetName"
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

    </div>
  </Semantic.Modal.Content>;
}