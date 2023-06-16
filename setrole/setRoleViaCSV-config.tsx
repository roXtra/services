import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function setRoleViaCSVConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Bereichsfeld", userLanguage)}</span>
            </td>
            <td>
              <select id="areaField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Dateipfad", userLanguage)}</span>
            </td>
            <td>
              <input id="filePath" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Erklärung Bereichsfeld", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "Das Bereichsfeld bezieht sich auf das Dropdown Feld bei dem der Bereich ausgewählt wird für den der Benutzer ermittelt werden soll. Dieser Benutzer wird dann in die Rolle gesetzten in der sich der ServiceTask befindet.",
                    userLanguage,
                  )}
                </p>
              </div>
              <h3>{tl("Erklärung Dateipfad", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "Der Dateipfad bezieht sich auf die Datei auf dem roXtra Server aus der die Beziehung zwischen Bereich und Benutzer herausgelesen werden kann. Das Dateiformat muss .csv oder .xlsx sein.",
                    userLanguage,
                  )}
                </p>
              </div>
              <h3>{tl("Beispiel Datei", userLanguage)}</h3>
              <div>
                <table>
                  <tbody>
                    <th style={{ borderWidth: "1px" }}>Bereich</th>
                    <th style={{ borderWidth: "1px" }}>E-Mailadresse</th>
                    <tr>
                      <td style={{ borderWidth: "1px" }}>Bereich 1</td>
                      <td style={{ borderWidth: "1px" }}>beispiel1@roxtra.com</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px" }}>Bereich 2</td>
                      <td style={{ borderWidth: "1px" }}>beispiel2@roxtra.com</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px" }}>Bereich 3</td>
                      <td style={{ borderWidth: "1px" }}>beispiel3@roxtra.com</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
