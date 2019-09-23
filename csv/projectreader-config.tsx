import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function projectreaderConfig(): JSX.Element {
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
              <PH.TL text={"Suchfeld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="searchField"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>

    </div>
  </Semantic.Modal.Content>;
}