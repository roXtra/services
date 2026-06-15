import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function deleteFileConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
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
              <span>{tl("Löschmodus", userLanguage)}</span>
            </td>
            <td>
              <select id="deleteMode" defaultValue="recyclebin">
                <option value="recyclebin">{tl("Papierkorb (wiederherstellbar)", userLanguage)}</option>
                <option value="purge">{tl("Dauerhaft löschen", userLanguage)}</option>
              </select>
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <h3>{tl("Hinweise zur Konfiguration", userLanguage)}</h3>
              <div>
                <p>{tl("Löscht das signierte Dokument von DocuSign.", userLanguage)}</p>

                <h3>{tl("Feld für Envelope-ID", userLanguage)}</h3>
                <p>{tl("Textfeld, das die DocuSign Envelope-ID enthält. Dieses Feld wird durch die 'Signaturanfrage erstellen'-Aktion befüllt.", userLanguage)}</p>

                <h3>{tl("Art der Löschung", userLanguage)}</h3>
                <p>{tl("Papierkorb: Verschiebt die Envelope in den Papierkorb. Kann für eine gewisse Zeit wiederhergestellt werden.", userLanguage)}</p>
                <p>
                  {tl("Dauerhaft löschen: Entfernt die Dokumente unwiderruflich aus der Envelope. Die Envelope selbst bleibt mit Status 'purged' erhalten.", userLanguage)}
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
