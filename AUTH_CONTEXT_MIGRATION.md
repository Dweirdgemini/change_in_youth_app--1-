# Auth Context Migration Guide

## Overview
Your app now has centralized authentication through `AuthProvider` at the root level. This ensures all components share the same auth state and prevents duplicate API calls.

## How to Migrate

### Before (Multiple useAuth instances)
```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth(); // Creates new instance
  // ...
}
```

### After (Single shared instance)
```typescript
import { useAuthContext } from "@/contexts/auth-context";

function MyComponent() {
  const { user, loading, isAuthenticated } = useAuthContext(); // Uses shared instance
  // ...
}
```

## Benefits
- ✅ **Single auth instance** across entire app
- ✅ **No duplicate API calls** 
- ✅ **Consistent state** everywhere
- ✅ **Better performance** (shared loading states)
- ✅ **Easier debugging** (single source of truth)

## Files Already Updated
- ✅ `app/_layout.tsx` - Added AuthProvider wrapper
- ✅ `app/profile-settings.tsx` - Migrated to useAuthContext
- ✅ `contexts/auth-context.tsx` - New centralized context

## Migration Steps for Other Components

1. **Replace import:**
   ```typescript
   // Remove
   import { useAuth } from "@/hooks/use-auth";
   
   // Add  
   import { useAuthContext } from "@/contexts/auth-context";
   ```

2. **Replace hook call:**
   ```typescript
   // Change
   const { user, loading, isAuthenticated } = useAuth();
   
   // To
   const { user, loading, isAuthenticated } = useAuthContext();
   ```

## AuthContext API
```typescript
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};
```

## Example Usage
```typescript
import { useAuthContext } from "@/contexts/auth-context";

function ProtectedScreen() {
  const { user, loading, isAuthenticated } = useAuthContext();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <WelcomeMessage name={user?.name} />;
}
```

## Notes
- The `useAuth` hook still exists and is used internally by `AuthProvider`
- You can still call `useAuth({ autoFetch: false })` for specific cases if needed
- The context automatically handles platform differences (web vs native)
- Dev mode bypass and test role overrides continue to work
