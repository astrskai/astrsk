import type {
  CompressionOutput,
} from "@/entities/compression/domain/types";

/**
 * Get compression API base URL from environment
 */
const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_COMPRESSION_API_URL;
  if (!url) {
    throw new Error(
      "VITE_COMPRESSION_API_URL environment variable is not set"
    );
  }
  return url;
};

/**
 * Compression API - Request/Response Types
 */

// Compress API
export interface CompressRequest {
  text: string;
  type: 'character' | 'message' | 'scenario';
  characterName?: string;
  characterRegistry?: Record<string, string>; // Normalized name → Display name mapping
  previousContext?: string; // Previously compressed context
  sessionId: string; // Session ID for storing anchors in Redis backend
  turnId: string; // Turn ID for anchor cleanup on turn deletion
}

export interface CompressResponse {
  // Backend returns the CompressionOutput directly (not wrapped)
  block_tag: string;
  segments: Array<{
    starting_text: string;
    anchor: string;
    accessible_to: string[];
  }>;
  log?: {
    agent?: string;
    prompt?: {
      message1_previousContext?: string;
      message2_systemInstructions?: string;
      message3_task?: string;
    };
    input?: {
      text: string;
      type: string;
      characterName?: string;
      characterRegistry?: Record<string, string>;
    };
    output?: {
      block_tag: string;
      segments: Array<{
        starting_text: string;
        anchor: string;
        accessible_to: string[];
      }>;
    };
    rawResponse?: {
      model: string;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      toolCall: unknown;
    };
  };
}

// Retrieve API
export interface RetrieveRequest {
  query: string;
  compressedText: string;
  requestingCharacter?: string;
  sessionId: string; // Session ID for BM25 search in Redis backend
}

export interface RetrieveResponse {
  key_concepts: string[];
  response_goal: string;
  relevantAnchors: string[];
  log?: {
    agent?: string;
    prompt?: {
      message1_compressedContext?: string;
      message2_systemInstructions?: string;
      message3_task?: string;
    };
    input?: {
      query: string;
      compressedText: string;
      requestingCharacter?: string;
      sessionId: string;
    };
    output?: {
      key_concepts: string[];
      response_goal: string;
      relevantAnchors: string[];
    };
    rawResponse?: {
      model: string;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      toolCall: unknown;
    };
    filtering?: {
      totalAnchors: number;
      accessibleAnchors: number;
      filteredOut: string[];
    };
  };
}

// Response API
export interface ResponseRequest {
  user_query: string;
  system_prompt: string;
  decompressed_context: string;
  character_name: string;
}

export interface ResponseResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Chunk API
export interface ChunkRequest {
  text: string;
  max_chunk_size?: number;
}

export interface ChunkResponse {
  chunks: string[];
}

// Delete Anchors API (single turn)
export interface DeleteAnchorsRequest {
  sessionId: string;
  turnId: string;
}

export interface DeleteAnchorsResponse {
  success: boolean;
  deleted: number;
  anchors: string[];
}

// Delete Session Anchors API (bulk delete all anchors for a session)
export interface DeleteSessionAnchorsRequest {
  sessionId: string;
}

export interface DeleteSessionAnchorsResponse {
  success: boolean;
  deleted: number;
}

// Batch Delete Anchors API (bulk delete anchors for multiple turns)
export interface BatchDeleteAnchorsRequest {
  sessionId: string;
  turnIds: string[];
}

export interface BatchDeleteAnchorsResponse {
  success: boolean;
  deleted: number;
}

/**
 * Compression API Client
 * HTTP wrapper for cloud-hosted LLM compression backend
 */
