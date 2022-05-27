import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";
import * as Semantic from "semantic-ui-react";

export function noopConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Wartezeit in Sekunden", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="waitInSec" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell colSpan="2">
              <p>{tl("Wird eine Wartezeit festgelegt, wird der Servicetask erst nach Ablauf fortgesetzt.", userLanguage)}</p>
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>
    </div>
  );
}
