// This route handles user authentication: signup, login, user info (/me), and logout.
// Uses bcrypt for password hashing.
// Encrypts sensitive data like phone using AES-256 before storing.
// Decrypts on fetch.
// Added backend password strength validation in signup.

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db/pool";
import {
  hashPassword,
  verifyPassword,
  encryptAES,
  decryptAES,
} from "../utilis/crypto";

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    if (!first_name || !email || !password) {
      return res
        .status(400)
        .json({ error: "first_name, email, and password are required" });
    }

    // Backend password strength validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long, contain 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const exists = await pool.query(
      "SELECT id FROM public.users WHERE email = $1",
      [normalizedEmail]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(String(password));
    const plainPhone = phone ? String(phone) : null;
    const encryptedPhone = plainPhone ? encryptAES(plainPhone) : null;

    const insertQ = `
      INSERT INTO public.users (first_name, last_name, email, phone, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, email
    `;
    const values = [
      String(first_name),
      last_name ? String(last_name) : null,
      normalizedEmail,
      encryptedPhone,
      passwordHash,
    ];
    const result = await pool.query(insertQ, values);

    req.session.userId = result.rows[0].id;
    req.session.authenticated = false;

    return res
      .status(201)
      .json({ message: "Signup successful", user: result.rows[0] });
  } catch (err: any) {
    console.error("Signup error:", err.stack);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const q = `SELECT id, first_name, last_name, email, password_hash, is_2fa_enabled FROM public.users WHERE email = $1`;
    const { rows } = await pool.query(q, [normalizedEmail]);

    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = rows[0];
    const hash = user.password_hash;
    if (!hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await verifyPassword(String(password), String(hash));
    if (!match)
      return res.status(401).json({ error: "Invalid email or password" });

    if (user.is_2fa_enabled) {
      req.session.pendingUserId = user.id;
      req.session.authenticated = false;
      return res.json({
        success: true,
        twofa_required: true,
        message: "2FA required",
      });
    }

    req.session.userId = user.id;
    req.session.authenticated = true;
    return res.json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err.stack);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId || !req.session.authenticated)
      return res.status(401).json({ error: "Not authenticated" });
    const { rows } = await pool.query(
      "SELECT id, first_name, last_name, email, phone, is_2fa_enabled FROM public.users WHERE id = $1",
      [req.session.userId]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    const user = rows[0];
    // Decrypt sensitive data if present
    if (user.phone) {
      try {
        user.phone = decryptAES(user.phone);
      } catch (decErr) {
        console.error("Decryption error for phone:", decErr);
        user.phone = null; // Fallback if decryption fails
      }
    }
    return res.json({ user });
  } catch (err: any) {
    console.error("Me error:", err.stack);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);
  });
  res.json({ success: true });
});

export default router;
