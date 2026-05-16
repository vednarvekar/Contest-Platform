import { Router } from "express";
import * as zod from "zod";
import axios from "axios";
import { db } from "../db/pg.js";
import { failureResponse, successResponse } from "../utils/response.js";
import { requireContestee, requireCreator } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const contestSchema = zod
  .object({
    title: zod.string().min(1),
    description: zod.string().optional(),
    startTime: zod.iso.datetime(),
    endTime: zod.iso.datetime(),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

router.post("/api/contests", requireAuth, requireCreator, async (req, res) => {
  const parsed = contestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(failureResponse("INVALID_REQUEST"));
  }

  const { title, description, startTime, endTime } = parsed.data;

  try {
    const result = await db.query(
      `INSERT INTO contests (title, description, creator_id, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, creator_id, start_time, end_time`,
      [title, description ?? null, req.user.id, startTime, endTime]
    );

    const c = result.rows[0];
    return res.status(201).json(
      successResponse({
        id: c.id,
        title: c.title,
        description: c.description,
        creatorId: c.creator_id,
        startTime: c.start_time,
        endTime: c.end_time,
      })
    );
  } catch {
    return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
  }
});

router.get("/api/contests/:contestId", requireAuth, async (req, res) => {
  const { contestId } = req.params;

  try {
    const contestRes = await db.query(
      `SELECT id, title, description, creator_id, start_time, end_time
       FROM contests
       WHERE id = $1`,
      [contestId]
    );

    if (contestRes.rows.length === 0) {
      return res.status(404).json(failureResponse("CONTEST_NOT_FOUND"));
    }

    const mcqRes = await db.query(
      `SELECT id, question_text, options, points
       FROM mcq_questions
       WHERE contest_id = $1
       ORDER BY created_at ASC`,
      [contestId]
    );

    const dsaRes = await db.query(
      `SELECT id, title, description, tags, points, time_limit, memory_limit
       FROM dsa_problems
       WHERE contest_id = $1
       ORDER BY created_at ASC`,
      [contestId]
    );

    const c = contestRes.rows[0];
    return res.status(200).json(
      successResponse({
        id: c.id,
        title: c.title,
        description: c.description,
        creatorId: c.creator_id,
        startTime: c.start_time,
        endTime: c.end_time,
        mcqs: mcqRes.rows.map((m) => ({
          id: m.id,
          questionText: m.question_text,
          options: m.options,
          points: m.points,
        })),
        dsaProblems: dsaRes.rows.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          tags: d.tags,
          points: d.points,
          timeLimit: d.time_limit,
          memoryLimit: d.memory_limit,
        })),
      })
    );
  } catch {
    return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
  }
});

const mcqSchema = zod.object({
  questionText: zod.string().min(1),
  options: zod.array(zod.string().min(1)).min(2),
  correctOptionIndex: zod.number().int().nonnegative(),
  points: zod.number().int().positive().optional(),
});

router.post("/api/contests/:contestId/mcq", requireAuth, requireCreator, async (req, res) => {
  const { contestId } = req.params;
  const parsed = mcqSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(failureResponse("INVALID_REQUEST"));
  }

  const { questionText, options, correctOptionIndex, points } = parsed.data;
  if (correctOptionIndex >= options.length) {
    return res.status(400).json(failureResponse("INVALID_REQUEST"));
  }

  try {
    const contestRes = await db.query(`SELECT id FROM contests WHERE id = $1`, [contestId]);
    if (contestRes.rows.length === 0) {
      return res.status(404).json(failureResponse("CONTEST_NOT_FOUND"));
    }

    const mcqRes = await db.query(
      `INSERT INTO mcq_questions
       (contest_id, question_text, options, correct_option_index, points)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [contestId, questionText, JSON.stringify(options), correctOptionIndex, points ?? 1]
    );

    return res.status(201).json(
      successResponse({
        id: mcqRes.rows[0].id,
        contestId,
      })
    );
  } catch {
    return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
  }
});

const mcqSubmissionSchema = zod.object({
  selectedOptionIndex: zod.number().int().nonnegative(),
});

router.post(
  "/api/contests/:contestId/mcq/:questionId/submit",
  requireAuth,
  requireContestee,
  async (req, res) => {
    const { contestId, questionId } = req.params;
    const userId = req.user.id;

    const parsed = mcqSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(failureResponse("INVALID_REQUEST"));
    }

    try {
      const contestRes = await db.query(
        `SELECT start_time, end_time FROM contests WHERE id = $1`,
        [contestId]
      );
      if (contestRes.rows.length === 0) {
        return res.status(404).json(failureResponse("CONTEST_NOT_FOUND"));
      }

      const now = new Date();
      const { start_time, end_time } = contestRes.rows[0];
      if (now < new Date(start_time) || now > new Date(end_time)) {
        return res.status(400).json(failureResponse("CONTEST_NOT_ACTIVE"));
      }

      const mcqRes = await db.query(
        `SELECT correct_option_index, points
         FROM mcq_questions
         WHERE id = $1 AND contest_id = $2`,
        [questionId, contestId]
      );
      if (mcqRes.rows.length === 0) {
        return res.status(404).json(failureResponse("QUESTION_NOT_FOUND"));
      }

      const submittedRes = await db.query(
        `SELECT id FROM mcq_submissions WHERE user_id = $1 AND question_id = $2`,
        [userId, questionId]
      );
      if (submittedRes.rows.length > 0) {
        return res.status(400).json(failureResponse("ALREADY_SUBMITTED"));
      }

      const { selectedOptionIndex } = parsed.data;
      const mcq = mcqRes.rows[0];
      const isCorrect = selectedOptionIndex === mcq.correct_option_index;
      const pointsEarned = isCorrect ? mcq.points : 0;

      await db.query(
        `INSERT INTO mcq_submissions
         (user_id, question_id, selected_option_index, is_correct, points_earned)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, questionId, selectedOptionIndex, isCorrect, pointsEarned]
      );

      return res.status(201).json(successResponse({ isCorrect, pointsEarned }));
    } catch {
      return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
    }
  }
);

