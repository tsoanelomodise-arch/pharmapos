import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

interface DashboardStatsParams {
  startDate?: string;
  endDate?: string;
}

export function useDashboardStats(params?: DashboardStatsParams) {
  return useQuery({
    queryKey: ['dashboard-stats', params?.startDate, params?.endDate],
    queryFn: async () => {
      // Use provided dates or default to today
      const startDateTime = params?.startDate || startOfDay(new Date()).toISOString();
      const endDateTime = params?.endDate || endOfDay(new Date()).toISOString();
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      // Run all queries in parallel for faster loading
      const [
        prescriptionsResult,
        salesResult,
        lowStockResult,
        debtorsResult,
        expiringResult,
        weekSalesResult,
        topProductsResult,
        itemsSoldResult
      ] = await Promise.all([
        // Prescriptions count for selected period
        supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDateTime)
          .lte('created_at', endDateTime),
        
        // Sales total for selected period
        supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', startDateTime)
          .lte('created_at', endDateTime),
        
        // Low stock items with details - fetch all and filter client-side
        // since Supabase doesn't support column-to-column comparison directly
        supabase
          .from('products')
          .select('id, name, stock_quantity, minimum_stock')
          .order('stock_quantity', { ascending: true }),
        
        // Outstanding debtors
        supabase
          .from('customers_secure')
          .select('current_balance')
          .gt('current_balance', 0),
        
        // Expiring products count
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lt('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
          .not('expiry_date', 'is', null),
        
        // Last 7 days sales (single query instead of loop)
        supabase
          .from('sales')
          .select('total_amount, created_at')
          .gte('created_at', `${sevenDaysAgoStr}T00:00:00`),
        
        // Top selling products
        supabase
          .from('sale_items')
          .select('product_id, quantity, products(name)')
          .limit(5)
          .order('quantity', { ascending: false }),

        // Inventory items sold within selected date range
        supabase
          .from('sale_items')
          .select('quantity, products(name), sales!inner(created_at)')
          .gte('sales.created_at', startDateTime)
          .lte('sales.created_at', endDateTime)
      ]);

      // Process results
      const prescriptionsCount = prescriptionsResult.count || 0;
      const salesTotal = salesResult.data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      
      // Filter low stock products client-side (stock_quantity < minimum_stock)
      const lowStockProducts = (lowStockResult.data || [])
        .filter(product => product.stock_quantity < product.minimum_stock)
        .slice(0, 10);
      const lowStockCount = lowStockProducts.length;
      const totalDebt = debtorsResult.data?.reduce((sum, customer) => sum + customer.current_balance, 0) || 0;
      const debtorsCount = debtorsResult.data?.length || 0;
      const expiringCount = expiringResult.count || 0;
      
      // Process sales trend data
      const salesByDay = new Map<string, number>();
      weekSalesResult.data?.forEach(sale => {
        const date = new Date(sale.created_at).toISOString().split('T')[0];
        salesByDay.set(date, (salesByDay.get(date) || 0) + sale.total_amount);
      });
      
      const salesTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        salesTrend.push({
          date: date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
          amount: salesByDay.get(dateStr) || 0
        });
      }
      
      // Use sample data if no real sales data
      const hasSalesData = salesTrend.some(day => day.amount > 0);
      const finalSalesTrend = hasSalesData ? salesTrend : [
        { date: 'Jan 10', amount: 4500 },
        { date: 'Jan 11', amount: 5200 },
        { date: 'Jan 12', amount: 4800 },
        { date: 'Jan 13', amount: 6100 },
        { date: 'Jan 14', amount: 5500 },
        { date: 'Jan 15', amount: 7200 },
        { date: 'Jan 16', amount: 6800 }
      ];
      
      // Category data
      const categoryData = [
        { name: 'Prescription', value: 45, color: '#3BB3B0' },
        { name: 'OTC', value: 30, color: '#F9C74F' },
        { name: 'Supplements', value: 15, color: '#90BE6D' },
        { name: 'Personal Care', value: 10, color: '#F8961E' }
      ];
      
      // Top products
      const topProductsData = topProductsResult.data?.map(item => ({
        name: item.products?.name || 'Unknown',
        sales: item.quantity || 0
      })) || [
        { name: 'Panado 500mg', sales: 145 },
        { name: 'Allergex 10mg', sales: 98 },
        { name: 'Bioplus Vitamin C', sales: 87 },
        { name: 'Corenza C', sales: 76 },
        { name: 'Disprin', sales: 65 }
      ];

      // Aggregate inventory items sold by product
      const itemsSoldMap = new Map<string, number>();
      (itemsSoldResult.data as any[] | null)?.forEach((row) => {
        const name = row.products?.name || 'Unknown';
        itemsSoldMap.set(name, (itemsSoldMap.get(name) || 0) + (row.quantity || 0));
      });
      const inventoryItemsSold = Array.from(itemsSoldMap.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
      const totalItemsSold = inventoryItemsSold.reduce((s, i) => s + i.quantity, 0);

      return {
        prescriptionsCount,
        salesTotal,
        lowStockItems: lowStockCount,
        lowStockProducts,
        totalDebt,
        debtorsCount,
        expiringItems: expiringCount,
        salesTrend: finalSalesTrend,
        categoryData,
        topProducts: topProductsData,
        inventoryItemsSold,
        totalItemsSold,
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}