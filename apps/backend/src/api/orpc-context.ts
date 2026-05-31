import type { AppContainer } from "../bootstrap/app-container";

export type ORPCContext = {
  container: AppContainer;
  requestId: string;
};
