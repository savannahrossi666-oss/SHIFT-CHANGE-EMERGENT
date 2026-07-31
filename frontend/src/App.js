import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import useLenis from "@/hooks/useLenis";

import Nav from "@/components/site/Nav";
import Hero from "@/components/site/Hero";
import Problem from "@/components/site/Problem";
import Shift from "@/components/site/Shift";
import SplitCards from "@/components/site/SplitCards";
import Mission from "@/components/site/Mission";
import Transformation from "@/components/site/Transformation";
import Closing from "@/components/site/Closing";
import Footer from "@/components/site/Footer";

import { Login, Signup, AuthCallback } from "@/app/AuthPages";
import { Dashboard } from "@/app/Dashboard";
import { Profile, UserProfileView } from "@/app/Profile";
import { ShiftsList, CreateShift, ShiftDetail } from "@/app/Shifts";
import { WorkspacesList, Workspace } from "@/app/Workspace";
import { WorkspacePreview } from "@/app/WorkspacePreview";
import { Notifications, WalletPage } from "@/app/MiscPages";

const Home = () => {
  useLenis();
  return (
    <main data-testid="home-page" className="relative text-[#f7f8f8] overflow-x-hidden">
      <Nav />
      <Hero />
      <Problem />
      <Shift />
      <SplitCards />
      <Mission />
      <Transformation />
      <Closing />
      <Footer />
    </main>
  );
};

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/preview/workspace" element={<WorkspacePreview />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/u/:userId" element={<UserProfileView />} />
      <Route path="/shifts" element={<ShiftsList />} />
      <Route path="/shifts/mine" element={<ShiftsList mine />} />
      <Route path="/shifts/new" element={<CreateShift />} />
      <Route path="/shifts/:shiftId" element={<ShiftDetail />} />
      <Route path="/workspaces" element={<WorkspacesList />} />
      <Route path="/workspace/:workspaceId" element={<Workspace />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/wallet" element={<WalletPage />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <video className="site-video-background" autoPlay loop muted playsInline preload="auto" aria-hidden="true">
        <source src="/webpage.mp4" type="video/mp4" />
      </video>
      <div className="site-video-grade" aria-hidden="true" />
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
