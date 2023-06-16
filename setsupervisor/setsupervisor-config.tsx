import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function setsupervisorConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="setsupervisor-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Rolle des Mitarbeiters", userLanguage)}</span>
            </td>
            <td>
              <input id="userRoleId" />
            </td>
          </tr>
          <tr>
            <td>
              <span>{tl("Rolle des Vorgesetzten", userLanguage)}</span>
            </td>
            <td>
              <input id="supervisorRoleId" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