export class CompressionApi {
  private baseUrl: string;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds for LLM operations

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  /**
   * Create fetch request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Compress text into XML with semantic anchors
   * Uses structured output agent
   */
  async compress(request: CompressRequest): Promise<CompressionOutput> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/compress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Compression API error: ${response.status} ${response.statusText}`
        );
      }

      const data: CompressResponse = await response.json();

      // Emit log event for debug panel
      if (data.log) {
        const logEvent = new CustomEvent("compression-log", {
          detail: {
            id: `compress-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            type: "compress",
            data: data.log,
          },
        });
        window.dispatchEvent(logEvent);
      }

      // Backend returns CompressionOutput directly
      return data as unknown as CompressionOutput;
    } catch (error) {
      console.error("[CompressionApi] compress failed:", error);
      throw error;
    }
  }

  /**
   * Retrieve relevant anchors based on user query
   * Uses structured output agent to identify which anchors to expand
   */
  async retrieve(request: RetrieveRequest): Promise<RetrieveResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/retrieve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Retrieval API error: ${response.status} ${response.statusText}`
        );
      }

      const data: RetrieveResponse = await response.json();

      // Emit log event for debug panel
      if (data.log) {
        const logEvent = new CustomEvent("compression-log", {
          detail: {
            id: `retrieve-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            type: "retrieve",
            data: data.log,
          },
        });
        window.dispatchEvent(logEvent);
      }

      return data;
    } catch (error) {
      console.error("[CompressionApi] retrieve failed:", error);
      throw error;
    }
  }

  /**
   * Generate chat completion response
   * Uses chat completion agent (not structured output)
   */
  async generateResponse(request: ResponseRequest): Promise<string> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Response API error: ${response.status} ${response.statusText}`
        );
      }

      const data: ResponseResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error("[CompressionApi] generateResponse failed:", error);
      throw error;
    }
  }

  /**
   * Split long text into chunks for compression
   * Useful for messages exceeding context window
   */
  async chunkText(
    text: string,
    maxChunkSize: number = 4000
  ): Promise<string[]> {
    try {
      const request: ChunkRequest = {
        text,
        max_chunk_size: maxChunkSize,
      };

      const response = await this.fetchWithTimeout(`${this.baseUrl}/chunk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Chunk API error: ${response.status} ${response.statusText}`
        );
      }

      const data: ChunkResponse = await response.json();
      return data.chunks;
    } catch (error) {
      console.error("[CompressionApi] chunkText failed:", error);
      throw error;
    }
  }

  /**
   * Delete all anchors for a specific turn from Redis backend
   * Called when a turn/message is deleted
   */
  async deleteAnchors(request: DeleteAnchorsRequest): Promise<DeleteAnchorsResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/anchors`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Delete anchors API error: ${response.status} ${response.statusText}`
        );
      }

      const data: DeleteAnchorsResponse = await response.json();
      console.log(
        `[CompressionApi] Deleted ${data.deleted} anchors from Redis:`,
        data.anchors
      );
      return data;
    } catch (error) {
      console.error("[CompressionApi] deleteAnchors failed:", error);
      throw error;
    }
  }

  /**
   * Delete all anchors for an entire session from Redis backend (bulk operation)
   * Called when a session is deleted
   * More efficient than deleting turn-by-turn (1 API call instead of N)
   */
  async deleteSessionAnchors(request: DeleteSessionAnchorsRequest): Promise<DeleteSessionAnchorsResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/session/${request.sessionId}/anchors`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Delete session anchors API error: ${response.status} ${response.statusText}`
        );
      }

      const data: DeleteSessionAnchorsResponse = await response.json();
      console.log(
        `[CompressionApi] Deleted ${data.deleted} anchors from Redis for session ${request.sessionId}`
      );
      return data;
    } catch (error) {
      console.error("[CompressionApi] deleteSessionAnchors failed:", error);
      throw error;
    }
  }

  /**
   * Delete anchors for multiple turns from Redis backend (batch operation)
   * Called when multiple messages are deleted
   * More efficient than deleting turn-by-turn (1 API call instead of N)
   */
  async batchDeleteAnchors(request: BatchDeleteAnchorsRequest): Promise<BatchDeleteAnchorsResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/anchors/batch`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Batch delete anchors API error: ${response.status} ${response.statusText}`
        );
      }

      const data: BatchDeleteAnchorsResponse = await response.json();
      console.log(
        `[CompressionApi] Deleted ${data.deleted} anchors from Redis for ${request.turnIds.length} turns`
      );
      return data;
    } catch (error) {
      console.error("[CompressionApi] batchDeleteAnchors failed:", error);
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
export const compressionApi = new CompressionApi();
