import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function downloadFileConfig(userLanguage: Language): React.JSX.Element {
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
              <span>{tl("Feld für signierte Datei", userLanguage)}</span>
            </td>
            <td>
              <select id="targetField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Dokument bei DocuSign löschen?", userLanguage)}</span>
            </td>
            <td>
              <select id="deleteDocumentFromDocuSign" defaultValue="false">
                <option value="true">Ja</option>
                <option value="false">Nein</option>
              </select>
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <h3>{tl("Hinweise zur Konfiguration", userLanguage)}</h3>
              <div>
                <p>{tl("Lädt das von allen Parteien signierte Dokument von DocuSign herunter und speichert es im angegebenen Zielfeld.", userLanguage)}</p>

                <h3>{tl("Feld für Envelope-ID", userLanguage)}</h3>
                <p>{tl("Textfeld, das die DocuSign Envelope-ID enthält. Dieses Feld wird durch die 'Signaturanfrage erstellen'-Aktion befüllt.", userLanguage)}</p>

                <h3>{tl("Feld für signierte Datei", userLanguage)}</h3>
                <p>{tl("Dateianhangsfeld, in dem das heruntergeladene signierte Dokument gespeichert wird.", userLanguage)}</p>

                <h3>{tl("Dokument bei DocuSign löschen", userLanguage)}</h3>
                <p>{tl("Gibt an, ob das Dokument nach dem Herunterladen bei DocuSign gelöscht werden soll.", userLanguage)}</p>

                <h3>{tl("Mögliche Fehler", userLanguage)}</h3>
                <p>{tl("CONFIG_INVALID: Fehlende oder fehlerhafte Konfiguration.", userLanguage)}</p>
                <p>{tl("UNKNOWN_ERROR: Die Envelope ist noch nicht abgeschlossen (Status nicht 'completed').", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
