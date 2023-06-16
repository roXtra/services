import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function generateConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Titel Feld", userLanguage)}</span>
            </td>
            <td>
              <select id="titleField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ort Feld", userLanguage)}</span>
            </td>
            <td>
              <select id="locationField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Von Feld", userLanguage)}</span>
            </td>
            <td>
              <select id="fromField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Bis Feld", userLanguage)}</span>
            </td>
            <td>
              <select id="tillField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Beschreibungsfeld", userLanguage)}</span>
            </td>
            <td>
              <select id="descriptionField" />
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

          <tr>
            <td>
              <span>{tl("ICS Dateiname", userLanguage)}</span>
            </td>
            <td>
              <select id="fileNameField" />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
              <div>
                <p>{tl("ATTACHMENT_ERROR: Tritt dieser Fehler auf, konnte die ICS Datei nicht an den Vorgang angehängt werden.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
