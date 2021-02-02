import React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function antragsnrconfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Zielfeld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="targetfield" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell colSpan="2">
              <h3>Erklärung Eingabefeld Zielfeld</h3>
              <div>
                <p>Im Zielfeld kann der Name des Feldes angegeben werden, in dem die Antragsnummer gespeichert werden soll.</p>
              </div>

              <h3>Mögliche Service Fehler</h3>
              <div>
                <p>
                  CONFIG_INVALID: Tritt dieser Fehler auf, sollte die Konfiguration nochmals überarbeitet werden. Es könnte zum Beispiel daran liegen, dass kein Zielfeld
                  angegeben wurde.
                </p>
              </div>
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>
    </Semantic.Modal.Content>
  );
}
