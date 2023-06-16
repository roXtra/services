import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function deleteSAPQueryConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("IP Adresse", userLanguage)}</span>
            </td>
            <td>
              <input id="ipAddress" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Port", userLanguage)}</span>
            </td>
            <td>
              <input id="port" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Datenbank Benutzername", userLanguage)}</span>
            </td>
            <td>
              <input id="databaseUsername" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Datenbankpasswort", userLanguage)}</span>
            </td>
            <td>
              <input id="password" type="password" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Tenant", userLanguage)}</span>
            </td>
            <td>
              <input id="tenant" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Tabellenname", userLanguage)}</span>
            </td>
            <td>
              <input id="tableName" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("WHERE", userLanguage)}</span>
            </td>
            <td>
              <input id="where" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
