import * as PH from "processhub-sdk";

export default class MathServiceMethods {
  static getNumberFromField(environment: PH.ServiceTask.ServiceTaskEnvironment, fieldName: string): number {
    return ((environment.instanceDetails.extras.fieldContents[fieldName] as PH.Data.FieldValue).value as number);
  }
}