import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk";
import { Language } from "processhub-sdk/lib/tl";

export function createActivityConfig(userLanguage: Language): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Token", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="token" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Benutzername", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="username" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Kurzbezeichnung", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="activityAbbrevation" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("Beschreibung", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="activityDescription" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <span>{tl("zu erledigen bis", userLanguage)}</span>
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="activityExpirationdate" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>{tl("Erklärung Token", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie das Authentifizierungstoken der Intrafox-API ein.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Benutzername", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie das Feld an, über das der Benutzername des Verantwortlichen eingegeben werden kann.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Kurzbezeichnung", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie das Feld an, über das die Kurzbezeichnung der Maßnahme eingegeben werden kann.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung Beschreibung", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie das Feld an, über das die Beschreibung der Maßnahme eingegeben werden kann.", userLanguage)}</p>
            </div>
            <h3>{tl("Erklärung zu erledigen bis", userLanguage)}</h3>
            <div>
              <p>{tl("Geben Sie das Feld an, über das das Auslaufdatum der Maßnahme eingegeben werden kann.", userLanguage)}</p>
            </div>

            <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
            <div>
              <p>
                {tl(
                  "API_ERROR: Tritt dieser Fehler auf, ist bei der Intrafox Schnittstelle ein Fehler aufgetreten und es konnte keine Activity erstellt werden.",
                  userLanguage,
                )}
              </p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
