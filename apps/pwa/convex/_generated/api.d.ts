/* eslint-disable */
/**
 * Curated `api` utility for PWA.
 * 
 * Only includes functions that are actually used by the PWA application.
 * This is a manual override of the generated API to prevent import errors.
 * @module
 */

import type {
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: {
  sessionMutations: {
    createEditingSession: FunctionReference<"mutation", "public", any, any>;
    getEditingSession: FunctionReference<"query", "public", any, any>;
    commitSessionChanges: FunctionReference<"mutation", "public", any, any>;
    revertSession: FunctionReference<"mutation", "public", any, any>;
  };
  vibe_coding: {
    mutations: {
      imageMutations: {
        generateNanoBananaImage: FunctionReference<"action", "public", any, any>;
        generateCustomImage: FunctionReference<"action", "public", any, any>;
        generateImageToImage: FunctionReference<"action", "public", any, any>;
        getImageOptions: FunctionReference<"action", "public", any, any>;
      };
    };
  };
};

export declare const internal: {};