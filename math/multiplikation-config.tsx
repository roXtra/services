import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function multiplikationConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Zahl 1", userLanguage)}</span>
            </td>
            <td>
              <select id="numberField1" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Zahl 2", userLanguage)}</span>
            </td>
            <td>
              <select id="numberField2" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ergebnis", userLanguage)}</span>
            </td>
            <td>
              <input id="targetField" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
