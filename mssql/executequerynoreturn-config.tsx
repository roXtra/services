import { getQueryHint } from "./executequery-config";
import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function executeQueryNoReturnConfig(userLanguage: Language): JSX.Element {
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
              <span>{tl("Datenbank", userLanguage)}</span>
            </td>
            <td>
              <input id="database" />
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
