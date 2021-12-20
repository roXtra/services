import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function setsupervisorConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="setsupervisor-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Rolle des Mitarbeiters"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="userRoleId" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Rolle des Vorgesetzten"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="supervisorRoleId" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>
      </div>
    </Semantic.Modal.Content>
  );
}
