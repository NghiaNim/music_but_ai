import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 */
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;

export { type AppRouter, appRouter } from "./root";
export { createTRPCContext } from "./trpc";
export {
  ALL_VENUE_SOURCES,
  syncAllVenuesToLiveEvents,
  syncMsmPerformancesToLiveEvents,
  syncVenueToLiveEvents,
  tagUntaggedCatalog,
  tagUntaggedLiveEvents,
  type SyncAllVenuesSummary,
  type VenueSyncResult,
  type VenueSyncStatus,
} from "./live-event-sync";
export {
  tagCatalog,
  type CatalogTaggerOptions,
  type CatalogTaggerResult,
} from "./catalog-tagger";
export type { RouterInputs, RouterOutputs };
