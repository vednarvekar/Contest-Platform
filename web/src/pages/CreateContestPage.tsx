import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { z } from "zod";
import { Link } from "react-router-dom";

const contestSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(2000),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

export default function CreateContestPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = contestSchema.safeParse({ title, description, startTime, endTime });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    const res = await api.createContest({
      title: parsed.data.title,
      description: parsed.data.description,
      startTime: new Date(parsed.data.startTime).toISOString(),
      endTime: new Date(parsed.data.endTime).toISOString(),
    });
    setLoading(false);

    if (res.success && res.data) {
      navigate(`/contests/${res.data.id}`);
    } else {
      setError(res.error === "FORBIDDEN" ? "Only creators can create contests" : res.error || "Failed to create contest");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>
      <Card className="glow-primary">
        <CardHeader>
          <CardTitle className="text-2xl">Create Contest</CardTitle>
          <CardDescription>Set up a new programming contest with MCQs and DSA problems</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <Input placeholder="Weekly Challenge #13" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                placeholder="Describe the contest…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">End Time</label>
                <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create Contest"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
