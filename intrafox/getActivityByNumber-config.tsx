import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function getActivityByNumberConfig(): JSX.Element {
  return (
    <Semantic.Modal.Content>
      <div id="service-form" className="ui form center">
        <Semantic.Table striped>
          <Semantic.Table.Body>
            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Token"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <input id="token" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Benutzername"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="username" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>

            <Semantic.Table.Row>
              <Semantic.Table.Cell>
                <PH.TL text={"Maßnahmennummer"} />
              </Semantic.Table.Cell>
              <Semantic.Table.Cell>
                <select id="activityNumber" />
              </Semantic.Table.Cell>
            </Semantic.Table.Row>
          </Semantic.Table.Body>
        </Semantic.Table>

        <Semantic.Table.Row>
          <Semantic.Table.Cell colSpan="2">
            <h3>Erklärung Token</h3>
            <div>
              <p>Geben Sie das Authentifizierungstoken der Intrafox-API ein.</p>
            </div>
            <h3>Erklärung Benutzername</h3>
            <div>
              <p>Geben Sie das Feld an, über das der Benutzername des Intrafoxbenutzers, von dem Sie Maßnahmen aus dem System erhalten wollen, eingegeben werden kann.</p>
            </div>
            <h3>Erklärung Maßnahmennummer</h3>
            <div>
              <p>Geben Sie das Feld an, über das die Maßnahmennummer der Maßnahme von der Sie Informationen erhalten wollen, eingegeben werden kann.</p>
            </div>

            <h3>Mögliche Service Fehler</h3>
            <div>
              <p>API_ERROR: Tritt dieser Fehler auf, ist bei der Intrafox Schnittstelle ein Fehler aufgetreten und es konnte keine Activity erstellt werden.</p>
            </div>
          </Semantic.Table.Cell>
        </Semantic.Table.Row>
      </div>
    </Semantic.Modal.Content>
  );
}
