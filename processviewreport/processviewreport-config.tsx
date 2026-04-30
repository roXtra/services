import { tl } from "processhub-sdk/lib/tl.js";
import { Language } from "processhub-sdk/lib/tl.js";

export function processviewreportConfig(userLanguage: Language): React.JSX.Element {
  return (
    <div id="service-form" className="ui form center">
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <td>
              <span>{tl("Prozess auswählen", userLanguage)}</span>
            </td>
            <td>
              <select id="processId" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Öffentliche Ansicht (ID)", userLanguage)}</span>
            </td>
            <td>
              <input id="publicViewId" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Ziel-Feld (Bericht)", userLanguage)}</span>
            </td>
            <td>
              <select id="reportField" />
            </td>
          </tr>

          <tr>
            <td>
              <span>{tl("Dateiname-Feld (optional)", userLanguage)}</span>
            </td>
            <td>
              <select id="fileNameField" />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <h3>{tl("Hinweise zur Konfiguration", userLanguage)}</h3>
              <div>
                <p>{tl("Geben Sie den Prozess an, dessen öffentliche Ansicht benutzt werden soll.", userLanguage)}</p>
                <p>{tl("Die ID der öffentlichen Ansicht kann aus der Ansichtskonfiguration kopiert werden.", userLanguage)}</p>
                <p>{tl("Der erzeugte Bericht wird als Datei im angegebenen Zielfeld gespeichert und kann von nachfolgenden Tasks verwendet werden.", userLanguage)}</p>

                <h3>{tl("Mögliche Fehler", userLanguage)}</h3>
                <p>{tl("CONFIG_INVALID: Fehlende oder fehlerhafte Konfiguration.", userLanguage)}</p>
                <p>{tl("VIEW_NOT_FOUND: Die angegebene öffentliche Ansicht konnte nicht gefunden werden.", userLanguage)}</p>
                <p>{tl("PERMISSION_ERROR: Der auslösende Benutzer hat keine Berechtigung für den Prozess.", userLanguage)}</p>
                <p>{tl("TIMER_START: Der Service darf nicht im Systemkontext (TimerStartEvent) ausgeführt werden.", userLanguage)}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
