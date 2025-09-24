#!/usr/bin/env tsx

/**
 * Direct runner for the memory performance test
 * Run with: npx tsx run-test.ts
 */

import * as dotenv from 'dotenv';
import { runMemoryPerformanceTest } from './src/modules/supermemory/test-memory-performance';

// Load environment variables
dotenv.config();

// Mock import.meta.env for the test
(globalThis as any).import = {
  meta: {
    env: {
      VITE_SUPERMEMORY_API_KEY: process.env.VITE_SUPERMEMORY_API_KEY
    }
  }
};

console.log('🚀 Running Memory Performance Test with Node.js\n');

// Check API key
if (!process.env.VITE_SUPERMEMORY_API_KEY) {
  console.error('❌ Error: VITE_SUPERMEMORY_API_KEY not set in .env file');
  process.exit(1);
}

console.log('✅ API key found');
console.log('📦 Starting test...\n');

// Run the test
runMemoryPerformanceTest()
  .then(result => {
    if (result) {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed or returned no results');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
