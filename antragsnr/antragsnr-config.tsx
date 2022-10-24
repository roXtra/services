import { tl } from "processhub-sdk/lib/tl";
import { Language } from "processhub-sdk/lib/tl";

export function antragsnrconfig(userLanguage: Language): JSX.Element {
  return (
    <table className="table table-striped table-bordered">
      <tbody>
        <tr>
          <td>
            <span>{tl("Zielfeld", userLanguage)}</span>
          </td>
          <td>
            <input id="targetfield" />
          </td>
        </tr>

        <tr>
          <td colSpan={2}>
            <h3>{tl("Erklärung Eingabefeld Zielfeld", userLanguage)}</h3>
            <div>
              <p>{tl("Im Zielfeld kann der Name des Feldes angegeben werden, in dem die Antragsnummer gespeichert werden soll.", userLanguage)}</p>
            </div>

            <h3>{tl("Mögliche Service Fehler", userLanguage)}</h3>
            <div>
              <p>
                {tl(
                  "CONFIG_INVALID: Tritt dieser Fehler auf, sollte die Konfiguration nochmals überarbeitet werden. Es könnte zum Beispiel daran liegen, dass kein Zielfeld angegeben wurde.",
                  userLanguage,
                )}
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
