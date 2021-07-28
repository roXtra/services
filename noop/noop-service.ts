import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";

// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
export async function noop(environment: IServiceTaskEnvironment): Promise<boolean> {
  // Do nothing
  return true;
}
