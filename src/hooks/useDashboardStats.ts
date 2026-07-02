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
        
        // Top selling products (aggregated below)
        supabase
          .from('sale_items')
          .select('product_id, quantity, products(name, category), sales!inner(created_at)')
          .gte('sales.created_at', startDateTime)
          .lte('sales.created_at', endDateTime),

        // Inventory items sold within selected date range
        supabase
          .from('sale_items')
          .select('quantity, unit_price, total_price, products(name), sales!inner(created_at)')
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
      
      const finalSalesTrend = salesTrend;

      // Aggregate top products by product_id (sum quantities across sale_items)
      const topAggMap = new Map<string, { name: string; sales: number }>();
      const categoryQtyMap = new Map<string, number>();
      (topProductsResult.data as any[] | null)?.forEach((row) => {
        const name = row.products?.name || 'Unknown';
        const qty = row.quantity || 0;
        const key = row.product_id || name;
        const existing = topAggMap.get(key);
        if (existing) existing.sales += qty;
        else topAggMap.set(key, { name, sales: qty });
        const category = row.products?.category || 'Uncategorized';
        categoryQtyMap.set(category, (categoryQtyMap.get(category) || 0) + qty);
      });
      const topProductsData = Array.from(topAggMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Real category breakdown as percentages
      const categoryPalette = ['#3BB3B0', '#F9C74F', '#90BE6D', '#F8961E', '#577590', '#F94144', '#43AA8B', '#9D4EDD'];
      const totalCategoryQty = Array.from(categoryQtyMap.values()).reduce((s, v) => s + v, 0);
      const categoryData = totalCategoryQty > 0
        ? Array.from(categoryQtyMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, qty], idx) => ({
              name,
              value: Math.round((qty / totalCategoryQty) * 100),
              color: categoryPalette[idx % categoryPalette.length],
            }))
        : [];

      // Aggregate inventory items sold by product
      const itemsSoldMap = new Map<string, number>();
      const itemsAmountMap = new Map<string, number>();
      (itemsSoldResult.data as any[] | null)?.forEach((row) => {
        const name = row.products?.name || 'Unknown';
        const qty = row.quantity || 0;
        const amount = Number(row.total_price) || (Number(row.unit_price) * qty) || 0;
        itemsSoldMap.set(name, (itemsSoldMap.get(name) || 0) + qty);
        itemsAmountMap.set(name, (itemsAmountMap.get(name) || 0) + amount);
      });
      const inventoryItemsSold = Array.from(itemsSoldMap.entries())
        .map(([name, quantity]) => ({
          name,
          quantity,
          amount: itemsAmountMap.get(name) || 0,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
      const totalItemsSold = inventoryItemsSold.reduce((s, i) => s + i.quantity, 0);
      const totalItemsAmount = inventoryItemsSold.reduce((s, i) => s + i.amount, 0);

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
        totalItemsAmount,
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}