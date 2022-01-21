import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function startInstanceConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Zu startender Prozess", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select id="processId" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Felder", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select multiple id="fields" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("ID des ausführenden Users", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="executingUserId" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>
    </div>
  );
}
