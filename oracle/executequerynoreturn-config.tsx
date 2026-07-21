import { getQueryHint } from "./executequery-config.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function executeQueryNoReturnConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Server", userLanguage)}</span>
            </td>
            <td>
              <input id="server" />
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
              <span>{tl("Benutzername", userLanguage)}</span>
            </td>
            <td>
              <input id="username" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Passwort", userLanguage)}</span>
            </td>
            <td>
              <input id="password" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Service Name", userLanguage)}</span>
            </td>
            <td>
              <input id="serviceName" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("TLS verwenden", userLanguage)}</span>
            </td>
            <td>
              <input id="useTls" type="checkbox" />
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
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>{getQueryHint(userLanguage)}</tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>Mögliche Service Fehler</h3>
              <div>
                <p>DB_ERROR: Tritt dieser Fehler auf, konnte die Abfrage von der Datenbank nicht richtig verarbeitet werden.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
