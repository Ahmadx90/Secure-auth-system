// This script handles the signup form submission.
// It collects first_name, last_name, email, password, confirmPassword, and phone.
// Validates passwords match and strength on client-side.
// Sends data to backend for user creation.
// Redirects to login page on success.
// Displays error messages if signup fails.
// Added dynamic password rules validation with UI feedback.

const form = document.getElementById("signupForm");
const msg = document.getElementById("msg");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordRules = document.getElementById("passwordRules");
const confirmMsg = document.getElementById("confirmMsg");

// Rules elements
const ruleLength = document.getElementById("rule-length");
const ruleUpper = document.getElementById("rule-upper");
const ruleLower = document.getElementById("rule-lower");
const ruleNumber = document.getElementById("rule-number");
const ruleSpecial = document.getElementById("rule-special");

// Show rules on password focus
passwordInput.addEventListener("focus", () => {
  passwordRules.style.display = "block";
});

// Validate password strength on input
passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^\da-zA-Z]/.test(password);

  // Update rules UI
  updateRule(ruleLength, hasLength, "At least 8 characters");
  updateRule(ruleUpper, hasUpper, "1 uppercase letter");
  updateRule(ruleLower, hasLower, "1 lowercase letter");
  updateRule(ruleNumber, hasNumber, "1 number");
  updateRule(ruleSpecial, hasSpecial, "1 special character");

  // Green border if all valid
  if (hasLength && hasUpper && hasLower && hasNumber && hasSpecial) {
    passwordInput.classList.add("valid");
    passwordInput.classList.remove("invalid");
  } else {
    passwordInput.classList.add("invalid");
    passwordInput.classList.remove("valid");
  }
});

// Validate confirm password on input
confirmPasswordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const confirm = confirmPasswordInput.value;
  if (confirm === password && password !== "") {
    confirmPasswordInput.classList.add("valid");
    confirmPasswordInput.classList.remove("invalid");
    confirmMsg.style.display = "none";
  } else {
    confirmPasswordInput.classList.add("invalid");
    confirmPasswordInput.classList.remove("valid");
    confirmMsg.style.display = "block";
  }
});

// Helper to update rule text and class
function updateRule(element, met, text) {
  element.textContent = `${text} ${met ? "✅" : "❌"}`;
  element.classList.toggle("rule-met", met);
  element.classList.toggle("rule-not-met", !met);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const first_name = document.getElementById("first_name").value.trim();
  const last_name = document.getElementById("last_name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const phone = document.getElementById("phone").value.trim();

  // Client-side validation
  if (!first_name || !email || !password) {
    msg.textContent = "First name, email, and password are required";
    return;
  }
  if (password !== confirmPassword) {
    msg.textContent = "Passwords do not match";
    return;
  }
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
  if (!passwordRegex.test(password)) {
    msg.textContent = "Password does not meet strength requirements";
    return;
  }

  try {
    const res = await fetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ first_name, last_name, email, password, phone }),
    });

    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error || "Signup failed";
      return;
    }
    window.location.href = "/index.html";
  } catch (err) {
    msg.textContent = "Network error occurred";
    console.error("Signup error:", err);
  }
});
