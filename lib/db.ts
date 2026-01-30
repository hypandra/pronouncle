import { Pool } from "pg"
import fs from "fs"
import path from "path"

// Shared PostgreSQL pool for direct database queries
// Used for tables that Supabase PostgREST can't access (e.g., Better Auth tables with dots in name)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    ca: fs.readFileSync(path.join(process.cwd(), "prod-ca-2021.crt")).toString(),
    rejectUnauthorized: true,
  },
})

export { pool }
