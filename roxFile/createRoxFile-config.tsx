import * as React from "react";
import * as Semantic from "semantic-ui-react";
import * as PH from "processhub-sdk";

export function createRoxFileConfig() {
  return <Semantic.Modal.Content>
    <div id="service-form" className="ui form center">

      <Semantic.Table striped>
        <Semantic.Table.Body>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Dateifeld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="roxFile"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Dateititelfeld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="title"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Dokumenttyp"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="docType"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Beschreibungfeld"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <select
                id="description"
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Ziel ID"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="destinationID"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Ziel Typ"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="destinationType"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>

          <Semantic.Table.Row>
            <Semantic.Table.Cell>
              <PH.TL text={"Name des Feldes für Feld ID"} />
            </Semantic.Table.Cell>
            <Semantic.Table.Cell>
              <Semantic.Input
                id="fileIDFieldName"
                fluid
              />
            </Semantic.Table.Cell>
          </Semantic.Table.Row>
        </Semantic.Table.Body>
      </Semantic.Table>



      <Semantic.Table.Row>
        <Semantic.Table.Cell colSpan="2">
          <h3>Erklärung Eingabefeld</h3>
          <div>
            <p>Ein Eingabefeld dient der textuellen Eingabe.</p>
          </div>
          <h3>Erklärung Auswahlfeld</h3>
          <div>
            <p>Ein Auswahlfeld dient der Auswahl verschiedener exestierender Felder.</p>
          </div>
        </Semantic.Table.Cell>
      </Semantic.Table.Row>
    </div>
  </Semantic.Modal.Content>;
}