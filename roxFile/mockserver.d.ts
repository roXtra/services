declare module "mockserver-node" {
  // eslint-disable-next-line camelcase,@typescript-eslint/camelcase,@typescript-eslint/no-explicit-any
  export function start_mockserver(options: any): Promise<void>;
  // eslint-disable-next-line camelcase,@typescript-eslint/camelcase,@typescript-eslint/no-explicit-any
  export function stop_mockserver(options: any): Promise<void>;
}

declare module "mockserver-client" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function mockServerClient(host: string, port: number, contextPath?: any): any;
}