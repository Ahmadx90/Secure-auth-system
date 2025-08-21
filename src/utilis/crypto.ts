// Utilities for cryptography.
// hashPassword and verifyPassword use bcrypt for passwords.
// encryptAES and decryptAES use AES-256-GCM for sensitive data like phone and 2FA secrets.
// Requires ENC_KEY_V1 env var (base64-encoded 32-byte key).
// Updated decryptAES to handle legacy plain-text values (no '.' or ':') for backward compatibility with unencrypted data.

import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import bcrypt from "bcrypt";

const KEY_B64 = process.env.ENC_KEY_V1 || "";
if (!KEY_B64) {
  throw new Error("Missing ENC_KEY_V1 in environment (.env).");
}

let KEY: Buffer;
try {
  KEY = Buffer.from(KEY_B64, "base64");
} catch {
  throw new Error("ENC_KEY_V1 must be base64-encoded.");
}
if (KEY.length !== 32) {
  throw new Error("ENC_KEY_V1 must decode to exactly 32 bytes.");
}

const IV_LEN = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function encryptAES(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptAES(blob: string): string {
  // Handle legacy plain-text values (e.g., old 2FA secrets not encrypted)
  if (!blob.includes(".") && !blob.includes(":")) {
    return blob; // Return as-is for backward compatibility
  }

  const parts = blob.includes(".") ? blob.split(".") : blob.split(":");

  // Validate parts length
  if (parts.length !== 4 && parts.length !== 3) {
    throw new Error("Invalid ciphertext format for AES-GCM.");
  }

  let ivB64: string;
  let tagB64: string;
  let ctB64: string;

  if (parts.length === 4 && parts[0] === "v1") {
    // Validate each part explicitly
    if (
      typeof parts[1] !== "string" ||
      typeof parts[2] !== "string" ||
      typeof parts[3] !== "string"
    ) {
      throw new Error(
        "Invalid ciphertext: missing or invalid iv, tag, or ciphertext."
      );
    }
    ivB64 = parts[1];
    tagB64 = parts[2];
    ctB64 = parts[3];
  } else {
    // Validate each part explicitly
    if (
      typeof parts[0] !== "string" ||
      typeof parts[1] !== "string" ||
      typeof parts[2] !== "string"
    ) {
      throw new Error(
        "Invalid ciphertext: missing or invalid iv, tag, or ciphertext."
      );
    }
    ivB64 = parts[0];
    tagB64 = parts[1];
    ctB64 = parts[2];
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ct = Buffer.from(ctB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString("utf8");
}
