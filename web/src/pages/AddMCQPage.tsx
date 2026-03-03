import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function AddMCQPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [points, setPoints] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateOption = (i: number, val: string) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    if (correctIndex >= options.length - 1) setCorrectIndex(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!questionText.trim()) { setError("Question is required"); return; }
    if (trimmedOptions.length < 2) { setError("At least 2 options required"); return; }
    if (correctIndex >= trimmedOptions.length) { setError("Invalid correct option"); return; }

    setLoading(true);
    const res = await api.addMCQ(Number(contestId), {
      questionText: questionText.trim(),
      options: trimmedOptions,
      correctOptionIndex: correctIndex,
      points,
    });
    setLoading(false);

    if (res.success) {
      toast.success("MCQ added successfully");
      navigate(`/contests/${contestId}`);
    } else {
      setError(res.error || "Failed to add MCQ");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/contests/${contestId}`} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Contest
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Add MCQ Question</CardTitle>
          <CardDescription>Add a multiple-choice question to the contest</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Question</label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="What is the time complexity of...?"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Options</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectIndex(i)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                      correctIndex === i ? "border-success bg-success/20 text-success" : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </button>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    required
                  />
                  {options.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="mr-1 h-3 w-3" />Add Option
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Click the letter to mark the correct answer (green = correct)</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Points</label>
              <Input type="number" min={1} max={100} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding…" : "Add MCQ"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
