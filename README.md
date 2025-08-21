# 🔐 Secure Authentication System


![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue?logo=postgresql)
![Passport.js](https://img.shields.io/badge/Passport.js-OAuth2-success?logo=passport)
![License](https://img.shields.io/badge/License-MIT-yellow)

A **secure user authentication system** built with **TypeScript, Node.js (Express)**, and **PostgreSQL**.  
It integrates **2FA (Google Authenticator)**, **OAuth 2.0 (Google Sign-In)**, and **AES-256 encryption** for protecting sensitive data.


## ✨ Features
- 🔹 **User Signup & Login** (with session management)  
- 🔹 **AES-256 encryption** for sensitive data  
- 🔹 **2FA (Two-Factor Authentication)** using Google Authenticator  
- 🔹 **OAuth 2.0** login with Google  
- 🔹 **Recovery codes** for 2FA backup  
- 🔹 **Secure password hashing** with Argon2  
- 🔹 **Mockaroo dataset support** for testing  

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express, TypeScript  
- **Database:** PostgreSQL  
- **Auth:** Passport.js (Local + Google OAuth 2.0), Speakeasy (2FA)  
- **Encryption:** AES-256, Argon2  
- **Frontend:** Basic HTML/CSS/JS (with upgrade path to React)  

---

## 📂 Project Structure
src/
│ app.ts # Express app setup
│ server.ts # Server entry point
│ MOCK_DATA.csv # Sample users (Mockaroo)
│
├───db
│ pool.ts # PostgreSQL connection pool
│
├───public # Frontend (HTML/CSS/JS)
│ │ index.html # Login page
│ │ signup.html # Signup page
│ │ dashboard.html # Dashboard
│ │ setup-2fa.html # 2FA setup page
│ │ twofa.html # 2FA login page
│ │ styles.css
│ └───js
│ login.js
│ signup.js
│ twofa.js
│
├───routes # Express routes
│ auth.ts # Signup/Login/Auth routes
│ oauth.ts # Google OAuth routes
│ twofa.ts # 2FA routes
│
├───utilis # Utilities
│ crypto.ts # AES-256 + password hashing
│ twofa.ts # 2FA utilities
│
└───scripts
seed-mockaroo.ts 

# Script to seed database---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repo
```bash
git clone https://github.com/Ahmadx90/Secure-auth-system.git
cd Secure-auth-system

2️⃣ Install dependencies

-🔹npm install

3️⃣ Configure environment

-🔹Create a .env file based on .env.example:

NODE_ENV=development
PORT=3000
SESSION_SECRET=your-session-secret

DB_USER=your-db-user
DB_PASS=your-db-pass
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_system

ENC_KEY_V1=your-32-byte-hex-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_CALLBACK_URL=http://localhost:3000/oauth/google/callback

4️⃣ Run the database seed

-🔹npx ts-node src/scripts/seed-mockaroo.ts

5️⃣ Start the server

-🔹npm run dev
Visit 👉 http://localhost:3000

🔑 Demo Flow

-🔹 Signup/Login with email & password
-🔹 Enable 2FA → scan QR code with Google Authenticator
-🔹 Verify with OTP (or use recovery codes)
-🔹 Login with Google OAuth 2.0 for seamless access

📸 Screenshots

SnapShots
## 📸 Screenshots

## 📸 Snapshots

### 🔹 Login Page  
![Login Page](https://github.com/user-attachments/assets/7199c511-ead1-4a27-bcd0-cf4af8b97a0b)

### 🔹 Signup Page  
![Signup Page](https://github.com/user-attachments/assets/5fe34025-bc95-41b3-b97f-30eb74f7a660)

### 🔹 2FA Setup (QR Code)  
![2FA Setup](https://github.com/user-attachments/assets/a872580d-9d3c-4346-903f-a4fe05289340)

### 🔹 Dashboard  
![Dashboard](https://github.com/user-attachments/assets/eb9cc0e0-0a54-4d63-9744-4fc502b52863)




📌 Future Improvements

🚀 Full React frontend
📧 Email verification
🔒 Role-based access control
📊 Admin dashboard
🏷️ License


MIT License © 2025 Ahmad X

🌐 Connect with Me
💼 LinkedIn: https://www.linkedin.com/in/ahmad-sameer-17b339371/
🐙 GitHub: https://github.com/Ahmadx90


---

👉 This `README.md` is **ready-to-use**. Just copy-paste it into your project root.  
