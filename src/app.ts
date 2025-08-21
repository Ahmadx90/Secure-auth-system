// Main Express app setup.
// Configures middleware, sessions, Passport for OAuth.
// Mounts routes for auth, OAuth, 2FA.
// Serves static public files.
// Includes global error handler.

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import twofaRoutes from "./routes/twofa";
import oauthRoutes, { configureGoogleStrategy } from "./routes/oauth";

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

configureGoogleStrategy();
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, "public")));

app.use("/auth", authRoutes);
app.use("/auth", oauthRoutes);
app.use("/twofa", twofaRoutes);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
