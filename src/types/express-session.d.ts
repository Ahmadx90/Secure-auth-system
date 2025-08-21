// Augments express-session types to include custom session data.
// Used for storing userId, pendingUserId, authenticated, and tempSecret.

import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    pendingUserId?: string;
    authenticated?: boolean;
    tempSecret?: string;
  }
}
