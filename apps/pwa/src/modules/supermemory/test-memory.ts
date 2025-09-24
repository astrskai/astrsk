import Supermemory from "supermemory";

/**
 * Test function to verify Supermemory integration
 * Call this from browser console: testSupermemory()
 */
export async function testSupermemory() {
  console.log("🧪 [Test] Starting Supermemory test...");

  const client = new Supermemory({
    apiKey: import.meta.env.VITE_SUPERMEMORY_API_KEY,
  });

  console.log(
    "🧪 [Test] API Key configured:",
    !!import.meta.env.VITE_SUPERMEMORY_API_KEY,
  );
  console.log(
    "🧪 [Test] Project ID:",
    import.meta.env.VITE_SUPERMEMORY_PROJECT_ID || "not set",
  );

  // Step 1: Add a test memory
  console.log("🧪 [Test] Step 1: Adding test memory...");
  try {
    const testContent = `Test memory at ${new Date().toISOString()}: User asked about quantum computing. Assistant explained quantum superposition.`;

    const addResponse = await client.memories.add({
      content: testContent,
      containerTag: "test",
      metadata: {
        test: true,
        timestamp: Date.now(),
      },
    });

    console.log("✅ [Test] Memory added successfully:", addResponse);

    // Step 2: Wait a moment for indexing
    console.log("🧪 [Test] Step 2: Waiting 2 seconds for indexing...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 3: Search for the memory
    console.log("🧪 [Test] Step 3: Searching for memories...");

    // Try different search queries
    const searches = [
      { q: "quantum computing", description: "Specific content search" },
      { q: "test memory", description: "Test prefix search" },
      { q: "quantum", description: "Single word search" },
      { q: "", description: "Empty query search" },
    ];

    for (const search of searches) {
      try {
        console.log(
          `🔍 [Test] Trying search: "${search.q}" (${search.description})`,
        );
        const searchResponse = await client.search.memories({
          q: search.q,
          limit: 10,
        });

        console.log(`📊 [Test] Results for "${search.q}":`, {
          count: searchResponse.results?.length || 0,
          total: searchResponse.total,
          timing: searchResponse.timing,
          results: searchResponse.results?.slice(0, 2).map((r) => ({
            memory: r.memory?.substring(0, 100) + "...",
            similarity: r.similarity,
          })),
        });
      } catch (error) {
        console.error(`❌ [Test] Search failed for "${search.q}":`, error);
      }
    }
  } catch (error) {
    console.error("❌ [Test] Error during test:", error);
  }

  console.log("🧪 [Test] Test complete!");
}

// Make it available globally for testing
if (typeof window !== "undefined") {
  (window as any).testSupermemory = testSupermemory;
}
