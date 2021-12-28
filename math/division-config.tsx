import { tl } from "processhub-sdk";
import * as Semantic from "semantic-ui-react";
import { Language } from "processhub-sdk/lib/tl";

export function divisionConfig(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Zähler", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="numberField1" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Nenner", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="numberField2" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Ergebnis", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="targetField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>
      </div>
    </Semantic.Modal.Content>
  );
}
