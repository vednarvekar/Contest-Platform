import jwt from "jsonwebtoken";
import { failureResponse } from "../utils/response.js";
import dotenv from "dotenv";

dotenv.config({ path: "src/.env" });
dotenv.config();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

export const requireCreator = (req, res, next) => {
  if (req.user.role !== "creator") {
    return res.status(403).json(failureResponse("FORBIDDEN"));
  }
  next();
};

export const requireContestee = (req, res, next) => {
  if (req.user.role !== "contestee") {
    return res.status(403).json(failureResponse("FORBIDDEN"));
  }
  next();
};

export const signToken = (userId, role) => {
  const payload = { userId, role };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "1d" });
};

export const verifyToken = (token) => {
  if (!token) {
    throw new Error("Missing token");
  }

  return jwt.verify(token, getJwtSecret());
};
