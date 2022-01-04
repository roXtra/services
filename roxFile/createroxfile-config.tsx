import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function createRoxFileConfig(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Dateifeld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="roxFile" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Dateititelfeld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="title" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Dokumenttyp", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="docType" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Beschreibungfeld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="description" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Ziel ID", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="destinationID" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Ziel Typ", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="destinationType" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Name des Feldes für Feld ID", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="fileIDFieldName" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Erklärung Dateifeld", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie das Feld an, das die Datei enthält die als roXtra Datei gespeichert werden soll.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Dateititelfeld", userLanguage)}</h3>
            <div>
              <p>
                {tl(
                  "Geben Sie das Feld an, in dem bestimmt werden soll welchen Namen die Datei haben soll. Wenn kein Name gesetzt wurde, dann wird der Name der hochzuladenenden Datei genommen",
                  userLanguage,
                )}
              </p>
            </div>
            <h3>{tl("Erklärung Dokumenttyp", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie die ID des Dokumententyps an (z.B. 50).", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Beschreibungfeld", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie das Feld an, in dem bestimmt werden soll welche Beschreibung die Datei haben soll.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Ziel ID", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie die ID des Ziels an. Zum Beispiel die ID des Ordners in der die Datei gespeichert werden soll.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Ziel Typ", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie den Typ des Ziels an. Zum Beispiel 1 wenn es sich um einen Ordner handelt.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Name des Feldes für Feld ID", userLanguage)}</h3>
            <div>
              <p>
                {tl(
                  "eben Sie den Namen des Feldes an, in dem die ID der erstellten Datei angezeigt werden soll. Wenn kein Name gesetzt wurde wird kein Feld erstellt.",
                  userLanguage,
                )}
              </p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
            <div>
              <p>{tl("API_ERROR: Tritt dieser Fehler auf, gab es ein Problem mit der Verbindung zu roXtra Dokumente.", userLanguage)}</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
