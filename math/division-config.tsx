import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function divisionConfig() {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Zähler"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="numberField1"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Nenner"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="numberField2"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Ergebnis"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="targetField"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>

    </div>
  </Semantic.Modal.Content>;
}