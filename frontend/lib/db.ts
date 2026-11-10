import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@192.168.1.229:5432/hsg_math";

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;
