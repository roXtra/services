import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function loopCountConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Max. Anzahl an Iterationen", userLanguage)}</span>
            </td>
            <td>
              <input id="maxIterations" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Erklärung Eingabefeld", userLanguage)}</h3>
              <div>
                <p>{tl("Max. Anzahl an Iterationen, die ein BPMN-Element durchlaufen kann, bevor die Ausführung unterbrochen wird.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
