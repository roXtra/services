import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function getQueryHint(userLanguage: Language): React.JSX.Element {
  return (
    <td colSpan={2}>
      <h3>{tl("Abfrage", userLanguage)}</h3>
      <div>
        <p>{tl("Die SQL-Abfrage, die ausgeführt werden soll. Felder können mit field['Feldname'] in die Abfrage eingefügt werden, Rollen mit role['Lane'].", userLanguage)}</p>
        <br />
        <p>{tl("Beispiel: ", userLanguage) + "UPDATE test_table SET abteilung='field['Abteilung']', name='role['Ersteller']' WHERE id='field['id']'"}</p>
      </div>
      <h3>{tl("Passwort", userLanguage)}</h3>
      <div>
        <p>
          {tl(
            "Im Passwort können auch Werte aus der config.json referenziert werden (z.B. secret['password']). Damit können Sie verhindern, dass das Passwort im Klartext im Prozess gespeichert wird. ",
            userLanguage,
          )}
        </p>
      </div>
    </td>
  );
}

export function executeQueryConfig(userLanguage: Language): React.JSX.Element {
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

          <tr>
            <td></td>
            <td></td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ergebnis", userLanguage)}</span>
            </td>
            <td>
              <select id="targetField" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>{getQueryHint(userLanguage)}</tr>
        </tbody>
      </table>
    </div>
  );
}
