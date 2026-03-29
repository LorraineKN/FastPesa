import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import MpesaPage from "./pages/MpesaPage";
import Transactions from "./pages/Transactions";
import SettingsPage from "./pages/SettingsPage";
import InboxPage from "./pages/InboxPage";
import DepositPage from "./pages/DepositPage";
import WithdrawPage from "./pages/WithdrawPage";
import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import { DebugClearSession } from "./components/DebugClearSession";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DebugClearSession />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/transfer" element={<ProtectedRoute><DashboardLayout><Transfer /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/deposit" element={<ProtectedRoute><DashboardLayout><DepositPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/withdraw" element={<ProtectedRoute><DashboardLayout><WithdrawPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/mpesa" element={<ProtectedRoute><DashboardLayout><MpesaPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/transactions" element={<ProtectedRoute><DashboardLayout><Transactions /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/inbox" element={<ProtectedRoute><DashboardLayout><InboxPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
