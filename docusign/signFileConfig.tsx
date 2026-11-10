import { tl } from "@roxtra/processhub-sdk/lib/tl.js";
import { Language } from "@roxtra/processhub-sdk/lib/tl.js";

export function signFileConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Zu signierende Datei", userLanguage)}</span>
            </td>
            <td>
              <select id="sourceField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Nachricht (Optional)", userLanguage)}</span>
            </td>
            <td>
              <input id="message" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Webhook im Vorgang triggern?", userLanguage)}</span>
            </td>
            <td>
              <select id="triggerWebhook" defaultValue="false">
                <option value="true">Ja</option>
                <option value="false">Nein</option>
              </select>
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Feld für Envelope-ID", userLanguage)}</span>
            </td>
            <td>
              <select id="signatureIdField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Feld für Signatur-URL (Optional – aktiviert eingebettetes Signieren)", userLanguage)}</span>
            </td>
            <td>
              <select id="signatureUrlField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Signaturart (Optional)", userLanguage)}</span>
            </td>
            <td>
              <select id="signatureProvider" defaultValue="">
                <option value="">{tl("Standard (SES / Click-to-Sign)", userLanguage)}</option>
                <option value="UniversalSignaturePen_OpenTrust_Hash_TSP">{tl("EU Advanced (AES / eIDAS) – SMS oder OTP", userLanguage)}</option>
                <option value="DocuSign_EU_QES_Namirial">{tl("EU Qualifiziert (QES) – Namirial QTSP", userLanguage)}</option>
                <option value="UniversalSignaturePen_IDnow_QES">{tl("EU Qualifiziert (QES) – IDnow Video-Ident", userLanguage)}</option>
              </select>
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Telefonnummer für Phone Authentication oder EU Advanced SMS-OTP", userLanguage)}</span>
            </td>
            <td>
              <input id="signerPhoneNumber" placeholder="+4915112345678" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Phone Authentication (Optional)", userLanguage)}</span>
            </td>
            <td>
              <input id="phoneAuthenticationCountryCode" placeholder="auto" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Zugangscode für Dokumentzugriff (Optional)", userLanguage)}</span>
            </td>
            <td>
              <input id="recipientAccessCode" placeholder={'field["Zugangscode"]'} />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Code für Signaturabschluss (Optional – EU Advanced)", userLanguage)}</span>
            </td>
            <td>
              <input id="accessCode" />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <h3>{tl("Hinweise zur Konfiguration", userLanguage)}</h3>
              <div>
                <p>{tl("Sendet das ausgewählte Dokument an DocuSign und fordert den Inhaber der aktuellen Rolle zur Signierung auf.", userLanguage)}</p>

                <h3>{tl("Zu signierende Datei", userLanguage)}</h3>
                <p>
                  {tl(
                    "Dateianhangsfeld, das die zu signierende Datei enthält. Enthält das Feld mehrere Dateien, wird nur die erste Datei an DocuSign gesendet.",
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Nachricht", userLanguage)}</h3>
                <p>{tl("Optionale Nachricht, die dem Unterzeichner in der DocuSign-Signaturanfrage angezeigt wird.", userLanguage)}</p>

                <h3>{tl("Webhook im Vorgang triggern?", userLanguage)}</h3>
                <p>
                  {tl(
                    "Gibt an, ob nach erfolgreichem Abschluss der Signatur ein Webhook im Vorgang ausgelöst werden soll. Das nächste auf diesen ServiceTask folgende Intermediate- oder BoundaryMessageEvent vom Typ Webhook wird ausgelöst.",
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Feld für Envelope-ID", userLanguage)}</h3>
                <p>{tl("Textfeld, in dem die DocuSign Envelope-ID gespeichert wird. Wird benötigt, um das signierte Dokument später herunterzuladen.", userLanguage)}</p>

                <h3>{tl("Feld für Signatur-URL", userLanguage)}</h3>
                <p>
                  {tl(
                    "Optionales Textfeld für die eingebettete Signatur-URL. Wird dieses Feld angegeben, wird eingebettetes Signieren aktiviert: DocuSign versendet keine E-Mail, stattdessen kann der Unterzeichner über die gespeicherte URL direkt signieren.",
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Signaturart", userLanguage)}</h3>
                <p>{tl("Wählt die Signaturqualität – entspricht dem Skribble-Konzept SES/AES/QES:", userLanguage)}</p>
                <ul>
                  <li>{tl("Standard (SES): Einfache elektronische Signatur, Click-to-Sign.", userLanguage)}</li>
                  <li>
                    {tl(
                      "EU Advanced (AES): Standards-Based Signature gemäß eIDAS. Erfordert SMS-OTP-Telefonnummer oder Zugangscode. DocuSign-Account muss AES unterstützen.",
                      userLanguage,
                    )}
                  </li>
                  <li>
                    {tl(
                      "EU Qualifiziert (QES): Die Identitätsprüfung für die qualifizierte Signatur übernimmt der Qualified Trust Service Provider (QTSP), zum Beispiel per Video-Ident oder Ausweis-Scan. DocuSign muss den Signaturanbieter für das Konto freischalten.",
                      userLanguage,
                    )}
                  </li>
                </ul>

                <h3>{tl("Telefonnummer", userLanguage)}</h3>
                <p>
                  {tl(
                    'Für Phone Authentication oder EU Advanced per SMS eine feste internationale Telefonnummer (z. B. +4915112345678) oder ein Vorgangsfeld (z. B. field["Telefonnummer"] oder {field["Telefonnummer"]}) angeben. Das Vorgangsfeld muss beim Ausführen des Tasks eine internationale Telefonnummer mit führendem + und ohne Trennzeichen enthalten.',
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Phone Authentication", userLanguage)}</h3>
                <p>
                  {tl(
                    "Mit auto ermittelt der Service die Ländervorwahl aus der internationalen Telefonnummer. Eine feste Vorwahl wie +49 ist ebenfalls möglich. Ein leeres Feld deaktiviert die Telefonprüfung vor dem Öffnen des Dokuments. DocuSign sendet den Prüfcode per SMS oder Anruf, nachdem der Unterzeichner die Methode gewählt hat. Der Workflow Phone Authentication muss für das Konto verfügbar sein.",
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Zugangscode für Dokumentzugriff", userLanguage)}</h3>
                <p>
                  {tl(
                    'Gib einen festen Zugangscode oder ein Textfeld aus dem Vorgang an, z. B. field["Zugangscode"]. DocuSign fragt den Code vor dem Anzeigen des Dokuments ab. Teile ihn dem Unterzeichner separat mit. Der Code darf maximal 50 Zeichen enthalten. Die Zeichen <, >, & und # sind unzulässig.',
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Code für Signaturabschluss", userLanguage)}</h3>
                <p>
                  {tl(
                    "Für EU Advanced wird der feste Zugangscode beim Abschluss der Signatur abgefragt, wenn Phone Authentication und die Telefonnummer leer sind. Ein verknüpftes Vorgangsfeld für die Telefonnummer darf dafür leer bleiben. Bei Embedded Signing wird bei fehlgeschlagenem Code auf die Rück-URL mit dem Parameter ?event=access_code_failed weitergeleitet.",
                    userLanguage,
                  )}
                </p>

                <h3>{tl("Mögliche Fehler", userLanguage)}</h3>
                <p>{tl("CONFIG_INVALID: Fehlende oder fehlerhafte Konfiguration.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
