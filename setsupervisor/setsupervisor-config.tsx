import { tl } from "processhub-sdk/lib/tl";
import * as Semantic from "semantic-ui-react";
import { Language } from "processhub-sdk/lib/tl";

export function setsupervisorConfig(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="setsupervisor-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Rolle des Mitarbeiters", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="userRoleId" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Rolle des Vorgesetzten", userLanguage)}</span>
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
