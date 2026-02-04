import { Pool } from "pg";

export const db = new Pool({
    host: "localhost",
    port: 5432,
    user: "vedvn",
    password: "vednarvekar",
    database: "contest-platform"
})