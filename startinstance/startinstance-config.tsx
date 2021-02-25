import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function startInstanceConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Zu startender Prozess"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="processId" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Felder"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select multiple id="fields" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"ID des ausführenden Users"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="executingUserId" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>
      </div>
    </Semantic.Modal.Content>
  );
}
