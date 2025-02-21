import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function triggerwebhookPostConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("HTTP Method", userLanguage)}</span>
            </td>
            <td>
              <select id="webhookMethod" defaultValue="POST">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </td>
          </tr>

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

          <tr>
            <td>
              <span>{tl("Response Body in Feld schreiben?", userLanguage)}</span>
            </td>
            <td>
              <select id="writeResponseInTargetField" defaultValue="false">
                <option value="true">Ja</option>
                <option value="false">Nein</option>
              </select>
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Response Body", userLanguage)}</span>
            </td>
            <td>
              <select id="responseTargetField" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("Erklärung HTTP Method", userLanguage)}</h3>
              <div>
                <p>{tl("Die HTTP Methode, die zum Aufruf des Webhooks verwendet wird.", userLanguage)}</p>
              </div>
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
                <p>{tl("Der Body wird nur für Anfragen mit der HTTP Methode POST oder PUT mitgesendet.", userLanguage)}</p>
              </div>
              <h3>{tl("Response Body in Feld schreiben?", userLanguage)}</h3>
              <div>
                <p>{tl("Definiert, ob die Antwort der Anfrage in das definierte Feld 'Response Body' geschrieben wird.", userLanguage)}</p>
              </div>
              <h3>{tl("Response Body", userLanguage)}</h3>
              <div>
                <p>{tl("Das Textfeld, in das die Antwort der Anfrage bei erfolgreicher Ausführung geschrieben wird.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
