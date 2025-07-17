export enum ErrorCodes {
  API_ERROR = "API_ERROR",
}

export interface IRequestHeader extends Record<string, string> {
  Accept: "application/json";
  "Content-Type": "application/json";
  "ef-authtoken": string;
  authtoken: string;
}
