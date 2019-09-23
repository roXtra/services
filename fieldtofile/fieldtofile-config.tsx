import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function fieldToFileConfig(): JSX.Element {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Quell Feld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="sourceField"
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
              <PH.TL text={"Zielpfad"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="targetPath"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

        </Semantic.Table.Body>
      </Semantic.Table>

    </div>
  </Semantic.Modal.Content>;
}