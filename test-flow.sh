#!/bin/bash

echo "========================================="
echo "Testing Flow Queries and Mutations"
echo "========================================="
echo ""

# Change to project directory
cd /Users/youndukn/astrsk/astrsk-temp/astrsk/apps/pwa

# Test flow query factory
echo "📋 Testing Flow Query Factory..."
echo "-----------------------------------------"
npx vitest run src/app/queries/flow/query-factory.spec.ts

echo ""
echo "📋 Testing Flow Mutations..."
echo "-----------------------------------------"
# Test all mutation files
npx vitest run src/app/queries/flow/mutations/flow-mutations.spec.tsx

echo ""
echo "📋 Testing Composite Node Mutations..."
echo "-----------------------------------------"
npx vitest run src/app/queries/flow/mutations/__tests__/agent-node-mutations.spec.tsx
npx vitest run src/app/queries/flow/mutations/__tests__/data-store-node-mutations.spec.tsx
npx vitest run src/app/queries/flow/mutations/__tests__/if-node-mutations.spec.tsx

echo ""
echo "📋 Testing Other Flow Mutations..."
echo "-----------------------------------------"
npx vitest run src/app/queries/flow/mutations/__tests__/useUpdateFlowResponseTemplate.spec.tsx

echo ""
echo "📋 Testing All Flow Tests Together..."
echo "-----------------------------------------"
npx vitest run src/app/queries/flow/

echo ""
echo "========================================="
echo "Test Summary Complete"
echo "========================================="
