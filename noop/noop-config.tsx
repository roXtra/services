import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function noopConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Wartezeit in Sekunden", userLanguage)}</span>
            </td>
            <td>
              <input id="waitInSec" />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <p>{tl("Wird eine Wartezeit festgelegt, wird der Servicetask erst nach Ablauf fortgesetzt.", userLanguage)}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
