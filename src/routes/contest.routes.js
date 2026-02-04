import {db} from "../db/pg.js";
import { Router } from "express";
import * as zod from "zod";
import { failureResponse, successResponse } from "../utils/response";
import { requireContestee, requireCreator, } from "../lib/jwt";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// -------------------------------------------------------------------------------------------------------

const creatorSchema = zod.object({
    title: zod.string().min(1),
    description: zod.string().optional(),
    startTime: zod.iso.datetime(),
    endTime: zod.iso.datetime(),
});

router.post("/api/contests", requireAuth, requireCreator, async(req, res) => {
    const parsed = creatorSchema.safeParse(req.body);

    if(!parsed.success){
        return res.status(400).json(failureResponse("INVALID_REQUEST"))
    }

    const {title, description, startTime, endTime} = parsed.data;
    const creatorId = req.user.id;

    try {
        const result = await db.query(
            `INSERT INTO contests (title, description, creator_id, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, title, description, creator_id, start_time, end_time`,
            [title, description ?? null, creatorId, startTime, endTime]
        );

        return res.status(201).json(successResponse({
            id: result.rows[0].id,
            title: result.rows[0].title,
            description: result.rows[0].description,
            creatorId,
            startTime,
            endTime,
        }));

    } catch (error) {
        return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"))
    }
})

// -------------------------------------------------------------------------------------------------------

router.post("/api/contests/:constestId", requireAuth, async(req, res) => {
    const {contestId} = req.params;

    try {
        const contestRes = await db.query(
            `SELECT id, title, description, creator_id, start_time, end_time
            FROM contests
            WHERE id = $1`,
            [contestId]
        );

        if(contestRes.rows.length === 0) {
            return res.status(404).json(failureResponse("CONTEST_NOT_FOUND"));
        }

        const contest = contestRes.rows[0];

        const mscRes = await db.query(
            `SELECT id, question_text, options, points
            FROM mcq_questions
            WHERE contests_id = $1`,
            [contestId]
        );

        const dsaRes = await db.query(
            `SELECT id, title, description, tags, points, time_limit, memory_limit
            FROM dsa_problems
            WHERE contests_id = $1`,
            [contestId]
        );

        return res.status(200).json(successResponse({
            id: contest.id,
            title: contest.title,
            description: contest.description,
            startTime: contest.start_time,
            endTime: contest.end_time,
            creatorId: contest.creator_id,

            mcqs: mscRes.rows.map(m => ({
                id: m.id,
                questionText: m.question_text,
                options: m.options,
                points: m.points,
            })),

            dsaProblems: dsaRes.rows.map(d => ({
                id: d.id,
                title: d.title,
                description: d.description,
                tags: d.tags,
                points: d.points,
                timeLimit: d.time_limit,
                memoryLimit: d.memory_limit,
            })),
        }));

    } catch (error) {
        return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"))
    }
})

// -------------------------------------------------------------------------------------------------------

const mcqSchema = zod.object({
    questionText: zod.string().min(1),
    options: zod.array(zod.string()).min(2),
    correctOptionIndex: zod.number().int().nonnegative(),
    points: zod.number().int().positive().optional(),
});

router.post("/api/contests/:contestId/mcq", requireAuth, requireCreator, async(req, res) => {
    const {contestId} = req.params;

    const parsed = mcqSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json(failureResponse("INVALID_RESPONSE"));
    }

    const {questionText, options, correctOptionIndex, points} = parsed.data;

    try {
        const contestRes = await db.query(
            `SELECT id FROM contests WHERE id = $1`,
            [contestId]
        );
        if(contestRes.rows.length === 0){
            return res.status(404).json(failureResponse("CONTEST_NOT_FOUND"));
        }

        const mcqRes = await db.query(
            `INSERT INTO mcq_questions 
            (contests_id, question_text, options, correct_option_index, points)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`
            [contestId, questionText, JSON.stringify(options), correctOptionIndex, points ?? 1]
        );

        return res.status(201).json(successResponse({
            id: mcqRes.rows[0].id,
            contestId,
        }));

    } catch (error) {
        return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
    }
})

// -------------------------------------------------------------------------------------------------------

const mcqSubmissionSchema = zod.object({
    selectedOptionIndex: zod.number().int().nonnegative(),
});

router.post("/api/contests/:contestId/mcq/:questionId/submit", requireAuth, requireContestee, async(req, res) => {
    const {contestId, questionId} = req.params;
    const userId = req.user.id;

    const parsed = mcqSubmissionSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json(failureResponse("INVALID_REQUEST"));
    }

    const {selectedOptionIndex} = parsed.data;

    try {
        const contestRes = await db.query(
            `SELECT creator_id, start_time, end_time
            FROM contests
            WHERE id = $1`,
            [contestId]
        );
        if(contestRes.rows.length === 0) {
            return res.status(404).json(failureResponse("CONTEST_NOT_FOUND"))
        }
        const contest = contestRes.rows[0];

        const now = new Date();
        if(now < contest.start_time || now > contest.end_time){
            return res.status(400).json(failureResponse("CONTEST_NOT_ACTIVE"))
        };

        const mcqRes = await db.query(
            `SELECT correct_option_index, points 
            FROM mcq_questions
            WHERE id = $1 AND contest_id = $2`,
            [contestId, questionId]
        );
        if(mcqRes.rows.length === 0){
            return res.status(404).json(failureResponse("QUESTION_NOT_FOUND"))
        }
        const mcq = mcqRes.rows[0];

        const submittedRes = await db.query(
            `SELECT id FROM mcq_submissions
            WHERE user_id = $1, AND question_id = $2`,
            [userId, questionId]
        );
        if(submittedRes.rows.length > 0){
            return res.status(400).json(failureResponse("ALREADY_SUBMITTED"));
        }

        const isCorrect = selectedOptionIndex === mcq.correct_option_index;
        const pointsEarned = isCorrect ? mcq.points : 0;

        await db.query(
            ` INSERT INTO mcq_questions 
            (user_id, question_id, selected_option_index, is_correct, points_earned)
            VALUES ($1, $2, $3, $4, $5)`,
            [userId, questionId, selectedOptionIndex, isCorrect, pointsEarned]
        );

        return res.status(201).json(successResponse({
            isCorrect,
            pointsEarned,
        }));

    } catch (error) {
        return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
    }
})

// -------------------------------------------------------------------------------------------------------

const dsaPrbSchema = zod.object({
    title: zod.string().min(1),
    description: zod.string().min(1),
    tags: zod.array(zod.string()),
    points: zod.number().int().optional(),
    timeLimit: zod.number().int().optional(),
    memoryLimit: zod.number().int().optional(),
    testCases: zod.array(zod.object({
        input: zod.string(),
        expectedOutput: zod.string(),
        isHidden: zod.boolean().optional()
    })).min(1)
});

router.post("/api/contests/:contestId/dsa", requireAuth , requireCreator, async(req, res) => {
    const {contestId} = req.params;
    const parsed = dsaPrbSchema.safeParse(req.body);

    if(!parsed.success){
        return res.status(400).json(failureResponse("INVALID_REQUEST"))
    }

    const {title, description, tags, points, timeLimit, memoryLimit, testCases} = parsed.body;

})