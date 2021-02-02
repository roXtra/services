import React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function csvreaderConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Dateipfad"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="filePath" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Arbeitsblattname"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="sheetName" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Abfrage"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="query" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell colSpan="2">
                <h3>Erklärung Eingabefeld Dateipfad</h3>
                <div>
                  <p>Im Eingabefeld Dateipfad wird der Pfad der CSV oder XLSX Datei angegeben. Diese Datei muss auf dem roXtra Server liegen.</p>
                </div>

                <h3>Erklärung Eingabefeld Arbeitsblattname</h3>
                <div>
                  <p>Im Eingabefeld Arbeitsblattname wird der Name des zu importierenden Arbeitsblatts angegeben.</p>
                </div>

                <h3>Erklärung Eingabefeld Abfrage</h3>
                <div>
                  <p>Im Eingabefeld Abfrage kann eine Abfrage hinterlegt werden um das importierte Arbeitsblatt zu filtern.</p>
                  <p>Die Abfrage hat folgendes Schema: Spaltenname=Wert</p>
                  <p>Feldwerte können über @@Feldname@@ eingefügt werden.</p>
                </div>

                <h3>Mögliche Service Fehler</h3>
                <div>
                  <p>
                    CONFIG_INVALID: Tritt dieser Fehler auf, sollte die Konfiguration nochmals überarbeitet werden. Es könnte zum Beispiel daran liegen, dass kein Dateipfad
                    angegeben wurde.
                  </p>
                  <p>FILE_ERROR: Tritt dieser Fehler auf, wurde keine Datei mit dem angegebenen Dateipfad gefunden oder enthält das Arbeitsblatt keine Daten.</p>
                </div>
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>
      </div>
    </Semantic.Modal.Content>
  );
}
