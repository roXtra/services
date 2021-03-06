import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function createReportConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Berichtsvorlage"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="selectReportDraft" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Dateityp"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="selectReportType" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Feld für Berichtsanhang"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="selectReportField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>Berichtsvorlage</h3>
            <div>
              <p>Wählen Sie die Berichtsvorlage aus die zum Erstellen des Berichts verwendet werden soll. </p>
              <b>
                Hinweis: Beim Erstellen eines neuen Prozesses sind noch keine Vorlagen verfügbar. Speichern Sie hierfür den Prozess einmal ab und bearbeiten Sie ihn
                anschließend, um die Standardvorlage auswählen zu können.
              </b>
            </div>
            <h3>Dateityp</h3>
            <div>
              <p>Wählen Sie den Dateitypen aus in dem der Bericht gespeichert werden soll.</p>
            </div>
            <h3>Feld für Berichtsanhang</h3>
            <div>
              <p>Wählen Sie das Feld aus in dem die Berichtsdatei angehängt werden soll.</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>Mögliche Service Fehler</h3>
            <div>
              <p>ATTACHMENT_ERROR: Tritt dieser Fehler auf, konnte der Bericht nicht an den Vorgang angehängt werden.</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
