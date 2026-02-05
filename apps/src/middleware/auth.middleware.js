import { verifyToken } from "../lib/jwt";
import { failureResponse } from "../utils/response";

export const requireAuth = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        
        if(!header){
            return res.status(401).json(failureResponse("UNAUTHORIZED"));
        }
        
        if(!header.startsWith("Bearer ")){
            return res.status(401).json(failureResponse("UNAUTHORIZED"));
        }
        
        const token = header.substring(7);
        const decoded = verifyToken(token);
        
        req.user = {id: decoded.userId, role: decoded.role};
        next();
    } catch (error) {
        return res.status(401).json(failureResponse("UNAUTHORIZED"));
    }
}

