import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export const SignFileConfigFields = ({ userLanguage }: { userLanguage: string }) => (
  <>
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
        <span>{tl("Qualität der Signatur", userLanguage)}</span>
      </td>
      <td>
        <select id="signatureQuality" defaultValue="AES">
          <option value="SES">{tl("Einfache elektronische Signatur (EES/SES)", userLanguage)}</option>
          <option value="AES">{tl("Fortgeschrittene elektronische Signatur (FES/AES)", userLanguage)}</option>
          <option value="QES">{tl("Qualifizierte elektronische Signatur (QES)", userLanguage)}</option>
        </select>
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
        <span>{tl("Mail durch Skribble versenden?", userLanguage)}</span>
      </td>
      <td>
        <select id="skribbleNotify" defaultValue="false">
          <option value="true">Ja</option>
          <option value="false">Nein</option>
        </select>
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
        <span>{tl("Feld für Signatur-ID", userLanguage)}</span>
      </td>
      <td>
        <select id="signatureIdField" />
      </td>
    </tr>

    <tr>
      <td>
        <span>{tl("Feld für Signatur-URL (Optional)", userLanguage)}</span>
      </td>
      <td>
        <select id="signatureUrlField" />
      </td>
    </tr>
  </>
);

export const SignFileConfigHelp = ({ userLanguage }: { userLanguage: string }) => (
  <>
    <div>
      <p>{tl("Fordert den Inhaber der aktuellen Rolle auf, die angegebene Datei bei Skribble zu signieren.", userLanguage)}</p>
    </div>
    <h3>{tl("Zu signierende Datei", userLanguage)}</h3>
    <div>
      <p>
        {tl(
          "Dateianhangsfeld, das die Datei, die signiert werden soll, enthält. Enthält das Feld mehrere Dateien, wird nur die erste Datei zum Signieren an Skribble versendet.",
          userLanguage,
        )}
      </p>
    </div>

    <h3>{tl("Qualität der Signatur", userLanguage)}</h3>
    <div>
      <p>
        {tl(
          "Die Qualität der Signatur, die erstellt werden soll. Die einfache elektronische Signatur (SES) ist die niedrigste Qualität, gefolgt von der fortgeschrittenen elektronischen Signatur (AES) und der qualifizierten elektronischen Signatur (QES), die die höchste rechtliche Verbindlichkeit hat.",
          userLanguage,
        )}
      </p>
    </div>

    <h3>{tl("Nachricht", userLanguage)}</h3>
    <div>
      <p>
        {tl("Textfeld, das eine optionale Nachricht für den Empfänger der signierten Datei enthält. Diese wird dem Benutzer bei der Unterzeichnung angezeigt.", userLanguage)}
      </p>
    </div>

    <h3>{tl("Mail durch Skribble versenden?", userLanguage)}</h3>
    <div>
      <p>
        {tl(
          "Gibt an, ob Skribble eine E-Mail an den Unterzeichner senden soll, um ihn über die Signaturanfrage zu informieren. Wenn dies deaktiviert ist, muss der Unterzeichner die Signatur-URL aus dem Feld aufrufen, um die Datei zu signieren.",
          userLanguage,
        )}
      </p>
    </div>

    <h3>{tl("Webhook im Vorgang triggern?", userLanguage)}</h3>
    <div>
      <p>
        {tl(
          "Gibt an, ob ein Webhook im Vorgang getriggert werden soll, nachdem die Signatur erfolgreich durchgeführt wurde. Ist diese Option aktiviert, wird das nächste auf diesen ServiceTask folgende Intermediate- oder BoundaryMessageEvent vom Typ Webhook ausgelöst, nachdem die Signatur bei Skribble abgeschlossen wurde.",
          userLanguage,
        )}
      </p>
    </div>

    <h3>{tl("Feld für Signatur-ID", userLanguage)}</h3>
    <div>
      <p>{tl("Ein Textfeld, in dem die ID der signierten Datei gespeichert wird. Wird benötigt, um die Datei nach dem Signieren abzurufen.", userLanguage)}</p>
    </div>

    <h3>{tl("Feld für Signatur-URL", userLanguage)}</h3>
    <div>
      <p>
        {tl(
          "Ein optionales Textfeld, in dem die URL der Signaturaufforderung gespeichert wird. Durch die Verwendung dieser URL kann der Unterzeichner die Datei signieren.",
          userLanguage,
        )}
      </p>
    </div>
  </>
);

export function signFileConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <SignFileConfigFields userLanguage={userLanguage} />
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <SignFileConfigHelp userLanguage={userLanguage} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
