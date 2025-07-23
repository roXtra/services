import { tl, Language } from "processhub-sdk/lib/tl.js";
import { DataTableErrorCode } from "./common.js";

const ErrorHelp = ({ userLanguage }: { userLanguage: string }) => (
  <>
    <h3>{tl("Fehler", userLanguage)}</h3>
    <p>
      {DataTableErrorCode.FILE_ERROR}: {tl("Die angegebene ID des roXtra-Dokuments konnte nicht gefunden werden.", userLanguage)}
    </p>
    <p>
      {DataTableErrorCode.DATA_ERROR}:{" "}
      {tl("Die Daten aus der Quelldatei konnten den Spalten des Feldes nicht zugeordnet werden, weil die Typen nicht kompatibel sind.", userLanguage)}
    </p>
    <p>
      {DataTableErrorCode.SHEET_ERROR}: {tl("Das Arbeitsblatt konnte nicht gelesen werden.", userLanguage)}
    </p>
    <p>
      {DataTableErrorCode.FILTER_ERROR}: {tl("Es gab einen Fehler beim Auswerten des Filters.", userLanguage)}
    </p>
  </>
);

const SheetFilterTargetHelp = ({ userLanguage }: { userLanguage: string }) => (
  <>
    <h3>{tl("Name des Arbeitsblatts", userLanguage)}</h3>
    <div>
      <p>{tl("Optional: Der Name des Arbeitsblatts, das ausgelesen werden soll. Ist der Name leer, wird immer das erste Arbeitsblatt ausgelesen.", userLanguage)}</p>
    </div>
    <h3>{tl("Filter", userLanguage)}</h3>
    <div>
      <p>
        {tl(
          "Optional: Ein JavaScript-Ausdruck zum Filtern der Eingabedatei. Dieser Filter wird auf jede Zeile angewendet. Dabei kann über das Objekt 'field' auf die Felder des Vorgangs und über das Objekt 'row' auf die Spalten der aktuellen Zeile zugegriffen werden.",
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
  </>
);

const FileFetchModeHelp = ({ userLanguage }: { userLanguage: string }) => (
  <>
    <h3>{tl("Dokument Auswahlmodus", userLanguage)}</h3>
    <div>
      <p>
        {tl(
          "Im userbezogenen Modus wird das Dokument im Kontext des ausführenden Benutzers aus dem Modul “Dokumente” abgerufen. Sollte der Benutzer keine Zugriffsrechte auf das Dokument haben, wird ein Fehler ausgelöst.",
          userLanguage,
        )}
      </p>
      <p>
        {tl(
          "Im systembezogenen Modus wird das Dokument unabhängig von den Benutzerrechten abgerufen, sodass der ServiceTask das Dokument als „System“ ermittelt.",
          userLanguage,
        )}
      </p>
    </div>
  </>
);

export function readCsvOrXlsxFromRoxtraFileConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("roXtra-Dokument ID", userLanguage)}</span>
            </td>
            <td>
              <input id="roxtraFileID" />
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

          <tr>
            <td>
              <span>{tl("Dokument Auswahlmodus", userLanguage)}</span>
            </td>
            <td>
              <select id="roxtraFileFetchMode" defaultValue="user">
                <option value="user">{tl("Userbezogen (Standard)", userLanguage)}</option>
                <option value="system">{tl("Systembezogen", userLanguage)}</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("roXtra-Dokument ID", userLanguage)}</h3>
              <div>
                <p>{tl("Die ID zu einem roXtra-Dokument dass eine .xlsx oder .csv-Datei enthält.", userLanguage)}</p>
              </div>
              <SheetFilterTargetHelp userLanguage={userLanguage} />
              <FileFetchModeHelp userLanguage={userLanguage} />
              <ErrorHelp userLanguage={userLanguage} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
