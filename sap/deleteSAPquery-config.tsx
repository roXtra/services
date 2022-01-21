import * as Semantic from "semantic-ui-react";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function deleteSAPQueryConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <Semantic.Table striped>
        <Semantic.Table.Body>
          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("IP Adresse", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="ipAddress" />
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
              <span>{tl("Datenbank Benutzername", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="databaseUsername" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Datenbankpasswort", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="password" type="password" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Tenant", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="tenant" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("Tabellenname", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="tableName" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <span>{tl("WHERE", userLanguage)}</span>
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <input id="where" />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>
    </div>
  );
}
