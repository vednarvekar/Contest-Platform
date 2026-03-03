import { Navbar } from "@/components/Navbar";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
