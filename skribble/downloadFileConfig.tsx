import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

const DownloadFileConfigFields = ({ userLanguage }: { userLanguage: string }) => (
  <>
    <tr>
      <td>
        <span>{tl("Feld für Signatur-ID", userLanguage)}</span>
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
        <span>{tl("Dokument bei Skribble löschen?", userLanguage)}</span>
      </td>
      <td>
        <select id="deleteDocumentFromSkribble" defaultValue="false">
          <option value="true">Ja</option>
          <option value="false">Nein</option>
        </select>
      </td>
    </tr>
  </>
);

const DownloadFileConfigHelp = ({ userLanguage }: { userLanguage: string }) => (
  <>
    <h3>{tl("Feld für Signatur-ID", userLanguage)}</h3>
    <div>
      <p>{tl("Ein Textfeld, das die Signatur-ID enthält. Muss bei der 'Signaturanfrage erstellen'-Aktion ausgefüllt werden.", userLanguage)}</p>
    </div>
    <h3>{tl("Feld für signierte Datei", userLanguage)}</h3>
    <div>
      <p>{tl("Dateianhangsfeld zum Hochladen der signierten Datei. Bereits vorhandene Dateien werden ersetzt.", userLanguage)}</p>
    </div>
    <h3>{tl("Dokument bei Skribble löschen?", userLanguage)}</h3>
    <div>
      <p>
        {tl(
          "Gibt an, ob das Dokument nach dem erfolgreichen Download bei Skribble gelöscht werden soll. Ansonsten bleibt es dort erhalten, bis die Löschfrist abläuft.",
          userLanguage,
        )}
      </p>
    </div>
  </>
);

export function downloadFileConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <DownloadFileConfigFields userLanguage={userLanguage} />
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <DownloadFileConfigHelp userLanguage={userLanguage} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
