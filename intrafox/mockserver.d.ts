declare module "mockserver-node" {
  // eslint-disable-next-line camelcase,@typescript-eslint/camelcase
  export function start_mockserver(options: any): Promise<void>;
  // eslint-disable-next-line camelcase,@typescript-eslint/camelcase
  export function stop_mockserver(options: any): Promise<void>;
}

declare module "mockserver-client" {
  export function mockServerClient(host: string, port: number, contextPath?: any): any;
}