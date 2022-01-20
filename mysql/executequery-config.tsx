import * as Semantic from "semantic-ui-react";
import Modal from "react-bootstrap/Modal";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function getQueryHint(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Table.Cell colSpan="2">
      <h3>{tl("Abfrage", userLanguage)}</h3>
      <div>
        <p>{tl("Die SQL-Abfrage, die ausgeführt werden soll. Felder können mit field['Feldname'] in die Abfrage eingefügt werden, Rollen mit role['Lane'].", userLanguage)}</p>
        <br />
        <p>{tl("Beispiel: ", userLanguage) + "UPDATE test_table SET abteilung='field['Abteilung']', name='role['Ersteller']' WHERE id='field['id']'"}</p>
      </div>
    </Semantic.Table.Cell>
  );
}

export function executeQueryConfig(userLanguage: Language): JSX.Element {
  return (
    <Modal.Body>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Server", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="server" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Benutzername", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="username" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Passwort", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="password" type="password" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Datenbank", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="database" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Port", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="port" />
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
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>{getQueryHint(userLanguage)}</Semantic.Table.Row>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
            <div>
              <p>{tl("DB_ERROR: Tritt dieser Fehler auf, konnte die Abfrage von der Datenbank nicht richtig verarbeitet werden.", userLanguage)}</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Modal.Body>
  );
}
