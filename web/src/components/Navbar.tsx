import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut, Plus, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="text-gradient">CodeArena</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <LayoutDashboard className="mr-1 h-4 w-4" />
              Contests
            </Button>
          </Link>

          {user ? (
            <>
              {user.role === "creator" && (
                <Link to="/contests/create">
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    New Contest
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2 rounded-md border bg-secondary px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">{user.name}</span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {user.role}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
