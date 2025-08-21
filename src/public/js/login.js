// This script handles the login form submission.
// It sends email and password to the backend for authentication.
// If successful, redirects to dashboard or 2FA page based on response.
// Displays error messages if login fails.

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    msg.textContent = "Email and password are required";
    return;
  }

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error || "Login failed";
      return;
    }
    if (data.twofa_required) {
      window.location.href = data.redirect || "/twofa.html";
    } else {
      window.location.href = data.redirect || "/dashboard.html";
    }
  } catch (err) {
    msg.textContent = "Network error occurred";
    console.error("Login error:", err);
  }
});
