import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trophy, Plus, Clock, Search, Users, Code2, FileQuestion } from "lucide-react";
import { useState } from "react";

// Mock data for UI demonstration
const MOCK_CONTESTS = [
  { id: 1, title: "Weekly Challenge #12", description: "Arrays & Strings", startTime: "2026-03-05T10:00:00Z", endTime: "2026-03-05T12:00:00Z", creatorId: 1, mcqCount: 5, dsaCount: 3 },
  { id: 2, title: "DSA Sprint - Graphs", description: "Graph traversal and shortest paths", startTime: "2026-03-01T08:00:00Z", endTime: "2026-03-01T11:00:00Z", creatorId: 1, mcqCount: 10, dsaCount: 2 },
  { id: 3, title: "Beginner Warm-up", description: "Basic MCQs and easy problems", startTime: "2026-02-28T14:00:00Z", endTime: "2026-02-28T16:00:00Z", creatorId: 2, mcqCount: 15, dsaCount: 1 },
];

function getContestStatus(start: string, end: string) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now < s) return { label: "Upcoming", variant: "secondary" as const };
  if (now >= s && now <= e) return { label: "Live", variant: "default" as const };
  return { label: "Ended", variant: "outline" as const };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = MOCK_CONTESTS.filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {user?.role === "creator" ? "My Contests" : "Available Contests"}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "creator"
              ? "Manage and create programming contests"
              : "Browse and join programming contests"}
          </p>
        </div>
        {user?.role === "creator" && (
          <Link to="/contests/create">
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              New Contest
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{MOCK_CONTESTS.length}</p>
              <p className="text-sm text-muted-foreground">Total Contests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {MOCK_CONTESTS.filter((c) => getContestStatus(c.startTime, c.endTime).label === "Live").length}
              </p>
              <p className="text-sm text-muted-foreground">Live Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {MOCK_CONTESTS.filter((c) => getContestStatus(c.startTime, c.endTime).label === "Upcoming").length}
              </p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login prompt for guests */}
      {!user && (
        <Card className="border-primary/30">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Sign in</span> to participate in contests and submit solutions
            </p>
            <div className="flex gap-2">
              <Link to="/login"><Button size="sm" variant="outline">Sign In</Button></Link>
              <Link to="/signup"><Button size="sm">Sign Up</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contests…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Contest List */}
      <div className="grid gap-4">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Trophy className="mb-3 h-10 w-10 opacity-30" />
              <p>No contests found</p>
            </CardContent>
          </Card>
        )}
        {filtered.map((contest) => {
          const status = getContestStatus(contest.startTime, contest.endTime);
          return (
            <Link key={contest.id} to={`/contests/${contest.id}`}>
              <Card className="transition-all hover:border-primary/30 hover:glow-primary">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{contest.title}</h3>
                      <Badge
                        variant={status.variant}
                        className={status.label === "Live" ? "animate-pulse-glow bg-primary text-primary-foreground" : ""}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{contest.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(contest.startTime)} – {formatDate(contest.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileQuestion className="h-3 w-3" />
                        {contest.mcqCount} MCQs
                      </span>
                      <span className="flex items-center gap-1">
                        <Code2 className="h-3 w-3" />
                        {contest.dsaCount} Problems
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
