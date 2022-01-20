import * as Semantic from "semantic-ui-react";
import Modal from "react-bootstrap/Modal";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function setRoxFileFieldConfig(userLanguage: Language): JSX.Element {
  return (
    <Modal.Body>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Datei ID", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="fileId" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Feld ID", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="fieldId" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Wert", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="value" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Erklärung Datei ID", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie die ID der Datei an.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Feld ID", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie die ID des Feldes an, welches editiert werden soll.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Wert", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie den Wert an, den das Feld der Datei haben soll.", userLanguage)}</p>
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
    </Modal.Body>
  );
}
