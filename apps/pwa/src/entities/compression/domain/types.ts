// Compression segment (one chunk of text → one anchor)
export interface CompressionSegment {
  starting_text: string; // First 2-5 words of original text
  anchor: string; // Semantic name (e.g., "silky-black-waist-tied")
  accessible_to: string[]; // Access control (["*"], ["yui"], ["yui", "ren"])
}

// Structured output from compression LLM
export interface CompressionOutput {
  block_tag: string; // Character name ("yui", "ren")
  segments: CompressionSegment[]; // Array of chunks
}

// Compressed block stored in database
export interface CompressedBlock {
  id: string;
  type: "character" | "message" | "scenario";
  compressedText: string; // XML: <yui><anchor1/><anchor2/>...</yui>
  compressionLevel: number;
  anchors: string[]; // List of anchor names
  timestamp: number; // Unix timestamp
  characterName?: string;
  tokenSize?: number; // For token counting
}

// Original text + compressed version (for debugging)
export interface OriginalBlock {
  id: string;
  originalText: string;
  compressedVersion: string;
  segments: CompressionSegment[];
}

// Anchor data with access control
export interface AnchorData {
  text: string; // Original decompressed text
  accessible_to: string[]; // Who can access this
  starting_text: string; // Reference prefix
}

// Full state
export interface StorageState {
  compressedText: string; // All blocks concatenated
  originalBlocks: Map<string, OriginalBlock>;
  blocks: CompressedBlock[];
  totalTokens: number;
  anchorMappings: Record<string, AnchorData>; // anchor name → data
}