const dsaSchema = zod.object({
  title: zod.string().min(1),
  description: zod.string().min(1),
  tags: zod.array(zod.string()).optional(),
  points: zod.number().int().positive().optional(),
  timeLimit: zod.number().int().positive().optional(),
  memoryLimit: zod.number().int().positive().optional(),
  testCases: zod
    .array(
      zod.object({
        input: zod.string(),
        expectedOutput: zod.string(),
        isHidden: zod.boolean().optional(),
      })
    )
    .min(1),
});

router.post("/api/contests/:contestId/dsa", requireAuth, requireCreator, async (req, res) => {
  const { contestId } = req.params;
  const parsed = dsaSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(failureResponse("INVALID_REQUEST"));
  }

  const { title, description, tags, points, timeLimit, memoryLimit, testCases } = parsed.data;

  try {
    const contestCheck = await db.query(`SELECT id FROM contests WHERE id = $1`, [contestId]);
    if (contestCheck.rows.length === 0) {
      return res.status(404).json(failureResponse("CONTEST_NOT_FOUND"));
    }

    await db.query("BEGIN");

    const problemRes = await db.query(
      `INSERT INTO dsa_problems (contest_id, title, description, tags, points, time_limit, memory_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        contestId,
        title,
        description,
        JSON.stringify(tags ?? []),
        points ?? 100,
        timeLimit ?? 2000,
        memoryLimit ?? 256,
      ]
    );

    const problemId = problemRes.rows[0].id;

    for (const tc of testCases) {
      await db.query(
        `INSERT INTO test_cases(problem_id, input, expected_output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.expectedOutput, tc.isHidden ?? false]
      );
    }

    await db.query("COMMIT");

    return res.status(201).json(
      successResponse({
        id: problemId,
        contestId,
      })
    );
  } catch {
    await db.query("ROLLBACK");
    return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
  }
});

router.get("/api/problems/:problemId", requireAuth, async (req, res) => {
  const { problemId } = req.params;

  try {
    const problemRes = await db.query(`SELECT * FROM dsa_problems WHERE id = $1`, [problemId]);
    if (problemRes.rows.length === 0) {
      return res.status(404).json(failureResponse("PROBLEM_NOT_FOUND"));
    }

    const testcasesRes = await db.query(
      `SELECT input, expected_output FROM test_cases
       WHERE problem_id = $1 AND is_hidden = false`,
      [problemId]
    );

    const p = problemRes.rows[0];
    return res.status(200).json(
      successResponse({
        id: p.id,
        contestId: p.contest_id,
        title: p.title,
        description: p.description,
        tags: p.tags,
        points: p.points,
        timeLimit: p.time_limit,
        memoryLimit: p.memory_limit,
        visibleTestCases: testcasesRes.rows.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expected_output,
        })),
      })
    );
  } catch {
    return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
  }
});

const dsaSubmitSchema = zod.object({
  code: zod.string().min(1),
  language: zod.string().min(1),
});

