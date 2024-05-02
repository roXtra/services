import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";
import { DataTableErrorCode } from "./common.js";
import { SharePointConfigFields, SharePointConfigFieldsHelp } from "../sharepoint/readfile-config.js";

export function readXlsxFromSharepointConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <SharePointConfigFields userLanguage={userLanguage} />

          <tr>
            <td>
              <span>{tl("Name des Arbeitsblatts (optional)", userLanguage)}</span>
            </td>
            <td>
              <input id="sheetName" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Filter (optional)", userLanguage)}</span>
            </td>
            <td>
              <input id="rowFilter" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ergebnisfeld", userLanguage)}</span>
            </td>
            <td>
              <select id="dataTableField" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <SharePointConfigFieldsHelp userLanguage={userLanguage} />
              <h3>{tl("Name des Arbeitsblatts", userLanguage)}</h3>
              <div>
                <p>{tl("Optional: Der Name des Arbeitsblatts, das ausgelesen werden soll. Ist der Name leer, wird immer das erste Arbeitsblatt ausgelesen.", userLanguage)}</p>
              </div>
              <h3>{tl("Filter", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "Optional: Ein JavaScript-Ausdruck zum Filtern der Eingabedatei. Dieser Filter wird auf jede Zeile angewendet. Dabei kann über das Ojekt field auf die Felder des Vorgangs und über das Objekt row auf die Spalten der aktuellen Zeile zugegriffen werden.",
                    userLanguage,
                  )}
                </p>
                <p>{tl("Beispiele:", userLanguage)}</p>
                <p>
                  {"row['Title']?.includes(field['Name']) && row['Status'] == 'aktiv'"}
                  <br />
                  {"row['Title']?.includes(field['Name']) || row['Büro']?.includes(field['Name'])"}
                  <br />
                  {"(row['Title']?.includes(field['Name']) || row['Büro']?.includes(field['Name'])) && row['Anschrift']?.includes(field['Stadt'])"}
                </p>
              </div>
              <h3>{tl("Ergebnisfeld", userLanguage)}</h3>
              <div>
                <p>{tl("Das Feld vom Typ 'Tabellarische Daten', in das die Daten übertragen werden sollen.", userLanguage)}</p>
              </div>
              <h3>{tl("Felder", userLanguage)}</h3>
              <p>
                {DataTableErrorCode.INPUT_FIELD_ERROR}: {tl("Das angegebene Feld enthält keine xlsx- oder csv-Datei.", userLanguage)}
              </p>
              <p>
                {DataTableErrorCode.SHEET_ERROR}: {tl("Das Arbeitsblatt konnte nicht gelesen werden.", userLanguage)}
              </p>
              <p>
                {DataTableErrorCode.FILTER_ERROR}: {tl("Es gab einen Fehler beim Auswerten des Filters.", userLanguage)}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
