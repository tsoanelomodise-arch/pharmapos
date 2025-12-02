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

  // If user doesn't have access to this module, redirect to dashboard or first available module
  if (!userModules?.includes(module)) {
    // Find first accessible module to redirect to
    const moduleRouteMap: Record<AppModule, string> = {
      dashboard: '/dashboard',
      dispensing: '/dispensing',
      pos: '/pos',
      debtors: '/debtors',
      stock: '/stock',
      orders: '/orders',
      reports: '/reports',
      management: '/management',
      help: '/help',
      patients: '/management',
      doctors: '/management',
    };

    const firstAccessible = userModules?.find(m => moduleRouteMap[m]);
    const redirectTo = firstAccessible ? moduleRouteMap[firstAccessible] : '/dashboard';
    
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
