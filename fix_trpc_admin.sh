#!/bin/bash
# Fix TRPC admin type inference errors by casting to any

files=(
  "app/admin/import-historical-data.tsx"
  "app/admin/invoice-review.tsx"
  "app/admin/project-management.tsx"
  "app/admin/team-availability.tsx"
  "app/admin/team-ranking.tsx"
  "app/admin/feedback-analytics.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Replace trpc.admin. with (trpc.admin as any).
    sed -i 's/trpc\.admin\./(trpc.admin as any)./g' "$file"
    echo "Fixed $file"
  fi
done
