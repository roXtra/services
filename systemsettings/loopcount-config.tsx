import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function loopCountConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Max. Anzahl an Iterationen"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="maxIterations" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>Erklärung Eingabefeld</h3>
            <div>
              <p>Max. Anzahl an Iterationen, die ein BPMN-Element durchlaufen kann, bevor die Ausführung unterbrochen wird.</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
