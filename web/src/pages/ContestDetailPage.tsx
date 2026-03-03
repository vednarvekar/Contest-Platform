import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Code2, FileQuestion, Trophy, CheckCircle2, XCircle, Plus } from "lucide-react";
import { toast } from "sonner";

// Mock data
const MOCK_CONTEST = {
  id: 1,
  title: "Weekly Challenge #12",
  description: "Test your skills with arrays, strings, and graph algorithms",
  startTime: "2026-03-05T10:00:00Z",
  endTime: "2026-03-05T12:00:00Z",
  creatorId: 1,
  mcqs: [
    { id: 1, questionText: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], points: 1 },
    { id: 2, questionText: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Linked List", "Tree"], points: 1 },
    { id: 3, questionText: "What is the space complexity of merge sort?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], points: 2 },
  ],
  dsaProblems: [
    { id: 1, title: "Two Sum", description: "Find two numbers that add up to target", tags: ["array", "hash-table"], points: 100, timeLimit: 2000, memoryLimit: 256 },
    { id: 2, title: "Valid Parentheses", description: "Check if parentheses are valid", tags: ["stack", "string"], points: 150, timeLimit: 1000, memoryLimit: 256 },
  ],
};

export default function ContestDetailPage() {
  const { contestId } = useParams();
  const { user } = useAuth();
  const contest = MOCK_CONTEST;
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedMCQs, setSubmittedMCQs] = useState<Record<number, { isCorrect: boolean; pointsEarned: number }>>({});

  const isCreator = user?.role === "creator";
  const now = new Date();
  const isLive = now >= new Date(contest.startTime) && now <= new Date(contest.endTime);
  const isUpcoming = now < new Date(contest.startTime);
  const isEnded = now > new Date(contest.endTime);

  const handleMCQSubmit = (questionId: number) => {
    if (selectedAnswers[questionId] === undefined) {
      toast.error("Please select an option");
      return;
    }
    // Mock submission
    const isCorrect = selectedAnswers[questionId] === 1; // mock: option index 1 is always correct
    setSubmittedMCQs((prev) => ({
      ...prev,
      [questionId]: { isCorrect, pointsEarned: isCorrect ? 1 : 0 },
    }));
    toast(isCorrect ? "Correct! 🎉" : "Wrong answer ❌");
  };

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Contest Header */}
      <Card className="glow-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{contest.title}</CardTitle>
                <Badge variant={isLive ? "default" : isUpcoming ? "secondary" : "outline"}
                  className={isLive ? "bg-success text-success-foreground animate-pulse-glow" : ""}>
                  {isLive ? "Live" : isUpcoming ? "Upcoming" : "Ended"}
                </Badge>
              </div>
              <CardDescription>{contest.description}</CardDescription>
            </div>
            <Link to={`/contests/${contestId}/leaderboard`}>
              <Button variant="outline" size="sm">
                <Trophy className="mr-1 h-4 w-4" />
                Leaderboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(contest.startTime).toLocaleString()} – {new Date(contest.endTime).toLocaleString()}</span>
            <span className="flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5" />{contest.mcqs.length} MCQs</span>
            <span className="flex items-center gap-1"><Code2 className="h-3.5 w-3.5" />{contest.dsaProblems.length} Problems</span>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="mcqs">
        <TabsList>
          <TabsTrigger value="mcqs">MCQ Questions</TabsTrigger>
          <TabsTrigger value="dsa">DSA Problems</TabsTrigger>
        </TabsList>

        <TabsContent value="mcqs" className="space-y-4">
          {isCreator && (
            <Link to={`/contests/${contestId}/add-mcq`}>
              <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" />Add MCQ</Button>
            </Link>
          )}
          {contest.mcqs.map((mcq, idx) => {
            const submitted = submittedMCQs[mcq.id];
            return (
              <Card key={mcq.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-xs font-bold">{idx + 1}</span>
                      <p className="font-medium">{mcq.questionText}</p>
                    </div>
                    <Badge variant="outline">{mcq.points} pt{mcq.points > 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {mcq.options.map((opt, i) => (
                      <button
                        key={i}
                        disabled={!!submitted}
                        onClick={() => setSelectedAnswers((prev) => ({ ...prev, [mcq.id]: i }))}
                        className={`rounded-md border p-3 text-left text-sm transition-all ${
                          submitted
                            ? submitted.isCorrect && selectedAnswers[mcq.id] === i
                              ? "border-success bg-success/10 text-success"
                              : !submitted.isCorrect && selectedAnswers[mcq.id] === i
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border bg-secondary text-muted-foreground"
                            : selectedAnswers[mcq.id] === i
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-secondary-foreground hover:border-muted-foreground"
                        }`}
                      >
                        <span className="mr-2 font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {!isCreator && !submitted && (
                    <Button size="sm" onClick={() => handleMCQSubmit(mcq.id)} disabled={selectedAnswers[mcq.id] === undefined}>
                      Submit Answer
                    </Button>
                  )}
                  {submitted && (
                    <div className={`flex items-center gap-2 text-sm font-medium ${submitted.isCorrect ? "text-success" : "text-destructive"}`}>
                      {submitted.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {submitted.isCorrect ? `Correct! +${submitted.pointsEarned} pts` : "Wrong answer"}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="dsa" className="space-y-4">
          {isCreator && (
            <Link to={`/contests/${contestId}/add-dsa`}>
              <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" />Add DSA Problem</Button>
            </Link>
          )}
          {contest.dsaProblems.map((problem) => (
            <Link key={problem.id} to={`/problems/${problem.id}`}>
              <Card className="transition-all hover:border-primary/30 hover:glow-primary">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{problem.title}</h3>
                    <p className="text-sm text-muted-foreground">{problem.description}</p>
                    <div className="flex items-center gap-2">
                      {problem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{problem.points} pts</p>
                    <p className="text-xs text-muted-foreground">{problem.timeLimit}ms / {problem.memoryLimit}MB</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
