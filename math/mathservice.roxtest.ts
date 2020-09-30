import { assert } from "chai";
import * as PH from "processhub-sdk";
import * as Addition from "./addition-service";
import * as Subtraktion from "./subtraktion-service";
import * as Multiplikation from "./multiplikation-service";
import * as Division from "./division-service";
import * as fs from "fs";

const operators = {
  ADDITION: 0,
  SUBTRAKTION: 1,
  MULTIPLIKATION: 2,
  DIVISION: 3,
};

const serviceTaskIDs = [
  "ServiceTask_C479EDB7D2E3D038", // Addition-service id
  "ServiceTask_7E48F9F434FFC8E0", // Subtraktion-service id
  "ServiceTask_8A0A4BACC8498EBA", // Multiplikation-service id
  "ServiceTask_134D60764565E6B9", // Division-service id
];

describe("services", () => {
  describe("math", () => {
    function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string, number1: number, number2: number): PH.ServiceTask.IServiceTaskEnvironment {
      const env = PH.Test.createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      env.fieldContents = { Feld_1: { type: "ProcessHubNumber", value: number1 }, Feld_2: { type: "ProcessHubNumber", value: number2 } };
      env.instanceDetails.extras.fieldContents = env.fieldContents;

      return env;
    }

    async function executeMathTest(num1: number, num2: number, expResult: number, operator: number): Promise<void> {
      const env = createEnvironment("./testfiles/math-service.bpmn", serviceTaskIDs[operator], num1, num2);

      switch (operator) {
        case operators.ADDITION:
          await Addition.serviceLogic(env);
          break;
        case operators.SUBTRAKTION:
          await Subtraktion.serviceLogic(env);
          break;
        case operators.MULTIPLIKATION:
          await Multiplikation.serviceLogic(env);
          break;
        case operators.DIVISION:
          await Division.serviceLogic(env);
          break;
      }

      if (operator === operators.DIVISION && num2 === 0) {
        assert.equal((env.instanceDetails.extras.fieldContents.Feld_1 as PH.Data.IFieldValue).value as number, num1);
        assert.equal((env.instanceDetails.extras.fieldContents.Feld_2 as PH.Data.IFieldValue).value as number, num2);
        assert.isUndefined(env.instanceDetails.extras.fieldContents.Ergebnis as PH.Data.IFieldValue);
      } else {
        assert.equal((env.instanceDetails.extras.fieldContents.Feld_1 as PH.Data.IFieldValue).value as number, num1);
        assert.equal((env.instanceDetails.extras.fieldContents.Feld_2 as PH.Data.IFieldValue).value as number, num2);
        assert.closeTo((env.instanceDetails.extras.fieldContents.Ergebnis as PH.Data.IFieldValue).value as number, expResult, 0.0001);
      }
    }

    // Addition Tests
    it("executes addition_a5185c7e-62f6-4f8c-8913-f28a95da0005", async () => {
      await executeMathTest(1, 2, 3, operators.ADDITION);
    });

    it("executes addition_c3d5248b-17d7-4670-8990-8e5872792d9b", async () => {
      await executeMathTest(2, 1, 3, operators.ADDITION);
    });

    it("executes addition_f247910d-9629-426d-898c-1a2720ec0318", async () => {
      await executeMathTest(1, 0, 1, operators.ADDITION);
    });

    it("executes addition_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(1, -1, 0, operators.ADDITION);
    });

    it("executes addition_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(-2, -1, -3, operators.ADDITION);
    });

    // Subtraktion Tests
    it("executes subtraktion_asd0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(2, 1, 1, operators.SUBTRAKTION);
    });

    it("executes subtraktion_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(1, 2, -1, operators.SUBTRAKTION);
    });

    it("executes subtraktion_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(1, 1, 0, operators.SUBTRAKTION);
    });

    it("executes subtraktion_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(-2, 1, -3, operators.SUBTRAKTION);
    });

    it("executes subtraktion_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(2, -1, 3, operators.SUBTRAKTION);
    });

    it("executes subtraktion_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(-2, -1, -1, operators.SUBTRAKTION);
    });

    it("executes subtraktion_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(-1, -1, 0, operators.SUBTRAKTION);
    });

    // Multiplikation Tests
    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(1, 1, 1, operators.MULTIPLIKATION);
    });

    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(1, 2, 2, operators.MULTIPLIKATION);
    });

    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(3, 2, 6, operators.MULTIPLIKATION);
    });

    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(2, 3, 6, operators.MULTIPLIKATION);
    });

    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(-2, -3, 6, operators.MULTIPLIKATION);
    });

    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(2, -3, -6, operators.MULTIPLIKATION);
    });

    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(-2, 3, -6, operators.MULTIPLIKATION);
    });

    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(0, 3, 0, operators.MULTIPLIKATION);
    });

    it("executes multiplikation_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(0, -3, 0, operators.MULTIPLIKATION);
    });

    // Division Tests
    it("executes division_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(2, 1, 2, operators.DIVISION);
    });

    it("executes division_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(1, 2, 0.5, operators.DIVISION);
    });

    it("executes division_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(2, 2, 1, operators.DIVISION);
    });

    it("executes division_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(0, 2, 0, operators.DIVISION);
    });

    it("executes division_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(-2, 1, -2, operators.DIVISION);
    });

    it("executes division_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(2, -1, -2, operators.DIVISION);
    });

    it("executes division_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(-2, -1, 2, operators.DIVISION);
    });

    it("executes division_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
      await executeMathTest(1, 0, 2, operators.DIVISION);
    });
  });
});
