import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "src/.env" });
dotenv.config();

const dbPassword = process.env.DB_PASSWORD;

export const db = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: dbPassword && dbPassword.length > 0 ? dbPassword : undefined,
  database: process.env.DB_NAME || "contest-platform",
});
