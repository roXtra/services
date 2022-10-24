import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function startInstanceConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Zu startender Prozess", userLanguage)}</span>
            </td>
            <td>
              <select id="processId" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Felder", userLanguage)}</span>
            </td>
            <td>
              <select multiple id="fields" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("ID des ausführenden Users", userLanguage)}</span>
            </td>
            <td>
              <input id="executingUserId" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
