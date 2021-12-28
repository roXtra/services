import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk";
import { Language } from "processhub-sdk/lib/tl";

export function createReportConfig(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Berichtsvorlage", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="selectReportDraft" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Dateityp", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="selectReportType" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Feld für Berichtsanhang", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="selectReportField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Berichtsvorlage", userLanguage)}</h3>
            <div>
              <p>{tl("Wählen Sie die Berichtsvorlage aus die zum Erstellen des Berichts verwendet werden soll. ", userLanguage)}</p>
              <b>
                {tl(
                  "Hinweis: Beim Erstellen eines neuen Prozesses sind noch keine Vorlagen verfügbar. Speichern Sie hierfür den Prozess einmal ab und bearbeiten Sie ihn anschließend, um die Standardvorlage auswählen zu können.",
                  userLanguage,
                )}
              </b>
            </div>
            <h3>{tl("Dateityp", userLanguage)}</h3>
            <div>
              <p>{tl("Wählen Sie den Dateitypen aus in dem der Bericht gespeichert werden soll.", userLanguage)}</p>
            </div>
            <h3>{tl("Feld für Berichtsanhang", userLanguage)}</h3>
            <div>
              <p>{tl("Wählen Sie das Feld aus in dem die Berichtsdatei angehängt werden soll.", userLanguage)}</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
            <div>
              <p>{tl("ATTACHMENT_ERROR: Tritt dieser Fehler auf, konnte der Bericht nicht an den Vorgang angehängt werden.", userLanguage)}</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
