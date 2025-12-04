import { Navigate } from 'react-router-dom';
import { useUserModules, AppModule } from '@/hooks/useModulePermissions';
import { Loader2 } from 'lucide-react';

const moduleRouteMap: Record<AppModule, string> = {
  dashboard: '/dashboard',
  dispensing: '/dispensing',
  pos: '/pos',
  debtors: '/debtors',
  patients: '/patients',
  doctors: '/doctors',
  stock: '/stock',
  orders: '/orders',
  reports: '/reports',
  management: '/management',
  medical_aid: '/patients', // Medical aid is a data permission, not a route
  settings: '/management', // Settings is a tab within Management
  edit_transactions: '/pos/transactions', // Edit transactions is a data permission
  help: '/help',
};

// Order of preference for default redirect
const preferredOrder: AppModule[] = [
  'dashboard',
  'dispensing',
  'pos',
  'patients',
  'doctors',
  'stock',
  'orders',
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
