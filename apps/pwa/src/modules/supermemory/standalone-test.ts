import Supermemory from "supermemory";

/**
 * Standalone Supermemory Performance Test
 * This test directly uses Supermemory API without going through our service layer
 * Run this in browser console: runStandaloneMemoryTest()
 */

interface TestCheckpoint {
  messageIndex: number;
  name: string;
  queries: Array<{
    query: string;
    expectedMemory: string[];
  }>;
}

// Simplified story messages for testing
const storyMessages = [
  // Junior Developer Phase (Messages 0-20)
  "Session TEST-001 conversation:\n[user]: Alex: *walks into office nervously* Hi, I'm Alex Chen, the new junior developer starting today.\n[assistant]: Sam: *warm smile* Welcome! I'm Sam Rivera from Marketing. Let me show you where the coffee machine is.",
  "Session TEST-001 conversation:\n[user]: Alex: Thanks Sam! Being a junior developer is intimidating. This is my first real tech job.\n[assistant]: Sam: Don't worry! I'm the marketing manager here. Everyone's super friendly. You'll do great!",
  "Session TEST-001 conversation:\n[user]: Alex: *at coffee machine* So you've been here long? I'm still learning the codebase as a junior.\n[assistant]: Sam: Two years as marketing manager. The dev team is great - very supportive of juniors.",
  "Session TEST-001 conversation:\n[user]: Alex: *frustrated* My first code review as a junior developer came back with so many comments.\n[assistant]: Sam: *offers chocolate* That's normal! My first marketing campaign got shredded too. You'll learn fast.",
  "Session TEST-001 conversation:\n[user]: Alex: *brightening* You're right. I want to prove myself as a junior developer and move up eventually.\n[assistant]: Sam: You're already fixing bugs in week two! That's impressive for a junior. Coffee tomorrow?",

  // Promotion to Developer (Messages 21-40)
  "Session TEST-001 conversation:\n[user]: Alex: *excited* I got promoted! No more junior developer - I'm now a full developer!\n[assistant]: Sam: *raises coffee mug* Six months from junior to developer! That's amazing! Let's celebrate!",
  "Session TEST-001 conversation:\n[user]: Alex: I couldn't have done it without your support. From nervous junior developer to confident developer!\n[assistant]: Sam: *whispers* I'm so proud of you... and I really enjoy our coffee talks. Maybe dinner sometime?",
  "Session TEST-001 conversation:\n[user]: Alex: *smiling* Are you asking me on a date? Because yes! Now that I'm not a junior developer, I can afford a nice place.\n[assistant]: Sam: *laughs* I would've said yes even when you were a junior! But let's keep it professional at work.",

  // Senior Developer Phase (Messages 41-60)
  "Session TEST-001 conversation:\n[user]: Alex: *one year later* Can you believe it? Senior Developer Alex Chen! And dating the amazing Sam Rivera.\n[assistant]: Sam: From junior developer to senior developer in 18 months! And we've been together almost a year now.",
  "Session TEST-001 conversation:\n[user]: Alex: Being a senior developer means so much responsibility. Leading projects, mentoring juniors...\n[assistant]: Sam: You're handling it beautifully. The CEO mentioned your work yesterday. You're making waves!",
  "Session TEST-001 conversation:\n[user]: Alex: *stressed* Senior developer life is non-stop. Meetings, architecture decisions, code reviews...\n[assistant]: Sam: You need balance. Even senior developers need rest. Also... I might become marketing director soon!",

  // Tech Lead Promotion (Messages 61-80)
  "Session TEST-001 conversation:\n[user]: Alex: *shocked* They want me to be Tech Lead! From junior developer to tech lead in two years!\n[assistant]: Sam: You absolutely should take it! You're already mentoring half the team as senior developer.",
  "Session TEST-001 conversation:\n[user]: Alex: *nervous* Tech Lead means managing the entire dev team. It's so different from coding.\n[assistant]: Sam: *takes hands* You mentored three juniors to promotion. You're ready for this. I believe in you.",
  "Session TEST-001 conversation:\n[user]: Alex: *on one knee* Sam Rivera, you've been with me from junior developer to tech lead. Will you marry me?\n[assistant]: Sam: *crying* YES! A thousand times yes! From coffee machine introduction to this! I love you!",
  "Session TEST-001 conversation:\n[user]: Alex: *six months later* Being Tech Lead is harder than I thought. So much more than senior developer work.\n[assistant]: Sam: But you're excelling! And as the new Marketing Director, I totally understand the pressure.",

  // Path to CTO (Messages 81-95)
  "Session TEST-001 conversation:\n[user]: Alex: The board is creating a CTO position. They want me to apply. Junior developer to CTO in three years?\n[assistant]: Sam: *excited* You've transformed our entire tech stack! If anyone deserves CTO, it's you!",
  "Session TEST-001 conversation:\n[user]: Alex: We're both up for C-suite positions. You for CMO, me for CTO. Remember when I was just a junior?\n[assistant]: Sam: *nostalgic* Three years ago you walked in as a nervous junior developer. Now look at us!",

  // CTO Achievement (Messages 96-100)
  "Session TEST-001 conversation:\n[user]: Alex: *holding letter* I got it! Chief Technology Officer! From junior developer to CTO in three years!\n[assistant]: Sam: *screaming* And I'm CMO! We're both C-suite! That nervous junior developer is now running tech!",
  "Session TEST-001 conversation:\n[user]: Alex: Remember our first meeting? You showed the junior developer where the coffee was. Now we run the company together.\n[assistant]: Sam: *tears* From junior developer and marketing manager to CTO and CMO. And soon, husband and wife!",
  "Session TEST-001 conversation:\n[user]: Alex: *reflecting* The journey from junior developer to CTO seems like a dream. But the best part was finding you.\n[assistant]: Sam: Every step - junior, developer, senior developer, tech lead, CTO - we did it together. I love you.",
  "Session TEST-001 conversation:\n[user]: Alex: Three years ago I said 'Hi, I'm the new junior developer.' Best introduction ever.\n[assistant]: Sam: And I showed you the coffee machine. From junior developer to CTO, colleague to fiancé. What a journey!"
];

