#!/usr/bin/env npx tsx

/**
 * Standalone Node.js runner for the memory performance test
 * Run with: npx tsx run-memory-test.ts
 * Or: ts-node run-memory-test.ts
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Set up the environment to match Vite's import.meta.env
(global as any).import = {
  meta: {
    env: {
      VITE_SUPERMEMORY_API_KEY: process.env.VITE_SUPERMEMORY_API_KEY,
      DEV: true
    }
  }
};

// Import and run the test
async function runTest() {
  console.log('🚀 Starting Supermemory Performance Test (Node.js mode)\n');

  // Check API key
  if (!process.env.VITE_SUPERMEMORY_API_KEY) {
    console.error('❌ Error: VITE_SUPERMEMORY_API_KEY not set in .env file');
    console.error('   Please create a .env file with: VITE_SUPERMEMORY_API_KEY=your_api_key');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log('📦 Loading test module...\n');

  try {
    // Import the test function
    const testModule = await import('./src/modules/supermemory/test-memory-performance.js');

    // Run the test
    const result = await testModule.runMemoryPerformanceTest();

    if (result) {
      console.log('\n✅ Test completed successfully!');
      console.log(`📊 Final success rate: ${result.summary.successRate}%`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest().catch(console.error);
