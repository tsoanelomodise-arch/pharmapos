import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Today's prescriptions
      const { count: prescriptionsCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      // Today's sales total
      const { data: todaysSales } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      const salesToday = todaysSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      
      // Low stock items
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock_quantity', 'minimum_stock');
      
      // Outstanding debtors
      const { data: debtors } = await supabase
        .from('customers')
        .select('current_balance')
        .gt('current_balance', 0);
      
      const totalDebt = debtors?.reduce((sum, customer) => sum + customer.current_balance, 0) || 0;
      const debtorsCount = debtors?.length || 0;
      
      // Expiring products (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: expiringCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .not('expiry_date', 'is', null);
      
      return {
        prescriptionsToday: prescriptionsCount || 0,
        salesToday,
        lowStockItems: lowStockCount || 0,
        totalDebt,
        debtorsCount,
        expiringItems: expiringCount || 0
      };
    }
  });
}