// This script handles 2FA verification.
// Generates QR on page load (no refresh button as per updated design).
// Submits the 6-digit code for verification.
// Redirects to dashboard on success.
// Displays messages accordingly.

document.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("msg");
  const qrImg = document.getElementById("qr");
  const appVerifyDiv = document.getElementById("qrArea");

  // Generate QR code on page load
  async function generateQR() {
    try {
      const res = await fetch("/twofa/setup?method=app", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        msg.textContent = data.error || "Setup failed";
        return;
      }
      qrImg.src = data.qr;
      appVerifyDiv.style.display = "block";
    } catch (err) {
      msg.textContent = "Network error occurred";
      console.error("2FA setup error:", err);
    }
  }
  generateQR(); // Initial generation

  // Verify the entered code
  document
    .getElementById("verifyForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = document.getElementById("code").value.trim();

      if (!token || token.length !== 6) {
        msg.textContent = "Enter a valid 6-digit code";
        return;
      }

      try {
        const res = await fetch("/twofa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ method: "app", token }),
        });
        const data = await res.json();
        if (!res.ok) {
          msg.textContent = data.error || "Verification failed";
          return;
        }
        const c = data.recoveryCodes || [];
        msg.textContent = c.length ? "2FA Enabled!" : "Authenticated!";
        msg.className = "small success";
        if (c.length) {
          const box = document.getElementById("codes");
          box.innerHTML = `<h2>Recovery Codes</h2><p class="small">Store safely. One-time use.</p><pre>${c.join(
            "\n"
          )}</pre>`;
          box.classList.remove("hidden");
        }
        setTimeout(() => (window.location.href = "/dashboard.html"), 2000);
      } catch (err) {
        msg.textContent = "Network error occurred";
        console.error("2FA verify error:", err);
      }
    });
});
