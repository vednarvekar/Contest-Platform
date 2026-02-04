import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../server.js"
import { errorResponse} from "../utils/response.js"

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
    if(!JWT_SECRET){
        res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"))
    }

    const payload = {userId, role};
    const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "1d"});

return token;
}

export const verifyToken = (token) => {
    if(!JWT_SECRET){
        res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"))
    }
    if(!token) {
        res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"))
    }

    const decoded = jwt.verify(token, JWT_SECRET);

return decoded;
}