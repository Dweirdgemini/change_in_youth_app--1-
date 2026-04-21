import type { User } from '../drizzle/schema';

declare global {
  var testSessions: Map<string, User> | undefined;
}

export {};
