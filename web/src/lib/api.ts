const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch {
    return { success: false, data: null, error: "NETWORK_ERROR" };
  }
}

// Auth
export interface AuthUser {
  id: number;
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

  getContest: (id: number) =>
    request<ContestDetail>(`/api/contests/${id}`),

  // MCQ
  addMCQ: (contestId: number, body: { questionText: string; options: string[]; correctOptionIndex: number; points: number }) =>
    request<{ id: number; contestId: number }>(`/api/contests/${contestId}/mcq`, { method: "POST", body: JSON.stringify(body) }),

  submitMCQ: (contestId: number, questionId: number, body: { selectedOptionIndex: number }) =>
    request<{ isCorrect: boolean; pointsEarned: number }>(`/api/contests/${contestId}/mcq/${questionId}/submit`, { method: "POST", body: JSON.stringify(body) }),

  // DSA
  addDSA: (contestId: number, body: any) =>
    request<{ id: number; contestId: number }>(`/api/contests/${contestId}/dsa`, { method: "POST", body: JSON.stringify(body) }),

  getProblem: (problemId: number) =>
    request<DSAProblemDetail>(`/api/problems/${problemId}`),

  submitDSA: (problemId: number, body: { code: string; language: string }) =>
    request<DSASubmissionResult>(`/api/problems/${problemId}/submit`, { method: "POST", body: JSON.stringify(body) }),

  // Leaderboard
  getLeaderboard: (contestId: number) =>
    request<LeaderboardEntry[]>(`/api/contests/${contestId}/leaderboard`),
};

// Types
export interface Contest {
  id: number;
  title: string;
  description: string;
  creatorId: number;
  startTime: string;
  endTime: string;
}

export interface MCQ {
  id: number;
  questionText: string;
  options: string[];
  points: number;
  correctOptionIndex?: number;
}

export interface DSAProblem {
  id: number;
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
  contestId: number;
  visibleTestCases: { input: string; expectedOutput: string }[];
}

export interface DSASubmissionResult {
  status: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error";
  pointsEarned: number;
  testCasesPassed: number;
  totalTestCases: number;
}

export interface LeaderboardEntry {
  userId: number;
  name: string;
  totalPoints: number;
  rank: number;
}
