import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function antragsnrconfig(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Table striped>
      <Semantic.Table.Body>
        <Semantic.Table.Row>
          <Semantic.Table.Cell>
            <span>{tl("Zielfeld", userLanguage)}</span>
          </Semantic.Table.Cell>
          <Semantic.Table.Cell>
            <input id="targetfield" />
          </Semantic.Table.Cell>
        </Semantic.Table.Row>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Erklärung Eingabefeld Zielfeld", userLanguage)}</h3>
            <div>
              <p>{tl("Im Zielfeld kann der Name des Feldes angegeben werden, in dem die Antragsnummer gespeichert werden soll.", userLanguage)}</p>
            </div>

            <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
            <div>
              <p>
                {tl(
                  "CONFIG_INVALID: Tritt dieser Fehler auf, sollte die Konfiguration nochmals überarbeitet werden. Es könnte zum Beispiel daran liegen, dass kein Zielfeld angegeben wurde.",
                  userLanguage,
                )}
              </p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </Semantic.Table.Body>
    </Semantic.Table>
  );
}
