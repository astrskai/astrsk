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
      toolCall: any;
    };
  };
}

// Retrieve API
export interface RetrieveRequest {
  query: string;
  compressedText: string;
  requestingCharacter?: string;
  anchorMappings: Record<string, {
    text: string;
    accessible_to: string[];
    starting_text: string;
  }>;
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
      anchorMappings: Record<string, {
        text: string;
        accessible_to: string[];
        starting_text: string;
      }>;
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
      toolCall: any;
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

/**
 * Compression API Client
 * HTTP wrapper for cloud-hosted LLM compression backend
 */
export class CompressionApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  /**
   * Compress text into XML with semantic anchors
   * Uses structured output agent
   */
  async compress(request: CompressRequest): Promise<CompressionOutput> {
    try {
      const response = await fetch(`${this.baseUrl}/compress`, {
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
      const response = await fetch(`${this.baseUrl}/retrieve`, {
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
      const response = await fetch(`${this.baseUrl}/response`, {
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

      const response = await fetch(`${this.baseUrl}/chunk`, {
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
}

/**
 * Singleton instance
 */
export const compressionApi = new CompressionApi();
