import React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function createRoxFileConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Dateifeld"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="roxFile" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Dateititelfeld"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="title" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Dokumenttyp"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="docType" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Beschreibungfeld"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="description" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Ziel ID"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="destinationID" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Ziel Typ"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="destinationType" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Name des Feldes für Feld ID"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="fileIDFieldName" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>Erklärung Dateifeld</h3>
            <div>
              <p>Geben Sie das Feld an, das die Datei enthält die als roXtra Datei gespeichert werden soll.</p>
            </div>
            <h3>Erklärung Dateititelfeld</h3>
            <div>
              <p>
                Geben Sie das Feld an, in dem bestimmt werden soll welchen Namen die Datei haben soll. Wenn kein Name gesetzt wurde, dann wird der Name der hochzuladenenden
                Datei genommen
              </p>
            </div>
            <h3>Erklärung Dokumenttyp</h3>
            <div>
              <p>Geben Sie die ID des Dokumententyps an (z.B. 50).</p>
            </div>
            <h3>Erklärung Beschreibungfeld</h3>
            <div>
              <p>Geben Sie das Feld an, in dem bestimmt werden soll welche Beschreibung die Datei haben soll.</p>
            </div>
            <h3>Erklärung Ziel ID</h3>
            <div>
              <p>Geben Sie die ID des Ziels an. Zum Beispiel die ID des Ordners in der die Datei gespeichert werden soll.</p>
            </div>
            <h3>Erklärung Ziel Typ</h3>
            <div>
              <p>Geben Sie den Typ des Ziels an. Zum Beispiel 1 wenn es sich um einen Ordner handelt.</p>
            </div>
            <h3>Erklärung Name des Feldes für Feld ID</h3>
            <div>
              <p>Geben Sie den Namen des Feldes an, in dem die ID der erstellten Datei angezeigt werden soll. Wenn kein Name gesetzt wurde wird kein Feld erstellt.</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>Mögliche Service Fehler</h3>
            <div>
              <p>API_ERROR: Tritt dieser Fehler auf, gab es ein Problem mit der Verbindung zu roXtra Dokumente.</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
