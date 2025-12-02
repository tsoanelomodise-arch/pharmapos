import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleProtectedRoute } from "@/components/ModuleProtectedRoute";
import { SmartRedirect } from "@/components/SmartRedirect";
import { Layout } from "@/components/Layout";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all page components for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Dispensing = lazy(() => import("./pages/Dispensing"));
const POS = lazy(() => import("./pages/POS"));
const Debtors = lazy(() => import("./pages/Debtors"));
const Patients = lazy(() => import("./pages/Patients"));
const Doctors = lazy(() => import("./pages/Doctors"));
const Stock = lazy(() => import("./pages/Stock"));
const Orders = lazy(() => import("./pages/Orders"));
const Reports = lazy(() => import("./pages/Reports"));
const Management = lazy(() => import("./pages/Management"));
const Help = lazy(() => import("./pages/Help"));
const SystemUpdates = lazy(() => import("./pages/SystemUpdates"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex flex-col gap-4 p-6">
    <Skeleton className="h-12 w-[250px]" />
    <Skeleton className="h-[400px] w-full" />
  </div>
);

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<SmartRedirect />} />
                        <Route path="/dashboard" element={
                          <ModuleProtectedRoute module="dashboard">
                            <Dashboard />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/dispensing" element={
                          <ModuleProtectedRoute module="dispensing">
                            <Dispensing />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/pos" element={
                          <ModuleProtectedRoute module="pos">
                            <POS />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/debtors" element={
                          <ModuleProtectedRoute module="debtors">
                            <Debtors />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/patients" element={
                          <ModuleProtectedRoute module="patients">
                            <Patients />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/doctors" element={
                          <ModuleProtectedRoute module="doctors">
                            <Doctors />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/stock" element={
                          <ModuleProtectedRoute module="stock">
                            <Stock />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/orders" element={
                          <ModuleProtectedRoute module="orders">
                            <Orders />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/reports" element={
                          <ModuleProtectedRoute module="reports">
                            <Reports />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/management" element={
                          <ModuleProtectedRoute module="management">
                            <Management />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/help" element={
                          <ModuleProtectedRoute module="help">
                            <Help />
                          </ModuleProtectedRoute>
                        } />
                        <Route path="/help/updates" element={
                          <ModuleProtectedRoute module="help">
                            <SystemUpdates />
                          </ModuleProtectedRoute>
                        } />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
