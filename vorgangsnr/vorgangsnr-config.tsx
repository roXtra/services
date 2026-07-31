import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function vorgangsnrConfig(userLanguage: Language): React.JSX.Element {
  return (
    <table className="table table-striped table-bordered" style={{ width: "100%", tableLayout: "fixed" }}>
      <tbody>
        <tr>
          <td style={{ width: "30%" }}>
            <span>{tl("Filter (optional)", userLanguage)}</span>
            <br />
            <small>{tl("Nur Instanzen mit passenden Werten werden gezählt.", userLanguage)}</small>
          </td>
          <td style={{ width: "70%" }}>
            <input id="conditionfield" style={{ width: "100%" }} />
          </td>
        </tr>

        <tr>
          <td style={{ width: "30%" }}>
            <span>{tl("Vorgangsnummer-Ausdruck", userLanguage)}</span>
            <br />
            <small>{tl("Hier wird die Ausgabe für die Nummer zusammengesetzt.", userLanguage)}</small>
          </td>
          <td style={{ width: "70%" }}>
            <input id="expressionfield" style={{ width: "100%" }} />
          </td>
        </tr>

        <tr>
          <td style={{ width: "30%" }}>
            <span>{tl("Zielfeld", userLanguage)}</span>
            <br />
            <small>{tl("Das Feld, in dem die erzeugte Vorgangsnummer gespeichert wird.", userLanguage)}</small>
          </td>
          <td style={{ width: "70%" }}>
            <input id="targetfield" style={{ width: "100%" }} />
          </td>
        </tr>

        <tr>
          <td colSpan={2}>
            <h3>{tl("So funktioniert der Filter", userLanguage)}</h3>
            <div>
              <p>
                {tl(
                  "Mit dem Filter werden nur Instanzen berücksichtigt, deren Feldwerte an die Bedingung anpassen. Verwenden Sie dafür die Schreibweise field['Feldname']. Sollte der Filter nicht angegeben werden, werden alle Instanzen berücksichtigt.",
                  userLanguage,
                )}
              </p>
              <p>{tl("Beispiele:", userLanguage)}</p>
              <ul>
                <li>{"field['CAPA notwendig?'] === 'Ja'"}</li>
                <li>{"field['Abteilung'] === 'QM' && field['Status'] !== 'Abgeschlossen'"}</li>
                <li>{"field['Abteilung'] === 'QM' || (field['Abteilung'] === 'Produktion' && field['Status'] !== 'Abgeschlossen')"}</li>
              </ul>
            </div>

            <h3>{tl("So funktioniert der Ausdruck", userLanguage)}</h3>
            <div>
              <p>{tl("Im Ausdruck wird die Vorgangsnummer zusammengesetzt. Sie können Zahlen, Texte und Platzhalter kombinieren.", userLanguage)}</p>
              <p>{tl("Verfügbare Platzhalter:", userLanguage)}</p>
              <div style={{ marginTop: "8px", marginBottom: "16px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <th style={{ borderWidth: "1px", padding: "4px" }}>{tl("Platzhalter", userLanguage)}</th>
                      <th style={{ borderWidth: "1px", padding: "4px" }}>{tl("Bedeutung", userLanguage)}</th>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>instanceYear</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Das Jahr der aktuellen Instanz.", userLanguage)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>instanceMonth</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Der Monat der aktuellen Instanz.", userLanguage)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>instanceDay</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Der Tag der aktuellen Instanz.", userLanguage)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>dailyInstanceNumber</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Anzahl der passenden Instanzen am selben Tag.", userLanguage)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>monthlyInstanceNumber</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Anzahl der passenden Instanzen im selben Monat.", userLanguage)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>yearlyInstanceNumber</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Anzahl der passenden Instanzen im selben Jahr.", userLanguage)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>totalInstanceNumber</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Gesamtanzahl der passenden Instanzen.", userLanguage)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>
                  {tl("Platzhalter können über die ${} Schreibweise eingefügt werden, z. B. ", userLanguage)}
                  {"CAPA-${yearlyInstanceNumber}-${instanceYear}"}
                </strong>
              </p>
              <div style={{ marginTop: "8px", marginBottom: "16px" }}>
                <p>{tl("Weitere Beispiele:", userLanguage)}</p>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
                  <tbody>
                    <tr>
                      <th style={{ borderWidth: "1px", padding: "4px" }}>{tl("Ausdruck", userLanguage)}</th>
                      <th style={{ borderWidth: "1px", padding: "4px" }}>{tl("Beispiel-Ergebnis", userLanguage)}</th>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-${dailyInstanceNumber}"}</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-3"}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-${monthlyInstanceNumber}-${instanceMonth}"}</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-12-7"}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-${yearlyInstanceNumber}-${instanceYear}"}</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-18-2026"}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-${totalInstanceNumber < 10 ? '0' + totalInstanceNumber : totalInstanceNumber}"}</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-04"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                <p>
                  <strong>{tl("Hinweis: Gelöschte Vorgänge werden für die Berechnung der Nummer nicht berücksichtigt.", userLanguage)}</strong>
                </p>
              </div>
            </div>

            <h3>{tl("Wo die Nummer gespeichert wird", userLanguage)}</h3>
            <div>
              <p>{tl("Im Zielfeld geben Sie den Namen des Feldes an, in dem die erzeugte Vorgangsnummer später sichtbar sein soll.", userLanguage)}</p>
            </div>

            <h3>{tl("Mögliche Fehler", userLanguage)}</h3>
            <div>
              <p>{tl("CONFIG_INVALID: Bitte prüfen Sie die Konfiguration, zum Beispiel ob ein Zielfeld angegeben wurde.", userLanguage)}</p>
              <p>{tl("FILTER_ERROR: Bitte prüfen Sie den Filter auf Syntaxfehler oder unpassende Feldnamen.", userLanguage)}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
