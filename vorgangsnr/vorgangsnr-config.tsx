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
            <small>{tl("Optional: Legt fest, welche Instanzen in die Zählung eingehen.", userLanguage)}</small>
          </td>
          <td style={{ width: "70%" }}>
            <input id="conditionfield" style={{ width: "100%" }} />
          </td>
        </tr>

        <tr>
          <td style={{ width: "30%" }}>
            <span>{tl("Vorgangsnummer-Ausdruck", userLanguage)}</span>
            <br />
            <small>{tl("Setzt festen Text und berechnete Platzhalter zur Vorgangsnummer zusammen.", userLanguage)}</small>
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
                <strong>{tl("Zweck:", userLanguage)}</strong>{" "}
                {tl("Der optionale Filter legt fest, welche Instanzen gezählt werden. Ohne Filter werden alle Instanzen berücksichtigt.", userLanguage)}
              </p>
              <p>
                <strong>{tl("Felder:", userLanguage)}</strong> {tl("Feldwerte sprechen Sie mit field['Feldname'] an.", userLanguage)}
              </p>
              <p>{tl("Vergleiche: == und != mit Typumwandlung; === und !== ohne. Außerdem <, <=, > und >=.", userLanguage)}</p>
              <p>{tl("Bedingungen verbinden: && bedeutet UND, || bedeutet ODER und ! kehrt eine Bedingung um.", userLanguage)}</p>
              <p>
                <strong>{tl("Beispiele:", userLanguage)}</strong>
              </p>
              <ul>
                <li>{"field['CAPA notwendig?'] === 'Ja'"}</li>
                <li>{"field['Menge'] == 10"}</li>
                <li>{"field['Abteilung'] === 'QM' && field['Status'] !== 'Abgeschlossen'"}</li>
                <li>{"field['Abteilung'] === 'QM' || (field['Abteilung'] === 'Produktion' && field['Status'] !== 'Abgeschlossen')"}</li>
                <li>{"field['Freigabe']['Erteilt'] === true"}</li>
              </ul>
              <p>{tl("Funktionsaufrufe sind nicht zulässig. Fehlt ein Feld, hat es den Wert undefined.", userLanguage)}</p>
            </div>

            <h3>{tl("So funktioniert der Ausdruck", userLanguage)}</h3>
            <div>
              <p>
                <strong>{tl("Aufbau:", userLanguage)}</strong> {tl("Fester Text bleibt unverändert. Berechnete Werte setzen Sie in ${...} ein, zum Beispiel", userLanguage)}{" "}
                {"CAPA-${yearlyInstanceNumber}-${instanceYear}"}
              </p>
              <p>
                <strong>{tl("Rechnen:", userLanguage)}</strong> {tl("Verwenden Sie +, -, *, / und %.", userLanguage)}
              </p>
              <p>{tl("Vergleiche: == und != mit Typumwandlung; === und !== ohne. Außerdem <, <=, > und >=.", userLanguage)}</p>
              <p>
                {tl("Bedingungen: && bedeutet UND, || bedeutet ODER, ! bedeutet NICHT. Mit ? und : wählen Sie abhängig von einer Bedingung einen Wert aus.", userLanguage)}
              </p>
              <p>{tl("Jeder Platzhalter muss mindestens eine Variable aus der folgenden Liste enthalten. Funktionsaufrufe sind nicht zulässig.", userLanguage)}</p>
              <p>
                <strong>{tl("Verfügbare Variablen:", userLanguage)}</strong>
              </p>
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
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Der Monat der aktuellen Instanz, beginnend bei 0 (Januar = 0).", userLanguage)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>instanceDay</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{tl("Der Tag der aktuellen Instanz.", userLanguage)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>dailyInstanceNumber</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>
                        {tl("Anzahl der passenden Instanzen am selben Tag, einschließlich des aktuellen Vorgangs.", userLanguage)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>monthlyInstanceNumber</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>
                        {tl("Anzahl der passenden Instanzen im selben Monat, einschließlich des aktuellen Vorgangs.", userLanguage)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>yearlyInstanceNumber</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>
                        {tl("Anzahl der passenden Instanzen im selben Jahr, einschließlich des aktuellen Vorgangs.", userLanguage)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>totalInstanceNumber</td>
                      <td style={{ borderWidth: "1px", padding: "4px" }}>
                        {tl("Gesamtanzahl der passenden Instanzen, einschließlich des aktuellen Vorgangs.", userLanguage)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: "8px", marginBottom: "16px" }}>
                <p>
                  <strong>{tl("Beispiele:", userLanguage)}</strong>
                </p>
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
                      <td style={{ borderWidth: "1px", padding: "4px" }}>{"CAPA-${monthlyInstanceNumber}-${instanceMonth + 1}"}</td>
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
              <p>{tl("CONFIG_INVALID: Prüfen Sie, ob Zielfeld und Ausdruck angegeben sind.", userLanguage)}</p>
              <p>{tl("FILTER_ERROR: Prüfen Sie die Schreibweise der Feldnamen und die Syntax der Filterbedingung.", userLanguage)}</p>
              <p>{tl("EXPRESSION_ERROR: Prüfen Sie ${...}-Platzhalter, Variablennamen und Operatoren.", userLanguage)}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
