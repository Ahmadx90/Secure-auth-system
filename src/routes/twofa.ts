// This route handles 2FA setup and verification.
// Uses speakeasy for TOTP generation and verification.
// Encrypts 2FA secret with AES-256 before storing in DB.
// Decrypts when needed for verification or QR generation.
// Generates recovery codes on enable.
// Updated to use correct TOTP verification with options object.

import { Router, Request, Response } from "express";
import pool from "../db/pool";
import {
  generateTOTPSecret,
  secretToQRCodeDataURL,
  verifyTOTP,
} from "../utilis/twofa";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { encryptAES, decryptAES } from "../utilis/crypto";

const router = Router();

router.get("/setup", async (req: Request, res: Response) => {
  try {
    const method = String(req.query.method || "").toLowerCase();
    if (method !== "app") {
      return res.status(400).json({ error: "Only 'app' method supported." });
    }

    const uid = req.session.pendingUserId || req.session.userId;
    if (!uid) {
      return res.status(401).json({ error: "Authenticate first." });
    }

    const { rows } = await pool.query(
      "SELECT id, email, is_2fa_enabled, twofa_secret FROM public.users WHERE id=$1",
      [uid]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found." });

    const user = rows[0];
    let decryptedSecret: string | null = null;
    if (user.twofa_secret) {
      try {
        decryptedSecret = decryptAES(user.twofa_secret);
        if (!decryptedSecret) {
          throw new Error("Decrypted secret is null or invalid");
        }
      } catch (decErr) {
        console.error("Decryption error for twofa_secret:", decErr);
        return res.status(500).json({ error: "Failed to process 2FA secret." });
      }
    }

    let secret;
    if (user.is_2fa_enabled && decryptedSecret) {
      // For login verify, return QR from existing
      secret = {
        base32: decryptedSecret,
        otpauth_url: `otpauth://totp/Internee.pk:${user.email}?secret=${decryptedSecret}&issuer=Internee.pk`,
      };
    } else {
      // For enable, generate new, store temp
      secret = generateTOTPSecret(user.email);
      req.session.tempSecret = secret.base32;
    }

    const qr = await secretToQRCodeDataURL(secret.otpauth_url!);

    return res.json({ qr }); // Removed secret field from response
  } catch (err: any) {
    console.error("2FA setup error:", err.stack);
    return res.status(500).json({ error: "2FA setup failed." });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { method, token } = req.body;
    if (method !== "app" || !token) {
      return res.status(400).json({ error: "Invalid request." });
    }

    const pending = !!req.session.pendingUserId;
    const uid = pending ? req.session.pendingUserId : req.session.userId;
    if (!uid) return res.status(401).json({ error: "Authenticate first." });

    const { rows } = await pool.query(
      "SELECT id, twofa_secret, is_2fa_enabled FROM public.users WHERE id=$1",
      [uid]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found." });
    const user = rows[0];

    let ok;
    let decryptedSecret: string | null = null;
    if (user.twofa_secret) {
      try {
        decryptedSecret = decryptAES(user.twofa_secret);
        if (!decryptedSecret) {
          throw new Error("Decrypted secret is null or invalid");
        }
      } catch (decErr) {
        console.error("Decryption error for twofa_secret:", decErr);
        return res.status(500).json({ error: "Failed to process 2FA secret." });
      }
    }

    if (pending || user.is_2fa_enabled) {
      // Login verify: use DB secret
      if (!decryptedSecret)
        return res.status(400).json({ error: "2FA not set up." });
      ok = verifyTOTP(String(token), {
        secret: decryptedSecret,
        encoding: "base32",
        window: 2, // Increased window to 2 (60s)
      });
    } else {
      // Enable verify: use temp secret
      const tempSecret = req.session.tempSecret;
      if (!tempSecret)
        return res.status(400).json({ error: "Setup not initiated." });
      ok = verifyTOTP(String(token), {
        secret: tempSecret,
        encoding: "base32",
        window: 2, // Increased window to 2 (60s)
      });
      if (ok) {
        // Encrypt and save to DB, enable
        const encryptedSecret = encryptAES(tempSecret);
        await pool.query(
          "UPDATE public.users SET twofa_secret=$1, is_2fa_enabled=true WHERE id=$2",
          [encryptedSecret, uid]
        );
        delete req.session.tempSecret;

        // Generate recovery codes
        const recoveryCodes = Array.from({ length: 10 }, () =>
          crypto.randomBytes(8).toString("hex")
        );
        for (const code of recoveryCodes) {
          const hash = await bcrypt.hash(code, 10);
          await pool.query(
            "INSERT INTO public.recovery_codes (user_id, code_hash) VALUES ($1, $2)",
            [uid, hash]
          );
        }
        return res.json({ success: true, recoveryCodes });
      }
    }

    if (!ok) return res.status(400).json({ error: "Invalid code." });

    // Success: authenticate
    req.session.userId = uid;
    delete req.session.pendingUserId;
    req.session.authenticated = true;

    return res.json({ success: true });
  } catch (err: any) {
    console.error("2FA verify error:", err.stack);
    return res.status(500).json({ error: "2FA verification failed." });
  }
});

export default router;