// Test checkpoints
const checkpoints: TestCheckpoint[] = [
  {
    messageIndex: 5,
    name: "Junior Developer Phase",
    queries: [
      {
        query: "What is Alex's position",
        expectedMemory: ["junior developer", "junior", "first real tech job"]
      },
      {
        query: "relationship between Alex and Sam",
        expectedMemory: ["coffee", "friendly", "supportive", "colleagues"]
      }
    ]
  },
  {
    messageIndex: 8,
    name: "Developer Promotion",
    queries: [
      {
        query: "Alex current job title",
        expectedMemory: ["developer", "promoted", "no more junior"]
      },
      {
        query: "Alex and Sam relationship status",
        expectedMemory: ["date", "dinner", "asking me on a date"]
      },
      {
        query: "How long was Alex a junior developer",
        expectedMemory: ["six months", "junior to developer"]
      }
    ]
  },
  {
    messageIndex: 11,
    name: "Senior Developer Phase",
    queries: [
      {
        query: "What is Alex's role now",
        expectedMemory: ["Senior Developer", "senior", "responsibility"]
      },
      {
        query: "Alex Sam relationship",
        expectedMemory: ["dating", "together almost a year", "love"]
      },
      {
        query: "Alex's first position at the company",
        expectedMemory: ["junior developer", "nervous junior"]
      }
    ]
  },
  {
    messageIndex: 15,
    name: "Tech Lead & Engagement",
    queries: [
      {
        query: "Alex's current position",
        expectedMemory: ["Tech Lead", "managing", "entire dev team"]
      },
      {
        query: "What happened between Alex and Sam",
        expectedMemory: ["marry me", "engaged", "proposal", "YES"]
      },
      {
        query: "Career progression of Alex",
        expectedMemory: ["junior developer", "tech lead", "two years"]
      }
    ]
  },
  {
    messageIndex: 20,
    name: "CTO Achievement",
    queries: [
      {
        query: "What is Alex's final position",
        expectedMemory: ["CTO", "Chief Technology Officer", "C-suite"]
      },
      {
        query: "How long from junior to CTO",
        expectedMemory: ["three years", "junior developer to CTO"]
      },
      {
        query: "Alex and Sam relationship now",
        expectedMemory: ["husband and wife", "engaged", "fiancé"]
      },
      {
        query: "How did Alex and Sam first meet",
        expectedMemory: ["coffee machine", "junior developer", "first", "showed"]
      }
    ]
  }
];

