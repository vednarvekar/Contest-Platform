import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
import contestRouter from "./routes/contest.routes.js";

dotenv.config({ path: "src/.env" });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(`[api] ${req.method} ${req.path} origin=${req.headers.origin || "none"}`);
  }
  next();
});
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const configured = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const allowedOrigins = configured.length > 0 ? configured : [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];

  const isLocalDevOrigin =
    typeof requestOrigin === "string" &&
    /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(requestOrigin);

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || isLocalDevOrigin)) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
  } else if (!requestOrigin) {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use(authRouter);
app.use(contestRouter);

app.listen(PORT, () => {
  console.log(`Server is listening at Port ${PORT}`);
});
