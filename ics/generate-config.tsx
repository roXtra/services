import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function generateConfig(): JSX.Element {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Titel Feld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="titleField"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Von Feld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="fromField"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Bis Feld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="tillField"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Beschreibungsfeld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="descriptionField"
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

    </div>
  </Semantic.Modal.Content>;
}