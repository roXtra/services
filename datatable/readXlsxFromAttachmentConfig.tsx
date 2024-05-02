import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";
import { ErrorHelp, SheetFilterTargetHelp } from "./readXlsxConfig.js";

export function readXlsxFromAttachmentConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Dateianhangsfeld", userLanguage)}</span>
            </td>
            <td>
              <select id="inputField" />
            </td>
          </tr>

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
              <h3>{tl("Dateianhangsfeld", userLanguage)}</h3>
              <div>
                <p>{tl("Ein Feld vom Typ 'Dateianhang', das eine .xlsx- oder .csv-Datei enthält.", userLanguage)}</p>
              </div>
              <SheetFilterTargetHelp userLanguage={userLanguage} />
              <ErrorHelp userLanguage={userLanguage} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
