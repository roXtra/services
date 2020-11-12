import * as PH from "processhub-sdk";

export default class MathServiceMethods {
  static getNumberFromField(environment: PH.ServiceTask.IServiceTaskEnvironment, fieldName: string): number {
    if (environment.instanceDetails.extras.fieldContents === undefined) {
      throw new Error("environment.instanceDetails.extras.fieldContents is undefined, cannot proceed!");
    }

    return (environment.instanceDetails.extras.fieldContents[fieldName] as PH.Data.IFieldValue).value as number;
  }
}
