// This script seeds the database with mock data from CSV.
// Hashes passwords with bcrypt.
// Encrypts phone numbers with AES-256.
// Skips duplicates via ON CONFLICT.
// Logs insertion stats.

import { createReadStream } from "fs";
import csv from "csv-parser";
import pool from "../db/pool";
import { hashPassword, encryptAES } from "../utilis/crypto";
import path from "path";

async function seedDatabase() {
  const users: any[] = [];
  let inserted = 0;
  let errors = 0;

  try {
    // Read CSV file (update path to relative if needed)
    await new Promise((resolve, reject) => {
      createReadStream("../MOCK_DATA.csv")
        .pipe(csv())
        .on("data", (row) => {
          users.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`Loaded ${users.length} rows from CSV.`);

    // Insert users into the database
    for (const row of users) {
      try {
        const passwordHash = await hashPassword(row.password);
        const plainPhone = row.phone || null;
        const encryptedPhone = plainPhone ? encryptAES(plainPhone) : null;
        const query = `
          INSERT INTO public.users (first_name, last_name, email, phone, password_hash)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (email) DO NOTHING
        `;
        const values = [
          row.first_name,
          row.last_name || null,
          row.email.toLowerCase(),
          encryptedPhone,
          passwordHash,
        ];
        await pool.query(query, values);
        inserted++;
      } catch (err: any) {
        console.error(`Error inserting user ${row.email}:`, err.message);
        errors++;
      }
    }

    // Verify total users in DB
    const { rows } = await pool.query("SELECT COUNT(*) FROM public.users");
    const totalUsers = parseInt(rows[0].count, 10);

    console.log(
      `Seeding finished. Inserted: ${inserted}, Errors: ${errors}, Users in DB: ${totalUsers}`
    );
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await pool.end();
  }
}

seedDatabase().catch(console.error);