// Main test function
export async function runStandaloneMemoryTest() {
  console.log("🚀 Starting Standalone Supermemory Test");
  console.log("=" .repeat(80));

  // Check if API key is configured
  const apiKey = import.meta.env.VITE_SUPERMEMORY_API_KEY;
  if (!apiKey) {
    console.error("❌ No API key found! Set VITE_SUPERMEMORY_API_KEY in .env file");
    return;
  }

  // Create client
  const client = new Supermemory({ apiKey });
  const testId = `standalone-test-${Date.now()}`;
  console.log(`📝 Test ID: ${testId}`);

  const results: any[] = [];

  try {
    // Process messages and run checkpoints
    for (let i = 0; i < storyMessages.length; i++) {
      console.log(`\n📤 Storing message ${i + 1}/${storyMessages.length}...`);

      try {
        // Store the message directly
        const response = await client.memories.add({
          content: storyMessages[i],
          containerTag: testId,
          metadata: {
            messageIndex: i,
            timestamp: Date.now()
          }
        });

        console.log(`✅ Stored with ID: ${response.id}`);

        // Small delay for indexing
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to store message ${i}:`, error);
      }

      // Check if we hit a checkpoint
      const checkpoint = checkpoints.find(cp => cp.messageIndex === i + 1);
      if (checkpoint) {
        console.log("\n" + "=".repeat(80));
        console.log(`📍 CHECKPOINT: ${checkpoint.name}`);
        console.log(`   Messages processed: ${i + 1}`);
        console.log("=".repeat(80));

        const checkpointResult = {
          name: checkpoint.name,
          messageIndex: checkpoint.messageIndex,
          queries: [] as any[]
        };

        // Wait for indexing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Run queries
        for (const queryTest of checkpoint.queries) {
          console.log(`\n🔍 Query: "${queryTest.query}"`);
          console.log(`   Expected: ${queryTest.expectedMemory.join(", ")}`);

          try {
            // Search with the query
            const searchResults = await client.search.memories({
              q: `${queryTest.query} ${testId}`,
              limit: 10
            });

            const memories = searchResults.results?.map((r: any) => r.memory) || [];
            const allMemoriesText = memories.join(" ").toLowerCase();

            // Check if expected terms are found
            const foundTerms = queryTest.expectedMemory.filter(term =>
              allMemoriesText.includes(term.toLowerCase())
            );

            const success = foundTerms.length > 0;

            console.log(`   Found ${memories.length} memories`);
            console.log(`   Matched terms: ${foundTerms.join(", ") || "None"}`);
            console.log(`   Status: ${success ? "✅ PASS" : "❌ FAIL"}`);

            if (memories.length > 0 && memories[0]) {
              console.log(`   Sample: "${memories[0].substring(0, 100)}..."`);
            }

            checkpointResult.queries.push({
              query: queryTest.query,
              expected: queryTest.expectedMemory,
              foundTerms,
              success,
              memoriesFound: memories.length
            });

          } catch (error) {
            console.error(`❌ Query failed:`, error);
            checkpointResult.queries.push({
              query: queryTest.query,
              expected: queryTest.expectedMemory,
              error: error instanceof Error ? error.message : String(error),
              success: false
            });
          }
        }

        results.push(checkpointResult);
      }
    }

    // Generate report
    console.log("\n" + "=".repeat(80));
    console.log("📊 FINAL REPORT");
    console.log("=".repeat(80));

    let totalQueries = 0;
    let successfulQueries = 0;

    results.forEach(checkpoint => {
      console.log(`\n📍 ${checkpoint.name} (Message ${checkpoint.messageIndex})`);
      checkpoint.queries.forEach((q: any) => {
        totalQueries++;
        if (q.success) successfulQueries++;

        console.log(`   ${q.success ? '✅' : '❌'} "${q.query}"`);
        if (q.foundTerms) {
          console.log(`      Found: ${q.foundTerms.join(", ") || "None"}`);
        }
        if (q.error) {
          console.log(`      Error: ${q.error}`);
        }
      });
    });

    const successRate = totalQueries > 0
      ? ((successfulQueries / totalQueries) * 100).toFixed(1)
      : "0";

    console.log("\n" + "=".repeat(80));
    console.log(`📈 Success Rate: ${successRate}% (${successfulQueries}/${totalQueries})`);
    console.log(`📝 Test ID: ${testId}`);
    console.log("=".repeat(80));

    // Cleanup option
    console.log("\n💡 To clean up test data, run: cleanupTest('" + testId + "')");

    return {
      testId,
      results,
      successRate,
      totalQueries,
      successfulQueries
    };

  } catch (error) {
    console.error("❌ Test failed:", error);
    return null;
  }
}

// Cleanup function to remove test data
export async function cleanupTest(testId: string) {
  console.log(`🧹 Cleaning up test data for: ${testId}`);
  // Note: Supermemory API might not have a delete endpoint
  // This is a placeholder for when/if cleanup is available
  console.log("⚠️  Manual cleanup may be required through Supermemory dashboard");
}

// Expose to window
if (typeof window !== "undefined") {
  (window as any).runStandaloneMemoryTest = runStandaloneMemoryTest;
  (window as any).cleanupTest = cleanupTest;

  console.log("✅ Standalone Supermemory test loaded!");
  console.log("Run: runStandaloneMemoryTest()");
}
