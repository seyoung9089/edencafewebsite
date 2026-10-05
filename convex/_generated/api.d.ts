/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as MacalyGoogle from "../MacalyGoogle.js";
import type * as ResendOTP from "../ResendOTP.js";
import type * as auth from "../auth.js";
import type * as authUsers from "../authUsers.js";
import type * as googleAuth from "../googleAuth.js";
import type * as http from "../http.js";
import type * as inquiries from "../inquiries.js";
import type * as macaly from "../macaly.js";
import type * as maintenance from "../maintenance.js";
import type * as menu from "../menu.js";
import type * as orders from "../orders.js";
import type * as pickupSchedule from "../pickupSchedule.js";
import type * as schedule from "../schedule.js";
import type * as siteContent from "../siteContent.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  MacalyGoogle: typeof MacalyGoogle;
  ResendOTP: typeof ResendOTP;
  auth: typeof auth;
  authUsers: typeof authUsers;
  googleAuth: typeof googleAuth;
  http: typeof http;
  inquiries: typeof inquiries;
  macaly: typeof macaly;
  maintenance: typeof maintenance;
  menu: typeof menu;
  orders: typeof orders;
  pickupSchedule: typeof pickupSchedule;
  schedule: typeof schedule;
  siteContent: typeof siteContent;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
