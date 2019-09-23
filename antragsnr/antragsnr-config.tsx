import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function antragsnrconfig(): JSX.Element {
  return <Semantic.Modal.Content>
    <Semantic.Table striped>
      <Semantic.Table.Body>
        <Semantic.Table.Row>
          <Semantic.Table.Cell>
            <PH.TL text={"Zielfeld"} />
          </Semantic.Table.Cell>
          <Semantic.Table.Cell>
            <Semantic.Input
              id="targetfield"
              fluid={true}
            />
          </Semantic.Table.Cell>
        </Semantic.Table.Row>

      </Semantic.Table.Body>
    </Semantic.Table>
  </Semantic.Modal.Content>;
}