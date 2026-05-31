import type { AppContainer } from "../bootstrap/app-container";

/**
 * Request context passed from Hono into oRPC handlers.
 */
export type ORPCContext = {
  container: AppContainer;
  requestId: string;
};
