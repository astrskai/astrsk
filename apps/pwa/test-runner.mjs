#!/usr/bin/env node

/**
 * Simple Node.js test runner for Supermemory performance test
 * Run with: node test-runner.mjs
 */

import Supermemory from 'supermemory';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import the test data and logic from our existing test
const apiKey = process.env.VITE_SUPERMEMORY_API_KEY;

if (!apiKey) {
  console.error('❌ Error: VITE_SUPERMEMORY_API_KEY not set in .env file');
  process.exit(1);
}

console.log('🚀 Starting Supermemory Performance Test (Node.js)');
console.log('='.repeat(80));

// Initialize client
const memoryClient = new Supermemory({ apiKey });
const testSessionId = `test-session-${Date.now()}`;

// Copy the story messages and checkpoints from the original test
// (Simplified version for testing)
const testMessages = [
  { role: "user", content: "Alex: Hi, I'm Alex Chen, the new junior developer starting today." },
  { role: "assistant", content: "Sam: Welcome! I'm Sam Rivera from Marketing. Let me show you around." },
  { role: "user", content: "Alex: Six months later - I got promoted from junior to developer!" },
  { role: "assistant", content: "Sam: That's amazing! Want to celebrate with dinner?" },
  { role: "user", content: "Alex: One year later - I'm now a Senior Developer!" },
  { role: "assistant", content: "Sam: And we've been dating for six months now. I love you." },
  { role: "user", content: "Alex: Two years in - They offered me Tech Lead position!" },
  { role: "assistant", content: "Sam: You should take it! Also... will you marry me?" },
  { role: "user", content: "Alex: Three years - I'm now CTO! From junior developer to CTO!" },
  { role: "assistant", content: "Sam: And I'm CMO! We're running the company together!" },
];

async function runTest() {
  const results = [];

  // Store messages
  console.log('\n📝 Storing messages...');
  for (let i = 0; i < testMessages.length; i += 2) {
    if (i + 1 < testMessages.length) {
      const memoryContent = `Session ${testSessionId} conversation:\n[${testMessages[i].role}]: ${testMessages[i].content}\n[${testMessages[i+1].role}]: ${testMessages[i+1].content}`;

      try {
        const response = await memoryClient.memories.add({
          content: memoryContent,
          containerTag: `session-${testSessionId}`,
          metadata: {
            sessionId: testSessionId,
            messageIndex: i,
            timestamp: Date.now()
          }
        });
        console.log(`✅ Stored message pair ${i}-${i+1}: ${response.id}`);

        // Wait for indexing
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to store:`, error.message);
      }
    }
  }

  // Wait for indexing
  console.log('\n⏳ Waiting for indexing...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test queries
  console.log('\n🔍 Testing queries...');
  const queries = [
    { query: "What is Alex's position", expected: ["junior developer", "developer", "Senior Developer", "Tech Lead", "CTO"] },
    { query: "Alex and Sam relationship", expected: ["dating", "marry", "love"] },
    { query: "How long from junior to CTO", expected: ["three years"] }
  ];

  for (const test of queries) {
    console.log(`\n📊 Query: "${test.query}"`);

    try {
      const searchResults = await memoryClient.search.memories({
        q: `${test.query} session ${testSessionId}`,
        limit: 10
      });

      const memories = (searchResults.results || []).map(r => r.memory || '');
      const allText = memories.join(' ').toLowerCase();
      const found = test.expected.filter(term => allText.includes(term.toLowerCase()));

      console.log(`   Found ${memories.length} memories`);
      console.log(`   Matched: ${found.join(', ') || 'None'}`);
      console.log(`   Status: ${found.length > 0 ? '✅ PASS' : '❌ FAIL'}`);

      results.push({
        query: test.query,
        success: found.length > 0,
        found
      });
    } catch (error) {
      console.error(`   ❌ Query failed:`, error.message);
      results.push({
        query: test.query,
        success: false,
        error: error.message
      });
    }
  }

  // Report
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = ((successful / total) * 100).toFixed(1);

  console.log(`✅ Success Rate: ${successRate}% (${successful}/${total})`);
  console.log(`📝 Session ID: ${testSessionId}`);

  process.exit(successful === total ? 0 : 1);
}

runTest().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
