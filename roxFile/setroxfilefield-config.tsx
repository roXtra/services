import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function setRoxFileFieldConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Datei ID", userLanguage)}</span>
            </td>
            <td>
              <input id="fileId" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Feld ID", userLanguage)}</span>
            </td>
            <td>
              <input id="fieldId" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Wert", userLanguage)}</span>
            </td>
            <td>
              <select id="value" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Erklärung Datei ID", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie die ID der Datei an.", userLanguage)}</p>
              </div>
              <h3>{tl("Erklärung Feld ID", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie die ID des Feldes an, welches editiert werden soll.", userLanguage)}</p>
              </div>
              <h3>{tl("Erklärung Wert", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie den Wert an, den das Feld der Datei haben soll.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
              <div>
                <p>{tl("API_ERROR: Tritt dieser Fehler auf, gab es ein Problem mit der Verbindung zu roXtra Dokumente.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
