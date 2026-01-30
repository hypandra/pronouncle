import { betterAuth } from "better-auth"
import { Pool } from "pg"
import fs from "fs"
import path from "path"

const authSecret = process.env.BETTER_AUTH_SECRET
if (!authSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing BETTER_AUTH_SECRET")
  }
  console.warn("BETTER_AUTH_SECRET is not set; using insecure dev secret.")
}

// Create PostgreSQL pool with SSL configuration using Supabase CA certificate
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    ca: fs.readFileSync(path.join(process.cwd(), "prod-ca-2021.crt")).toString(),
    rejectUnauthorized: true,
  },
})

export const auth = betterAuth({
  secret: authSecret ?? "dev-secret",
  database: pool as any,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: "pronouncle.users",
  },
  session: {
    modelName: "pronouncle.sessions",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  account: {
    modelName: "pronouncle.accounts",
  },
  verification: {
    modelName: "pronouncle.verifications",
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "https://pronouncle.com",
  ],
})