router.post("/api/problems/:problemId/submit", requireAuth, requireContestee, async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user.id;
  const parsed = dsaSubmitSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(failureResponse("INVALID_REQUEST"));
  }

  const { code, language } = parsed.data;

  try {
    const problemRes = await db.query(
      `SELECT dp.points, c.start_time, c.end_time
       FROM dsa_problems dp
       JOIN contests c ON dp.contest_id = c.id
       WHERE dp.id = $1`,
      [problemId]
    );

    if (problemRes.rows.length === 0) {
      return res.status(404).json(failureResponse("PROBLEM_NOT_FOUND"));
    }

    const { points, start_time, end_time } = problemRes.rows[0];
    const now = new Date();
    if (now < new Date(start_time) || now > new Date(end_time)) {
      return res.status(400).json(failureResponse("CONTEST_NOT_ACTIVE"));
    }

    const testRes = await db.query(
      `SELECT input, expected_output FROM test_cases WHERE problem_id = $1`,
      [problemId]
    );

    const testCases = testRes.rows;
    let passedCount = 0;
    let finalStatus = "accepted";

    for (const tc of testCases) {
      const response = await axios.post("http://localhost:2358/submissions?wait=true", {
        source_code: Buffer.from(code).toString("base64"),
        language_id: 63,
        stdin: Buffer.from(tc.input).toString("base64"),
        expected_output: Buffer.from(tc.expected_output).toString("base64"),
      });

      const judgeStatus = response?.data?.status?.id;
      if (judgeStatus === 3) {
        passedCount += 1;
      } else if (judgeStatus === 4) {
        finalStatus = "wrong_answer";
      } else if (judgeStatus === 5) {
        finalStatus = "time_limit_exceeded";
      } else {
        finalStatus = "runtime_error";
      }
    }

    const total = testCases.length;
    const pointsEarned = total > 0 ? Math.floor((passedCount / total) * points) : 0;
    if (passedCount < total && finalStatus === "accepted") {
      finalStatus = "wrong_answer";
    }

    await db.query(
      `INSERT INTO dsa_submissions
       (user_id, problem_id, code, language, status, points_earned, test_cases_passed, total_test_cases)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, problemId, code, language, finalStatus, pointsEarned, passedCount, total]
    );

    return res.status(201).json(
      successResponse({
        status: finalStatus,
        pointsEarned,
        testCasesPassed: passedCount,
        totalTestCases: total,
      })
    );
  } catch {
    return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
  }
});

router.get("/api/contests/:contestId/leaderboard", requireAuth, async (req, res) => {
  const { contestId } = req.params;

  try {
    const contestRes = await db.query(`SELECT id FROM contests WHERE id = $1`, [contestId]);
    if (contestRes.rows.length === 0) {
      return res.status(404).json(failureResponse("CONTEST_NOT_FOUND"));
    }

    const leaderboardQuery = `
      WITH user_mcq_scores AS (
        SELECT ms.user_id, SUM(ms.points_earned) AS total_mcq
        FROM mcq_submissions ms
        JOIN mcq_questions mq ON ms.question_id = mq.id
        WHERE mq.contest_id = $1
        GROUP BY ms.user_id
      ),
      user_dsa_scores AS (
        SELECT user_id, SUM(max_problem_points) AS total_dsa
        FROM (
          SELECT ds.user_id, ds.problem_id, MAX(ds.points_earned) AS max_problem_points
          FROM dsa_submissions ds
          JOIN dsa_problems dp ON ds.problem_id = dp.id
          WHERE dp.contest_id = $1
          GROUP BY ds.user_id, ds.problem_id
        ) AS best_subs
        GROUP BY user_id
      )
      SELECT
        u.id AS "userId",
        u.name,
        COALESCE(m.total_mcq, 0) + COALESCE(d.total_dsa, 0) AS "totalPoints",
        DENSE_RANK() OVER (ORDER BY (COALESCE(m.total_mcq, 0) + COALESCE(d.total_dsa, 0)) DESC) AS rank
      FROM users u
      LEFT JOIN user_mcq_scores m ON u.id = m.user_id
      LEFT JOIN user_dsa_scores d ON u.id = d.user_id
      WHERE m.user_id IS NOT NULL OR d.user_id IS NOT NULL
      ORDER BY "totalPoints" DESC, u.name ASC;
    `;

    const result = await db.query(leaderboardQuery, [contestId]);
    return res.status(200).json(successResponse(result.rows));
  } catch {
    return res.status(500).json(failureResponse("INTERNAL_SERVER_ERROR"));
  }
});

export default router;
