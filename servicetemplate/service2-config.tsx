import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function service2Config(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Eingabefeld", userLanguage)}</span>
            </td>
            <td>
              <input id="inputField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Auswahlfeld", userLanguage)}</span>
            </td>
            <td>
              <select id="selectField" />
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
                <p>{tl("Ein Eingabefeld dient der textuellen Eingabe.", userLanguage)}</p>
              </div>
              <h3>{tl("Erklärung Auswahlfeld", userLanguage)}</h3>
              <div>
                <p>{tl("Ein Auswahlfeld dient der Auswahl verschiedener exestierender Felder.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
