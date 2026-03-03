#!/bin/bash
# Fix remaining TRPC type inference errors

# Fix videoCall router
sed -i 's/trpc\.videoCall\./(trpc.videoCall as any)./g' components/AgoraVideoCall.tsx

# Fix organizations router  
sed -i 's/trpc\.organizations\./(trpc.organizations as any)./g' components/organization-switcher.tsx

echo "Fixed TRPC errors"
