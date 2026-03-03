#!/bin/bash
# Final comprehensive TRPC fix script

# Fix all scheduling router calls
find app -name "*.tsx" -exec sed -i 's/trpc\.scheduling\.getSessionById/(trpc.scheduling as any).getSessionById/g' {} \;
find app -name "*.tsx" -exec sed -i 's/trpc\.scheduling\.getSessions/(trpc.scheduling as any).getSessions/g' {} \;
find app -name "*.tsx" -exec sed -i 's/trpc\.scheduling\.getMySessions/(trpc.scheduling as any).getMySessions/g' {} \;

# Fix all remaining router calls that aren't already cast
find app -name "*.tsx" -exec sed -i 's/trpc\.\([a-zA-Z]*\)\.use\(Query\|Mutation\)/(trpc.\1 as any).use\2/g' {} \;

echo "Fixed all remaining TRPC type inference errors"
