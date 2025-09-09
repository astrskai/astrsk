import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  credit: {
    public: {
      getCreditBalance: FunctionReference<
        "query",
        "public",
        Record<string, never>,
        {
          additional_balance: number;
          overdraft_amount: number;
          subscription_balance: number;
        } | null
      >;
      listCreditLogs: FunctionReference<
        "query",
        "public",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: Id<"credit_logs">;
            amount: number;
            balances_after: {
              additional_balance: number;
              overdraft_amount: number;
              subscription_balance: number;
            };
            balances_before: {
              additional_balance: number;
              overdraft_amount: number;
              subscription_balance: number;
            };
            description: string;
            related_id?: string;
            related_type?: string;
            type: "charge" | "expire" | "use";
            user_id: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        } | null
      >;
    };
  };
  payment: {
    public: {
      getSubscription: FunctionReference<
        "query",
        "public",
        Record<string, never>,
        {
          _creationTime: number;
          _id: Id<"payment_subscriptions">;
          name: string;
          reserved_credits: number;
          transaction_id?: Id<"payment_transactions">;
          user_id: string;
        } | null
      >;
    };
  };
  sessionMutations: {
    commitSessionChanges: FunctionReference<
      "mutation",
      "public",
      { sessionId: string },
      { message: string; success: boolean }
    >;
    createEditingSession: FunctionReference<
      "mutation",
      "public",
      {
        conversationHistory?: Array<any>;
        originalRequest: string;
        resourceData: any;
        resourceIds: Array<string>;
        resourceTypes?: any;
        sessionId: string;
      },
      { sessionId: string; status: string }
    >;
    getEditingSession: FunctionReference<
      "query",
      "public",
      { sessionId: string },
      null | any
    >;
    revertSession: FunctionReference<
      "mutation",
      "public",
      { sessionId: string },
      { message: string; success: boolean }
    >;
  };
  vibe_coding: {
    index: {
      commitSessionChanges: FunctionReference<
        "mutation",
        "public",
        { sessionId: string },
        { message: string; success: boolean }
      >;
      createEditingSession: FunctionReference<
        "mutation",
        "public",
        {
          conversationHistory?: Array<any>;
          originalRequest: string;
          resourceData: any;
          resourceIds: Array<string>;
          resourceTypes?: any;
          sessionId: string;
        },
        { sessionId: string; status: string }
      >;
      generateCustomImage: FunctionReference<
        "action",
        "public",
        { aspectRatio?: string; prompt: string; style?: string },
        any
      >;
      generateImageToImage: FunctionReference<
        "action",
        "public",
        {
          aspectRatio?: string;
          inputImageBase64: string;
          inputImageMimeType: string;
          prompt: string;
          style?: string;
        },
        any
      >;
      generateNanoBananaImage: FunctionReference<
        "action",
        "public",
        { prompt?: string },
        any
      >;
      getEditingSession: FunctionReference<
        "query",
        "public",
        { sessionId: string },
        null | any
      >;
      getImageOptions: FunctionReference<
        "action",
        "public",
        Record<string, never>,
        any
      >;
      revertSession: FunctionReference<
        "mutation",
        "public",
        { sessionId: string },
        { message: string; success: boolean }
      >;
    };
    mutations: {
      imageMutations: {
        generateCustomImage: FunctionReference<
          "action",
          "public",
          { aspectRatio?: string; prompt: string; style?: string },
          any
        >;
        generateImageToImage: FunctionReference<
          "action",
          "public",
          {
            aspectRatio?: string;
            inputImageBase64: string;
            inputImageMimeType: string;
            prompt: string;
            style?: string;
          },
          any
        >;
        generateNanoBananaImage: FunctionReference<
          "action",
          "public",
          { prompt?: string },
          any
        >;
        getImageOptions: FunctionReference<
          "action",
          "public",
          Record<string, never>,
          any
        >;
      };
      index: {
        commitSessionChanges: FunctionReference<
          "mutation",
          "public",
          { sessionId: string },
          { message: string; success: boolean }
        >;
        createEditingSession: FunctionReference<
          "mutation",
          "public",
          {
            conversationHistory?: Array<any>;
            originalRequest: string;
            resourceData: any;
            resourceIds: Array<string>;
            resourceTypes?: any;
            sessionId: string;
          },
          { sessionId: string; status: string }
        >;
        generateCustomImage: FunctionReference<
          "action",
          "public",
          { aspectRatio?: string; prompt: string; style?: string },
          any
        >;
        generateImageToImage: FunctionReference<
          "action",
          "public",
          {
            aspectRatio?: string;
            inputImageBase64: string;
            inputImageMimeType: string;
            prompt: string;
            style?: string;
          },
          any
        >;
        generateNanoBananaImage: FunctionReference<
          "action",
          "public",
          { prompt?: string },
          any
        >;
        getEditingSession: FunctionReference<
          "query",
          "public",
          { sessionId: string },
          null | any
        >;
        getImageOptions: FunctionReference<
          "action",
          "public",
          Record<string, never>,
          any
        >;
        revertSession: FunctionReference<
          "mutation",
          "public",
          { sessionId: string },
          { message: string; success: boolean }
        >;
      };
      sessionMutations: {
        commitSessionChanges: FunctionReference<
          "mutation",
          "public",
          { sessionId: string },
          { message: string; success: boolean }
        >;
        createEditingSession: FunctionReference<
          "mutation",
          "public",
          {
            conversationHistory?: Array<any>;
            originalRequest: string;
            resourceData: any;
            resourceIds: Array<string>;
            resourceTypes?: any;
            sessionId: string;
          },
          { sessionId: string; status: string }
        >;
        getEditingSession: FunctionReference<
          "query",
          "public",
          { sessionId: string },
          null | any
        >;
        revertSession: FunctionReference<
          "mutation",
          "public",
          { sessionId: string },
          { message: string; success: boolean }
        >;
      };
    };
  };
};
export type InternalApiType = {};
