import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function createActivityConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Token", userLanguage)}</span>
            </td>
            <td>
              <input id="token" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Benutzername", userLanguage)}</span>
            </td>
            <td>
              <select id="username" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Kurzbezeichnung", userLanguage)}</span>
            </td>
            <td>
              <select id="activityAbbrevation" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Beschreibung", userLanguage)}</span>
            </td>
            <td>
              <select id="activityDescription" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("zu erledigen bis", userLanguage)}</span>
            </td>
            <td>
              <select id="activityExpirationdate" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
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
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
