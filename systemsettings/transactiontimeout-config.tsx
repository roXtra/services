import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function transactionTimeoutConfig(userLanguage: Language): JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Transaktions-Timeout", userLanguage)}</span>
            </td>
            <td>
              <input id="transactionTimeout" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Erklärung Transaktions-Timeout", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "Setzt das Transaktions-Timeout für zukünftige Datenbank-Transaktionen in ms. Das Timeout der aktuell laufenden Transaktion bleibt unverändert.",
                    userLanguage,
                  )}
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
