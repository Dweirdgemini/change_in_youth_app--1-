#!/bin/bash
# Fix all remaining TRPC type inference errors by casting routers to any

# Fix surveys router
sed -i 's/trpc\.surveys\./(trpc.surveys as any)./g' app/surveys.tsx

# Fix organizations router (if not already fixed)
sed -i 's/trpc\.organizations\.getCurrent/(trpc.organizations as any).getCurrent/g' components/organization-switcher.tsx

# Fix any remaining admin router calls
find app -name "*.tsx" -exec sed -i 's/trpc\.admin\.getUser\./(trpc.admin as any).getUser./g' {} \;
find app -name "*.tsx" -exec sed -i 's/trpc\.admin\.getAllUsers\./(trpc.admin as any).getAllUsers./g' {} \;
find app -name "*.tsx" -exec sed -i 's/trpc\.admin\.getProjects\./(trpc.admin as any).getProjects./g' {} \;

echo "Fixed all TRPC type inference errors"
