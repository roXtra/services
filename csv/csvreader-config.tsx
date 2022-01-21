import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function csvreaderConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Dateipfad", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="filePath" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Arbeitsblattname", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="sheetName" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Abfrage", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="query" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell colSpan="2">
              <h3>{tl("Erklärung Eingabefeld Dateipfad", userLanguage)}</h3>
              <div>
                <p>{tl("Im Eingabefeld Dateipfad wird der Pfad der CSV oder XLSX Datei angegeben. Diese Datei muss auf dem roXtra Server liegen.", userLanguage)}</p>
              </div>

              <h3>{tl("Erklärung Eingabefeld Arbeitsblattname", userLanguage)}</h3>
              <div>
                <p>{tl("Im Eingabefeld Arbeitsblattname wird der Name des zu importierenden Arbeitsblatts angegeben.", userLanguage)}</p>
              </div>

              <h3>{tl("Erklärung Eingabefeld Abfrage", userLanguage)}</h3>
              <div>
                <p>{tl("Im Eingabefeld Abfrage kann eine Abfrage hinterlegt werden um das importierte Arbeitsblatt zu filtern.", userLanguage)}</p>
                <p>{tl("Die Abfrage hat folgendes Schema: Spaltenname=Wert", userLanguage)}</p>
                <p>{tl("Feldwerte können über @@Feldname@@ eingefügt werden.", userLanguage)}</p>
              </div>

              <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "CONFIG_INVALID: Tritt dieser Fehler auf, sollte die Konfiguration nochmals überarbeitet werden. Es könnte zum Beispiel daran liegen, dass kein Dateipfad angegeben wurde.",
                    userLanguage,
                  )}
                </p>
                <p>
                  {tl(
                    "FILE_ERROR: Tritt dieser Fehler auf, wurde keine Datei mit dem angegebenen Dateipfad gefunden oder enthält das Arbeitsblatt keine Daten.",
                    userLanguage,
                  )}
                </p>
              </div>
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>
    </div>
  );
}
