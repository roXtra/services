import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";

export default class MathServiceMethods {
  static getNumberFromField(environment: IServiceTaskEnvironment, fieldName: string): number {
    if (environment.instanceDetails.extras.fieldContents === undefined) {
      throw new Error("environment.instanceDetails.extras.fieldContents is undefined, cannot proceed!");
    }

    return (environment.instanceDetails.extras.fieldContents[fieldName] as IFieldValue).value as number;
  }
}
