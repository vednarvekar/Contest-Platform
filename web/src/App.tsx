import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import CreateContestPage from "./pages/CreateContestPage";
import ContestDetailPage from "./pages/ContestDetailPage";
import ProblemViewPage from "./pages/ProblemViewPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AddMCQPage from "./pages/AddMCQPage";
import AddDSAPage from "./pages/AddDSAPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Public browsing routes with layout */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/contests/:contestId" element={<ContestDetailPage />} />
              <Route path="/contests/:contestId/leaderboard" element={<LeaderboardPage />} />
              <Route path="/problems/:problemId" element={<ProblemViewPage />} />
            </Route>

            {/* Protected creator-only routes with layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/contests/create" element={<ProtectedRoute roles={["creator"]}><CreateContestPage /></ProtectedRoute>} />
              <Route path="/contests/:contestId/add-mcq" element={<ProtectedRoute roles={["creator"]}><AddMCQPage /></ProtectedRoute>} />
              <Route path="/contests/:contestId/add-dsa" element={<ProtectedRoute roles={["creator"]}><AddDSAPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
