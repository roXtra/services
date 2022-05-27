// We need to reference the types here explicitly as otherwise, compilation errors for missing module declarations for "modeler/bpmn/bpmn" and "bpmn-moddle/lib/simple" occur
/* eslint-disable-next-line spaced-comment */
/// <reference path="node_modules/processhub-sdk/src/process/types/index.d.ts" />
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { sleep } from "processhub-sdk/lib/tools/timing";

export async function noop(environment: IServiceTaskEnvironment): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  const fields = config?.fields;
  const waitInSec = fields?.find((f) => f.key === "waitInSec")?.value;
  if (waitInSec != null) {
    const seconds = Number.parseInt(waitInSec);
    if (!Number.isNaN(seconds)) {
      for (let i = 0; i < seconds; i++) {
        await sleep(1000);
        environment.logger.debug(`Waited ${i + 1} of ${seconds} seconds`);
      }
    }
  }

  return true;
}
