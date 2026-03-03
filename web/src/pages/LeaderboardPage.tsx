import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Medal } from "lucide-react";

const MOCK_LEADERBOARD = [
  { userId: 2, name: "Simran", totalPoints: 250, rank: 1 },
  { userId: 3, name: "Anmo", totalPoints: 180, rank: 2 },
  { userId: 4, name: "Rahul Gujjar", totalPoints: 180, rank: 2 },
  { userId: 5, name: "Priya", totalPoints: 150, rank: 4 },
  { userId: 6, name: "Karan", totalPoints: 120, rank: 5 },
  { userId: 7, name: "Neha", totalPoints: 90, rank: 6 },
];

function getRankBadge(rank: number) {
  if (rank === 1) return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning text-warning-foreground"><Trophy className="h-4 w-4" /></div>;
  if (rank === 2) return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"><Medal className="h-4 w-4" /></div>;
  if (rank === 3) return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/30 text-warning"><Medal className="h-4 w-4" /></div>;
  return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground font-mono text-sm font-bold">{rank}</div>;
}

export default function LeaderboardPage() {
  const { contestId } = useParams();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={`/contests/${contestId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Contest
      </Link>

      <Card className="glow-accent">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <span className="text-gradient">Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-[48px_1fr_100px] gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Rank</span>
            <span>Name</span>
            <span className="text-right">Points</span>
          </div>
          {MOCK_LEADERBOARD.map((entry, idx) => (
            <div
              key={entry.userId}
              className={`grid grid-cols-[48px_1fr_100px] items-center gap-4 rounded-lg px-4 py-3 transition-colors ${
                idx === 0 ? "bg-warning/5 border border-warning/20" : "hover:bg-secondary"
              }`}
            >
              {getRankBadge(entry.rank)}
              <div>
                <p className="font-medium">{entry.name}</p>
              </div>
              <p className="text-right font-mono font-bold text-primary">{entry.totalPoints}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
