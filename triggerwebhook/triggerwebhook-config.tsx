import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function triggerwebhookPostConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Webhook URL", userLanguage)}</span>
            </td>
            <td>
              <input id="webhookAddress" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Header", userLanguage)}</span>
            </td>
            <td>
              <textarea id="headers" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Request Body", userLanguage)}</span>
            </td>
            <td>
              <textarea id="bodyData" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Erklärung Webhook Adresse", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "Die Webadresse (URL) des Webhooks, die aufgerufen werden soll. Es können Platzhalter für Werte kompatibler Felder eingesetzt werden (z.B. field['test']). Werte aus der config.json können z.B. mit secret['test'] eingesetzt werden.",
                    userLanguage,
                  )}
                </p>
              </div>
              <h3>{tl("Erklärung Header", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "HTTP Header, die für den Request gesetzt werden sollen. Header Key und Value müssen dabei im Format \"Key: Wert\" (getrennt durch \": \") angegeben werden. Sofern mehrere Header angegeben werden, muss jeder Header in einer eigenen Zeile stehen. Es können Platzhalter für Werte kompatibler Felder eingesetzt werden (z.B. field['test']). Werte aus der config.json können z.B. mit secret['test'] eingesetzt werden.",
                    userLanguage,
                  )}
                </p>
              </div>
              <h3>{tl("Erklärung Body", userLanguage)}</h3>
              <div>
                <p>
                  {tl(
                    "Der Body, der mit dem Request gesendet wird (z.B. JSON). Es können Platzhalter für Werte kompatibler Felder eingesetzt werden (z.B. field['test']). Werte aus der config.json können z.B. mit secret['test'] eingesetzt werden.",
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
