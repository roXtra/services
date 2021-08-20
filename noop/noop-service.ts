// We need to reference the types here explicitly as otherwise, compilation errors for missing module declarations for "modeler/bpmn/bpmn" and "bpmn-moddle/lib/simple" occur
/* eslint-disable-next-line spaced-comment */
/// <reference path="node_modules/processhub-sdk/src/process/types/index.d.ts" />
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";

// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
export async function noop(environment: IServiceTaskEnvironment): Promise<boolean> {
  // Do nothing
  return true;
}
