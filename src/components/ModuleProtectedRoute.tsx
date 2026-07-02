import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserModules, AppModule } from '@/hooks/useModulePermissions';
import { Loader2 } from 'lucide-react';

interface ModuleProtectedRouteProps {
  children: ReactNode;
  module: AppModule;
}

export function ModuleProtectedRoute({ children, module }: ModuleProtectedRouteProps) {
  const { data: userModules, isLoading } = useUserModules();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have access to this module, redirect to a route they DO own.
  // Only include modules whose route is guarded by that same module — otherwise
  // redirecting to a sub-permission (settings, medical_aid, etc.) causes an
  // infinite loop because the destination route requires the parent module.
  if (!userModules?.includes(module)) {
    const primaryRouteMap: Partial<Record<AppModule, string>> = {
      dashboard: '/dashboard',
      dispensing: '/dispensing',
      pos: '/pos',
      transactions: '/pos/transactions',
      debtors: '/debtors',
      patients: '/patients',
      doctors: '/doctors',
      stock: '/stock',
      orders: '/orders',
      reports: '/reports',
      stock_movement: '/reports/stock-movement',
      audit_trail: '/reports/audit-trail',
      management: '/management',
      help: '/help',
      system_updates: '/help/updates',
      database_status: '/help/database',
    };

    const firstAccessible = userModules?.find(m => primaryRouteMap[m]);
    if (!firstAccessible) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">No accessible pages</h2>
            <p className="text-muted-foreground">
              Your account does not have access to any pages yet. Please contact an
              administrator to grant module permissions.
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to={primaryRouteMap[firstAccessible]!} replace />;
  }

  return <>{children}</>;
}
