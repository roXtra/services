import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function getActivityByNumberConfig(userLanguage: Language): JSX.Element {
  return (
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
              <span>{tl("Maßnahmennummer", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select id="activityNumber" />
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
            <p>
              {tl(
                "Geben Sie das Feld an, über das der Benutzername des Intrafoxbenutzers, von dem Sie Maßnahmen aus dem System erhalten wollen, eingegeben werden kann.",
                userLanguage,
              )}
            </p>
          </div>
          <h3>{tl("Erklärung Maßnahmennummer", userLanguage)}</h3>
          <div>
            <p>{tl("Geben Sie das Feld an, über das die Maßnahmennummer der Maßnahme von der Sie Informationen erhalten wollen, eingegeben werden kann.", userLanguage)}</p>
          </div>

          <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
          <div>
            <p>
              {tl("API_ERROR: Tritt dieser Fehler auf, ist bei der Intrafox Schnittstelle ein Fehler aufgetreten und es konnte keine Activity erstellt werden.", userLanguage)}
            </p>
          </div>
        </Semantic.Table.Cell>
      </Semantic.Table.Row>
    </div>
  );
}
