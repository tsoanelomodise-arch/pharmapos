import { Navigate } from 'react-router-dom';
import { useUserModules, AppModule } from '@/hooks/useModulePermissions';
import { Loader2 } from 'lucide-react';

const moduleRouteMap: Record<AppModule, string> = {
  dashboard: '/dashboard',
  dispensing: '/dispensing',
  pos: '/pos',
  debtors: '/debtors',
  stock: '/stock',
  reports: '/reports',
  management: '/management',
  help: '/help',
  patients: '/management',
  doctors: '/management',
};

// Order of preference for default redirect
const preferredOrder: AppModule[] = [
  'dashboard',
  'dispensing',
  'pos',
  'stock',
  'debtors',
  'reports',
  'management',
  'help',
];

export function SmartRedirect() {
  const { data: userModules, isLoading } = useUserModules();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Find the first accessible module in preferred order
  const firstAccessible = preferredOrder.find(m => userModules?.includes(m));
  const redirectTo = firstAccessible ? moduleRouteMap[firstAccessible] : '/dashboard';

  return <Navigate to={redirectTo} replace />;
}
