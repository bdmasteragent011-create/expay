import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import Deposit from "./pages/Deposit";
import PayInRequests from "./pages/PayInRequests";
import PayOutRequests from "./pages/PayOutRequests";
import AdminLoginZrx from "./pages/admin/AdminLoginZrx";
import AdminDashboardNew from "./pages/admin/AdminDashboardNew";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCreateUser from "./pages/admin/AdminCreateUser";
import AdminEditUser from "./pages/admin/AdminEditUser";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminManageAdmins from "./pages/admin/AdminManageAdmins";
import AdminDeposits from "./pages/admin/AdminDeposits";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// User pages where BottomNav should appear
const userPages = ['/dashboard', '/account', '/deposit', '/pay-in-requests', '/pay-out-requests'];

const AppContent = () => {
  const location = useLocation();
  const showBottomNav = userPages.includes(location.pathname);

  return (
    <>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account" element={<Account />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/pay-in-requests" element={<PayInRequests />} />
        <Route path="/pay-out-requests" element={<PayOutRequests />} />
        
        {/* Admin Routes - Only accessible via /admin/login/zrx */}
        <Route path="/admin/login/zrx" element={<AdminLoginZrx />} />
        <Route path="/admin/dashboard" element={<AdminDashboardNew />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/create" element={<AdminCreateUser />} />
        <Route path="/admin/users/:id" element={<AdminEditUser />} />
        <Route path="/admin/deposits" element={<AdminDeposits />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/manage-admins" element={<AdminManageAdmins />} />
        
        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
