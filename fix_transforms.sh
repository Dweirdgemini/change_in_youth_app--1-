#!/bin/bash
# Fix transform type errors by adding 'as any' cast

files=(
  "app/expenses/create.tsx"
  "app/invoices/index.tsx"
  "app/invoices/preview.tsx"
  "app/public/jobs.tsx"
  "app/receipts/upload.tsx"
  "app/training.tsx"
  "app/video-call/[sessionId].tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Fix transform arrays
    sed -i 's/transform: \[\(.*\)\]\([,}]\)/transform: [\1] as any\2/g' "$file"
    echo "Fixed $file"
  fi
done
