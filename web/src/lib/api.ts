const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4444";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("token");
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    if (import.meta.env.DEV) {
      console.log("[api] request", { method: options.method || "GET", url });
    }
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const raw = await res.text();
    if (!raw) {
      return {
        success: false,
        data: null,
        error: res.ok ? null : `HTTP_${res.status}`,
      };
    }

    try {
      const json = JSON.parse(raw) as ApiResponse<T>;
      if (typeof json?.success === "boolean" && "data" in json && "error" in json) {
        return json;
      }
      return {
        success: false,
        data: null,
        error: res.ok ? "INVALID_RESPONSE" : `HTTP_${res.status}`,
      };
    } catch {
      return {
        success: false,
        data: null,
        error: res.ok ? "INVALID_RESPONSE" : `HTTP_${res.status}`,
      };
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[api] network_error", { method: options.method || "GET", url, error });
    }
    return { success: false, data: null, error: "NETWORK_ERROR" };
  }
}

// Auth
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "creator" | "contestee";
}

export const api = {
  signup: (body: { name: string; email: string; password: string; role: string }) =>
    request<AuthUser>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  // Contests
  createContest: (body: { title: string; description: string; startTime: string; endTime: string }) =>
    request<Contest>("/api/contests", { method: "POST", body: JSON.stringify(body) }),

  getContest: (id: string | number) =>
    request<ContestDetail>(`/api/contests/${id}`),

  // MCQ
  addMCQ: (contestId: string | number, body: { questionText: string; options: string[]; correctOptionIndex: number; points: number }) =>
    request<{ id: string; contestId: string }>(`/api/contests/${contestId}/mcq`, { method: "POST", body: JSON.stringify(body) }),

  submitMCQ: (contestId: string | number, questionId: string | number, body: { selectedOptionIndex: number }) =>
    request<{ isCorrect: boolean; pointsEarned: number }>(`/api/contests/${contestId}/mcq/${questionId}/submit`, { method: "POST", body: JSON.stringify(body) }),

  // DSA
  addDSA: (contestId: string | number, body: any) =>
    request<{ id: string; contestId: string }>(`/api/contests/${contestId}/dsa`, { method: "POST", body: JSON.stringify(body) }),

  getProblem: (problemId: string | number) =>
    request<DSAProblemDetail>(`/api/problems/${problemId}`),

  submitDSA: (problemId: string | number, body: { code: string; language: string }) =>
    request<DSASubmissionResult>(`/api/problems/${problemId}/submit`, { method: "POST", body: JSON.stringify(body) }),

  // Leaderboard
  getLeaderboard: (contestId: string | number) =>
    request<LeaderboardEntry[]>(`/api/contests/${contestId}/leaderboard`),
};

// Types
export interface Contest {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  startTime: string;
  endTime: string;
}

export interface MCQ {
  id: string;
  questionText: string;
  options: string[];
  points: number;
  correctOptionIndex?: number;
}

export interface DSAProblem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  points: number;
  timeLimit: number;
  memoryLimit: number;
}

export interface ContestDetail extends Contest {
  mcqs: MCQ[];
  dsaProblems: DSAProblem[];
}

export interface DSAProblemDetail extends DSAProblem {
  contestId: string;
  visibleTestCases: { input: string; expectedOutput: string }[];
}

export interface DSASubmissionResult {
  status: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error";
  pointsEarned: number;
  testCasesPassed: number;
  totalTestCases: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  totalPoints: number;
  rank: number;
}
