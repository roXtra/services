import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";
import * as Semantic from "semantic-ui-react";
import Modal from "react-bootstrap/Modal";

export function generateConfig(userLanguage: Language): JSX.Element {
  return (
    <Modal.Body>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Titel Feld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="titleField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Von Feld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="fromField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Bis Feld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="tillField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Beschreibungsfeld", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="descriptionField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell></Semantic.Table.Cell>
              <Semantic.Table.Cell></Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Ergebnis", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="targetField" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell colSpan="2">
                <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
                <div>
                  <p>{tl("ATTACHMENT_ERROR: Tritt dieser Fehler auf, konnte die ICS Datei nicht an den Vorgang angehängt werden.", userLanguage)}</p>
                </div>
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>
      </div>
    </Modal.Body>
  );
}
