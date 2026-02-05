import bcrypt from "bcrypt";
import {db} from "../db/pg.js";
import { Router } from "express";
import * as zod from "zod";
import { failureResponse, successResponse } from "../utils/response";
import { requireContestee, requireCreator, signToken } from "../lib/jwt";
// import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// -------------------------------------------------------------------------------------------------------

const userSchema = zod.object({
    name: zod.string().min(1),
    email: zod.email(),
    password: zod.string().min(6),
    role: zod.string().optional(),
});

router.post("/api/auth/signup", async(req, res) => {
    const parsed = userSchema.safeParse(req.body); 

    if(!parsed.success){
        return res.status(400).json(failureResponse("INVALID_REQUEST"));
    }

    const {name, email, password, role} = parsed.data;

    try {
        const existing = await db.query(
            `SELECT id FROM users WHERE email = $1`,
            [email]
        );

        if(existing.rows.length > 0){
            return res.status(400).json(failureResponse("EMAIL_ALREADY_EXISTS"));
        }

        // Hash Password
        const hashPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            `INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role`,
            [name, email, hashPassword, role ?? "contestee"]
        );

        return res.status(201).json(successResponse(result.rows[0]));

    } catch (error) {
        res.status(500).json(failureResponse("INTERNAL SERVER ERROR"))
    }
});

// -------------------------------------------------------------------------------------------------------

const loginSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(6),
});

router.post("/api/auth/login", async(req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json(failureResponse("INVALID_REQUEST"));
    }

    const {email, password} = parsed.data;

    try {
        const result = await db.query(
            `SELECT id, password, role FROM users WHERE email = $1`,
            [email]
        );

        if(result.rows.length === 0){
            return res.status(401).json(failureResponse("INVALID_CREDENTIALS"))
        }
        
        const user = result.rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json(failureResponse("INVALID_CREDENTIALS"));
        }

        const token = signToken(user.id, user.role);

        return res.status(200).json(successResponse({token}));

    } catch (error) {
        return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"))
    }
})

// -------------------------------------------------------------------------------------------------------


