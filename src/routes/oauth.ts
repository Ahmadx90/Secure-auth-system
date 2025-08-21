// This route handles OAuth 2.0 with Google.
// Configures Passport strategy.
// Splits displayName into first_name and last_name for consistency with DB schema.

import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import pool from "../db/pool";

const router = Router();

export function configureGoogleStrategy() {
  const clientID = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const callbackURL =
    process.env.OAUTH_CALLBACK_URL ||
    "http://localhost:3000/auth/google/callback";

  if (!clientID || !clientSecret) {
    console.warn("Google OAuth env vars missing; OAuth disabled.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const fullName = profile.displayName || "Google User";
          const nameParts = fullName.split(" ");
          const first_name = nameParts[0];
          const last_name = nameParts.slice(1).join(" ") || null;
          const googleSub = profile.id;

          if (!email) return done(null, false);

          let res = await pool.query(
            "SELECT * FROM public.users WHERE email=$1",
            [email]
          );

          if (res.rows.length === 0) {
            res = await pool.query(
              `INSERT INTO public.users (first_name, last_name, email, password_hash, oauth_google_sub, oauth_last_provider)
               VALUES ($1, $2, $3, '', $4, $5) RETURNING *`,
              [first_name, last_name, email, googleSub, "google"]
            );
          } else {
            await pool.query(
              "UPDATE public.users SET oauth_google_sub=$1, oauth_last_provider=$2 WHERE id=$3",
              [googleSub, "google", res.rows[0].id]
            );
          }

          return done(null, res.rows[0]);
        } catch (err) {
          return done(err as any);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const result = await pool.query(
        "SELECT * FROM public.users WHERE id = $1",
        [id]
      );
      done(null, result.rows[0]);
    } catch (err) {
      done(err as any);
    }
  });
}

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/index.html" }),
  (req, res) => {
    res.redirect("/dashboard.html");
  }
);

export default router;
