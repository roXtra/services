import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function createReportConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Berichtsvorlage", userLanguage)}</span>
            </td>
            <td>
              <select id="selectReportDraft" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Dateityp", userLanguage)}</span>
            </td>
            <td>
              <select id="selectReportType" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Feld für Berichtsanhang", userLanguage)}</span>
            </td>
            <td>
              <select id="selectReportField" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Berichtsvorlage", userLanguage)}</h3>
              <div>
                <p>{tl("Wählen Sie die Berichtsvorlage aus die zum Erstellen des Berichts verwendet werden soll. ", userLanguage)}</p>
                <b>
                  {tl(
                    "Hinweis: Beim Erstellen eines neuen Prozesses sind noch keine Vorlagen verfügbar. Speichern Sie hierfür den Prozess einmal ab und bearbeiten Sie ihn anschließend, um die Standardvorlage auswählen zu können.",
                    userLanguage,
                  )}
                </b>
              </div>
              <h3>{tl("Dateityp", userLanguage)}</h3>
              <div>
                <p>{tl("Wählen Sie den Dateitypen aus in dem der Bericht gespeichert werden soll.", userLanguage)}</p>
              </div>
              <h3>{tl("Feld für Berichtsanhang", userLanguage)}</h3>
              <div>
                <p>{tl("Wählen Sie das Feld aus in dem die Berichtsdatei angehängt werden soll.", userLanguage)}</p>
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
                <p>{tl("ATTACHMENT_ERROR: Tritt dieser Fehler auf, konnte der Bericht nicht an den Vorgang angehängt werden.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
