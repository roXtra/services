import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function service1Config(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Eingabefeld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="inputField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Auswahlfeld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="selectField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Erklärung Eingabefeld", userLanguage)}</h3>
            <div>
              <p>{tl("Ein Eingabefeld dient der textuellen Eingabe.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Auswahlfeld", userLanguage)}</h3>
            <div>
              <p>{tl("Ein Auswahlfeld dient der Auswahl verschiedener exestierender Felder.", userLanguage)}</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
