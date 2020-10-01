import * as PH from "processhub-sdk";

// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
export async function noop(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  // Do nothing
  return true;
}
