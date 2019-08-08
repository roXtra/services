import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function createActivityConfig() {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Token"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="token"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Benutzername"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="username"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Kurzbezeichnung"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="activityAbbrevation"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Beschreibung"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="activityDescription"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"zu erledigen bis"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="activityExpirationdate"
              />
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
            <p>Geben Sie das Feld an, über das der Benutzername des Verantwortlichen eingegeben werden kann.</p>
          </div>
          <h3>Erklärung Kurzbezeichnung</h3>
          <div>
            <p>Geben Sie das Feld an, über das die Kurzbezeichnung der Maßnahme eingegeben werden kann.</p>
          </div>
          <h3>Erklärung Beschreibung</h3>
          <div>
            <p>Geben Sie das Feld an, über das die Beschreibung der Maßnahme eingegeben werden kann.</p>
          </div>
          <h3>Erklärung zu erledigen bis</h3>
          <div>
            <p>Geben Sie das Feld an, über das das Auslaufdatum der Maßnahme eingegeben werden kann.</p>
          </div>
        </Semantic.Table.Cell>
      </Semantic.Table.Row>
    </div>
  </Semantic.Modal.Content>;
}