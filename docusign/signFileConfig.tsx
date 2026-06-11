import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function signFileConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Zu signierende Datei", userLanguage)}</span>
            </td>
            <td>
              <select id="sourceField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Nachricht (Optional)", userLanguage)}</span>
            </td>
            <td>
              <input id="message" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Webhook im Vorgang triggern?", userLanguage)}</span>
            </td>
            <td>
              <select id="triggerWebhook" defaultValue="false">
                <option value="true">Ja</option>
                <option value="false">Nein</option>
              </select>
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Feld für Envelope-ID", userLanguage)}</span>
            </td>
            <td>
              <select id="signatureIdField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Feld für Signatur-URL (Optional – aktiviert eingebettetes Signieren)", userLanguage)}</span>
            </td>
            <td>
              <select id="signatureUrlField" />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <h3>{tl("Hinweise zur Konfiguration", userLanguage)}</h3>
              <div>
                <p>{tl("Sendet das ausgewählte Dokument an DocuSign und fordert den Inhaber der aktuellen Rolle zur Signierung auf.", userLanguage)}</p>

                <h3>{tl("Zu signierende Datei", userLanguage)}</h3>
                <p>
                  {tl(
                    "Dateianhangsfeld, das die zu signierende Datei enthält. Enthält das Feld mehrere Dateien, wird nur die erste Datei an DocuSign gesendet.",
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Nachricht", userLanguage)}</h3>
                <p>{tl("Optionale Nachricht, die dem Unterzeichner in der DocuSign-Signaturanfrage angezeigt wird.", userLanguage)}</p>

                <h3>{tl("Webhook im Vorgang triggern?", userLanguage)}</h3>
                <p>
                  {tl(
                    "Gibt an, ob nach erfolgreichem Abschluss der Signatur ein Webhook im Vorgang ausgelöst werden soll. Das nächste auf diesen ServiceTask folgende Intermediate- oder BoundaryMessageEvent vom Typ Webhook wird ausgelöst.",
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Feld für Envelope-ID", userLanguage)}</h3>
                <p>{tl("Textfeld, in dem die DocuSign Envelope-ID gespeichert wird. Wird benötigt, um das signierte Dokument später herunterzuladen.", userLanguage)}</p>

                <h3>{tl("Feld für Signatur-URL", userLanguage)}</h3>
                <p>
                  {tl(
                    "Optionales Textfeld für die eingebettete Signatur-URL. Wird dieses Feld angegeben, wird eingebettetes Signieren aktiviert: DocuSign versendet keine E-Mail, stattdessen kann der Unterzeichner über die gespeicherte URL direkt signieren.",
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Mögliche Fehler", userLanguage)}</h3>
                <p>{tl("CONFIG_INVALID: Fehlende oder fehlerhafte Konfiguration.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
