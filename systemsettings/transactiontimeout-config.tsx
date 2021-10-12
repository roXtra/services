import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function transactionTimeoutConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Transaktions-Timeout"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="transactionTimeout" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>Erklärung Transaktions-Timeout</h3>
            <div>
              <p>Setzt das Transaktions-Timeout für zukünftige Datenbank-Transaktionen in ms. Das Timeout der aktuell laufenden Transaktion bleibt unverändert.</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
