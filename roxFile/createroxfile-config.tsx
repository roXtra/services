import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function createRoxFileConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Dateifeld", userLanguage)}</span>
            </td>
            <td>
              <select id="roxFile" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Dateititelfeld", userLanguage)}</span>
            </td>
            <td>
              <select id="title" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Dokumenttyp", userLanguage)}</span>
            </td>
            <td>
              <input id="docType" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Beschreibungfeld", userLanguage)}</span>
            </td>
            <td>
              <select id="description" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ziel ID", userLanguage)}</span>
            </td>
            <td>
              <input id="destinationID" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ziel Typ", userLanguage)}</span>
            </td>
            <td>
              <input id="destinationType" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Name des Feldes für Feld ID", userLanguage)}</span>
            </td>
            <td>
              <input id="fileIDFieldName" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Erklärung Dateifeld", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie das Feld an, das die Datei enthält die als roXtra Datei gespeichert werden soll.", userLanguage)}</p>
              </div>
              <h3>{tl("Erklärung Dateititelfeld", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "Geben Sie das Feld an, in dem bestimmt werden soll welchen Namen die Datei haben soll. Wenn kein Name gesetzt wurde, dann wird der Name der hochzuladenenden Datei genommen",
                    userLanguage,
                  )}
                </p>
              </div>
              <h3>{tl("Erklärung Dokumenttyp", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie die ID des Dokumententyps an (z.B. 50).", userLanguage)}</p>
              </div>
              <h3>{tl("Erklärung Beschreibungfeld", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie das Feld an, in dem bestimmt werden soll welche Beschreibung die Datei haben soll.", userLanguage)}</p>
              </div>
              <h3>{tl("Erklärung Ziel ID", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie die ID des Ziels an. Zum Beispiel die ID des Ordners in der die Datei gespeichert werden soll.", userLanguage)}</p>
              </div>
              <h3>{tl("Erklärung Ziel Typ", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie den Typ des Ziels an. Zum Beispiel 1 wenn es sich um einen Ordner handelt.", userLanguage)}</p>
              </div>
              <h3>{tl("Erklärung Name des Feldes für Feld ID", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "eben Sie den Namen des Feldes an, in dem die ID der erstellten Datei angezeigt werden soll. Wenn kein Name gesetzt wurde wird kein Feld erstellt.",
                    userLanguage,
                  )}
                </p>
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
