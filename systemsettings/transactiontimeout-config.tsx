import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk";
import { Language } from "processhub-sdk/lib/tl";

export function transactionTimeoutConfig(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Transaktions-Timeout", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="transactionTimeout" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Erklärung Transaktions-Timeout", userLanguage)}</h3>
            <div>
              <p>
                {tl(
                  "Setzt das Transaktions-Timeout für zukünftige Datenbank-Transaktionen in ms. Das Timeout der aktuell laufenden Transaktion bleibt unverändert.",
                  userLanguage,
                )}
              </p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
