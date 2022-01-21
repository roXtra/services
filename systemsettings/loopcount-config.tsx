import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function loopCountConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Max. Anzahl an Iterationen", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="maxIterations" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>

      <Semantic.Table.Row>
        <Semantic.Table.Cell colSpan="2">
          <h3>{tl("Erklärung Eingabefeld", userLanguage)}</h3>
          <div>
            <p>{tl("Max. Anzahl an Iterationen, die ein BPMN-Element durchlaufen kann, bevor die Ausführung unterbrochen wird.", userLanguage)}</p>
          </div>
        </Semantic.Table.Cell>
      </Semantic.Table.Row>
    </div>
  );
}
