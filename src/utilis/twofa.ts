// Utilities for 2FA with TOTP (Google Authenticator compatible).
// generateTOTPSecret creates a new secret.
// secretToQRCodeDataURL generates QR for app scanning.
// verifyTOTP checks the code against the secret with configurable options.
// Updated to use the correct Encoding type from @types/speakeasy.

import speakeasy from "speakeasy";
import QRCode from "qrcode";

// Import Encoding type from speakeasy typings
import { Encoding } from "speakeasy";

export function generateTOTPSecret(labelEmail: string) {
  return speakeasy.generateSecret({
    name: `Internee.pk (${labelEmail})`,
    length: 20,
  });
}

export async function secretToQRCodeDataURL(otpauthUrl: string) {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTOTP(
  token: string,
  options: { secret: string; encoding: Encoding; window?: number }
): boolean {
  return speakeasy.totp.verify({
    secret: options.secret,
    encoding: options.encoding,
    token: token,
    window: options.window || 0, // Default to 0 if window not provided
  });
}
