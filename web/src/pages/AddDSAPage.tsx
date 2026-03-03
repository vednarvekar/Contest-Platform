import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export default function AddDSAPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [points, setPoints] = useState(100);
  const [timeLimit, setTimeLimit] = useState(2000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", expectedOutput: "", isHidden: false },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addTestCase = () => {
    setTestCases((prev) => [...prev, { input: "", expectedOutput: "", isHidden: true }]);
  };

  const removeTestCase = (i: number) => {
    if (testCases.length <= 1) return;
    setTestCases((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateTestCase = (i: number, field: keyof TestCase, value: string | boolean) => {
    setTestCases((prev) => prev.map((tc, idx) => (idx === i ? { ...tc, [field]: value } : tc)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Title is required"); return; }
    if (!description.trim()) { setError("Description is required"); return; }
    if (testCases.some((tc) => !tc.input.trim() || !tc.expectedOutput.trim())) {
      setError("All test cases must have input and expected output");
      return;
    }

    setLoading(true);
    const res = await api.addDSA(Number(contestId), {
      title: title.trim(),
      description: description.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      points,
      timeLimit,
      memoryLimit,
      testCases,
    });
    setLoading(false);

    if (res.success) {
      toast.success("DSA problem added successfully");
      navigate(`/contests/${contestId}`);
    } else {
      setError(res.error || "Failed to add problem");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/contests/${contestId}`} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Contest
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Add DSA Problem</CardTitle>
          <CardDescription>Create a coding problem with test cases</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <Input placeholder="Two Sum" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Given an array of integers..."
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tags (comma-separated)</label>
              <Input placeholder="array, hash-table, two-pointers" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Points</label>
                <Input type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Time Limit (ms)</label>
                <Input type="number" min={500} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Memory (MB)</label>
                <Input type="number" min={32} value={memoryLimit} onChange={(e) => setMemoryLimit(Number(e.target.value))} />
              </div>
            </div>

            {/* Test Cases */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Test Cases</label>
                <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
                  <Plus className="mr-1 h-3 w-3" />Add Test Case
                </Button>
              </div>
              {testCases.map((tc, i) => (
                <Card key={i} className="bg-secondary/50">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Test Case #{i + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={tc.isHidden}
                            onChange={(e) => updateTestCase(i, "isHidden", e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-muted-foreground">Hidden</span>
                        </label>
                        {testCases.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeTestCase(i)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Input</label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(i, "input", e.target.value)}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="2\n4 9\n2 7 11 15"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Expected Output</label>
                        <textarea
                          value={tc.expectedOutput}
                          onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="0 1"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding…" : "Add DSA Problem"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
