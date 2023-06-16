import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function executeSAPQueryConfig(userLanguage: Language): React.JSX.Element {
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
              <span>{tl("Abfrage", userLanguage)}</span>
            </td>
            <td>
              <input id="query" />
            </td>
          </tr>

          <tr>
            <td></td>
            <td></td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ergebnis", userLanguage)}</span>
            </td>
            <td>
              <input id="targetFieldTable" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("CSV Export", userLanguage)}</span>
            </td>
            <td>
              <input id="targetFieldCSV" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
