import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function readFileConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("SharePoint URL", userLanguage)}</span>
            </td>
            <td>
              <input id="sharepointUrl" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Directory (tenant) ID", userLanguage)}</span>
            </td>
            <td>
              <input id="tenantId" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Application (client) ID", userLanguage)}</span>
            </td>
            <td>
              <input id="clientId" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Certificate thumbprint", userLanguage)}</span>
            </td>
            <td>
              <input id="certThumbprint" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Pfad zur Zertifikatsdatei", userLanguage)}</span>
            </td>
            <td>
              <input id="certPrivateKeyPath" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Link zur Datei im SharePoint", userLanguage)}</span>
            </td>
            <td>
              <input id="fileUrl" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ergebnisfeld", userLanguage)}</span>
            </td>
            <td>
              <select id="targetField" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td colSpan={2}>
              <h3>{tl("SharePoint URL", userLanguage)}</h3>
              <div>
                <p>{tl("URL zum SharePoint in der Form https://{tenant}.sharepoint.com/", userLanguage)}</p>
              </div>
              <h3>{tl("Directory (tenant) ID", userLanguage)}</h3>
              <div>
                <p>{tl("Tenant ID der Microsoft AAD App.", userLanguage)}</p>
              </div>
              <h3>{tl("Application (client) ID", userLanguage)}</h3>
              <div>
                <p>{tl("ID der Microsoft AAD App.", userLanguage)}</p>
              </div>
              <h3>{tl("Certificate thumbprint", userLanguage)}</h3>
              <div>
                <p>{tl("Thumbprint des Zertifikats, das in der Azure-App registriert ist.", userLanguage)}</p>
              </div>
              <h3>{tl("Pfad zur Zertifikatsdatei", userLanguage)}</h3>
              <div>
                <p>{tl("Pfad zur Zertifikatsdatei im .pem-Format, die den privaten Schlüssel des Zertifikats enthält.", userLanguage)}</p>
              </div>
              <h3>{tl("Link zur Datei im SharePoint", userLanguage)}</h3>
              <div>
                <p>{tl("Link zur Datei im SharePoint, die gelesen werden soll (kann über'Link kopieren' erzeugt werden).", userLanguage)}</p>
              </div>
              <h3>{tl("Ergebnisfeld", userLanguage)}</h3>
              <div>
                <p>{tl("Dateianhangsfeld, in dem die Datei gespeichert wird.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
