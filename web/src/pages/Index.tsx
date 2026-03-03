import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Code2, Users, Zap, ArrowRight, FileQuestion, Shield, Timer } from "lucide-react";

export default function IndexPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-gradient">CodeArena</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">
                  Dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container flex flex-col items-center justify-center gap-6 py-20 text-center md:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Competitive programming, reimagined
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
          Compete. Create. <span className="text-gradient">Conquer.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          CodeArena is the platform where creators build programming contests with MCQs & DSA problems,
          and contestants compete in real-time for the top of the leaderboard.
        </p>
        <div className="flex gap-3">
          <Link to="/dashboard">
            <Button size="lg">
              Browse Contests <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          {!user && (
            <Link to="/signup">
              <Button variant="outline" size="lg">Create an Account</Button>
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Everything you need</h2>
          <p className="mt-2 text-muted-foreground">For both contest creators and competitive programmers</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FileQuestion, title: "MCQ Challenges", desc: "Multiple choice questions with instant scoring and feedback" },
            { icon: Code2, title: "DSA Problems", desc: "Write and submit code solutions judged against hidden test cases" },
            { icon: Users, title: "Live Leaderboards", desc: "Real-time rankings with fair scoring — same points, same rank" },
            { icon: Timer, title: "Timed Contests", desc: "Start and end times keep things competitive and focused" },
            { icon: Shield, title: "Role-based Access", desc: "Creators design contests, contestees compete — clean separation" },
            { icon: Trophy, title: "Ranking System", desc: "Best DSA submission + MCQ scores combined for final rankings" },
          ].map((f) => (
            <Card key={f.title} className="transition-all hover:border-primary/30">
              <CardContent className="p-6">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2.5">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-secondary/50">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="text-2xl font-bold">Ready to start?</h2>
          <p className="text-muted-foreground">Browse contests without an account, or sign up to compete and create.</p>
          <div className="flex gap-3">
            <Link to="/dashboard">
              <Button>View Contests</Button>
            </Link>
            {!user && (
              <Link to="/signup">
                <Button variant="outline">Sign Up Free</Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
