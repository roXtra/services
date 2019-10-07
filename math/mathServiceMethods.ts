import * as PH from "processhub-sdk";

export default class MathServiceMethods {
  static getNumberFromField(environment: PH.ServiceTask.IServiceTaskEnvironment, fieldName: string): number {
    return ((environment.instanceDetails.extras.fieldContents[fieldName] as PH.Data.IFieldValue).value as number);
  }
}