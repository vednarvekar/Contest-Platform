import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Play, Clock, MemoryStick, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MOCK_PROBLEM = {
  id: 1,
  contestId: 1,
  title: "Two Sum",
  description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Input Format:**
- First line: number of test cases T
- For each test case:
  - First line: n (array size) and target
  - Second line: n space-separated integers

**Output Format:**
- For each test case, output two space-separated indices`,
  tags: ["array", "hash-table"],
  points: 100,
  timeLimit: 2000,
  memoryLimit: 256,
  visibleTestCases: [
    { input: "2\n4 9\n2 7 11 15\n3 6\n3 2 4", expectedOutput: "0 1\n1 2" },
  ],
};

const LANGUAGES = ["javascript", "python", "cpp", "java", "go"];

export default function ProblemViewPage() {
  const { problemId } = useParams();
  const problem = MOCK_PROBLEM;
  const [code, setCode] = useState("// Write your solution here\n");
  const [language, setLanguage] = useState("javascript");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: string; pointsEarned: number; testCasesPassed: number; totalTestCases: number } | null>(null);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }
    setSubmitting(true);
    setResult(null);
    // Mock submission with delay
    await new Promise((r) => setTimeout(r, 2000));
    setResult({
      status: "accepted",
      pointsEarned: 100,
      testCasesPassed: 5,
      totalTestCases: 5,
    });
    setSubmitting(false);
    toast.success("Solution accepted! 🎉");
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    accepted: { color: "text-success", icon: <CheckCircle2 className="h-5 w-5" /> },
    wrong_answer: { color: "text-destructive", icon: <XCircle className="h-5 w-5" /> },
    time_limit_exceeded: { color: "text-warning", icon: <Clock className="h-5 w-5" /> },
    runtime_error: { color: "text-destructive", icon: <XCircle className="h-5 w-5" /> },
  };

  return (
    <div className="space-y-4">
      <Link to={`/contests/${problem.contestId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Contest
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Problem Description */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{problem.title}</CardTitle>
                  <div className="mt-2 flex items-center gap-2">
                    {problem.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-lg">{problem.points} pts</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{problem.timeLimit}ms</span>
                    <span className="flex items-center gap-1"><MemoryStick className="h-3 w-3" />{problem.memoryLimit}MB</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm prose-invert max-w-none">
                {problem.description.split("\n").map((line, i) => (
                  <p key={i} className={`${line.startsWith("**") ? "font-semibold text-foreground" : "text-muted-foreground"} my-1`}>
                    {line.replace(/\*\*/g, "")}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sample Test Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {problem.visibleTestCases.map((tc, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Input</p>
                    <pre className="rounded-md bg-secondary p-3 font-mono text-xs">{tc.input}</pre>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Expected Output</p>
                    <pre className="rounded-md bg-secondary p-3 font-mono text-xs">{tc.expectedOutput}</pre>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Code Editor */}
        <div className="space-y-4">
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm">Solution</CardTitle>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border border-input bg-secondary px-2 py-1 text-xs font-mono"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </CardHeader>
            <CardContent className="flex-1">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-[400px] w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={false}
                placeholder="Write your code here..."
              />
            </CardContent>
            <div className="border-t p-4">
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running tests…</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" />Submit Solution</>
                )}
              </Button>
            </div>
          </Card>

          {/* Result */}
          {result && (
            <Card className={`border-l-4 ${result.status === "accepted" ? "border-l-success" : "border-l-destructive"}`}>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 text-lg font-bold ${statusConfig[result.status]?.color}`}>
                  {statusConfig[result.status]?.icon}
                  {result.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Points</p>
                    <p className="font-bold text-primary">{result.pointsEarned}/{MOCK_PROBLEM.points}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Test Cases</p>
                    <p className="font-bold">{result.testCasesPassed}/{result.totalTestCases}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={result.status === "accepted" ? "default" : "destructive"} className={result.status === "accepted" ? "bg-success text-success-foreground" : ""}>
                      {result.status === "accepted" ? "AC" : "WA"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
