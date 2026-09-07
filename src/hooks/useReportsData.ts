import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, endOfDay, format } from 'date-fns';

export interface ReportsSummary {
  dailyRevenue: number;
  dailyRevenueChange: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  dailyCost: number;
  dailyGrossProfit: number;
  dailyProfitMargin: number;
  prescriptionsToday: number;
  prescriptionsChange: number;
  activePatients: number;
  newPatientsThisMonth: number;
  totalProducts: number;
  lowStockItems: number;
  expiringSoonItems: number;
  outOfStockItems: number;
  stockValue: number;
  costOfGoods: number;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface SalesByCategory {
  category: string;
  count: number;
  percentage: number;
}

export interface ReportsSummaryParams {
  startDate?: string;
  endDate?: string;
}

export function useReportsSummary(params?: ReportsSummaryParams) {
  return useQuery({
    queryKey: ['reports-summary', params?.startDate, params?.endDate],
    queryFn: async (): Promise<ReportsSummary> => {
      const now = new Date();
      
      // Use provided dates or default to today
      const periodStart = params?.startDate || startOfDay(now).toISOString();
      const periodEnd = params?.endDate || endOfDay(now).toISOString();
      
      // Calculate previous period for comparison (same duration before start date)
      const startDateObj = new Date(periodStart);
      const endDateObj = new Date(periodEnd);
      const periodDuration = endDateObj.getTime() - startDateObj.getTime();
      const previousPeriodStart = new Date(startDateObj.getTime() - periodDuration).toISOString();
      const previousPeriodEnd = periodStart;
      
      const weekStart = startOfWeek(now).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const yearStart = startOfYear(now).toISOString();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch all required data in parallel (paged so no 1000-row cap applies)
      const [
        periodSales,
        previousPeriodSales,
        weekSales,
        monthSales,
        yearSales,
        periodPrescriptions,
        previousPeriodPrescriptions,
        allCustomers,
        newCustomers,
        productList,
        saleItemsList
      ] = await Promise.all([
        // Period sales
        fetchAllRows<{ total_amount: number }>((from, to) => supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .eq('payment_status', 'completed')
          .range(from, to)),
        // Previous period sales
        fetchAllRows<{ total_amount: number }>((from, to) => supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', previousPeriodStart)
          .lt('created_at', previousPeriodEnd)
          .eq('payment_status', 'completed')
          .range(from, to)),
        // Week sales
        fetchAllRows<{ total_amount: number }>((from, to) => supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', weekStart)
          .eq('payment_status', 'completed')
          .range(from, to)),
        // Month sales
        fetchAllRows<{ total_amount: number }>((from, to) => supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', monthStart)
          .eq('payment_status', 'completed')
          .range(from, to)),
        // Year sales
        fetchAllRows<{ total_amount: number }>((from, to) => supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', yearStart)
          .eq('payment_status', 'completed')
          .range(from, to)),
        // Period prescriptions (count only)
        supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd),
        // Previous period prescriptions (count only)
        supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', previousPeriodStart)
          .lt('created_at', previousPeriodEnd),
        // All customers (count only)
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true }),
        // New customers this month (count only)
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart),
        // Products
        fetchAllRows<any>((from, to) => supabase
          .from('products')
          .select('id, stock_quantity, minimum_stock, cost_price, unit_price, expiry_date')
          .range(from, to)),
        // Sale items for cost calculation
        fetchAllRows<any>((from, to) => supabase
          .from('sale_items')
          .select('quantity, product_id, total_price, unit_price')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .range(from, to))
      ]);

      // Calculate revenues
      const dailyRevenue = periodSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const previousRevenue = previousPeriodSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const dailyRevenueChange = previousRevenue > 0 
        ? ((dailyRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;
      const weeklyRevenue = weekSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const monthlyRevenue = monthSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const yearlyRevenue = yearSales.reduce((sum, s) => sum + Number(s.total_amount), 0);

      // Prescriptions
      const prescriptionsToday = periodPrescriptions.count || 0;
      const prescriptionsYesterday = previousPeriodPrescriptions.count || 0;
      const prescriptionsChange = prescriptionsYesterday > 0
        ? ((prescriptionsToday - prescriptionsYesterday) / prescriptionsYesterday) * 100
        : 0;

      // Customers
      const activePatients = allCustomers.count || 0;
      const newPatientsThisMonth = newCustomers.count || 0;


      // Products and stock
      const totalProducts = productList.length;
      const lowStockItems = productList.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.minimum_stock).length;
      const outOfStockItems = productList.filter(p => p.stock_quantity === 0).length;
      const expiringSoonItems = productList.filter(p => 
        p.expiry_date && p.expiry_date <= thirtyDaysFromNow
      ).length;
      const stockValue = productList.reduce((sum, p) => sum + (p.stock_quantity * Number(p.cost_price)), 0);

      // Cost calculations - estimate based on sale items
      let costOfGoods = 0;

      
      // Create a map of product costs
      const productCostMap = new Map(productList.map(p => [p.id, Number(p.cost_price)]));
      
      saleItemsList.forEach(item => {
        const costPrice = productCostMap.get(item.product_id) || 0;
        costOfGoods += item.quantity * costPrice;
      });

      const dailyGrossProfit = dailyRevenue - costOfGoods;
      const dailyProfitMargin = dailyRevenue > 0 ? (dailyGrossProfit / dailyRevenue) * 100 : 0;

      return {
        dailyRevenue,
        dailyRevenueChange,
        weeklyRevenue,
        monthlyRevenue,
        yearlyRevenue,
        dailyCost: costOfGoods,
        dailyGrossProfit,
        dailyProfitMargin,
        prescriptionsToday,
        prescriptionsChange,
        activePatients,
        newPatientsThisMonth,
        totalProducts,
        lowStockItems,
        expiringSoonItems,
        outOfStockItems,
        stockValue,
        costOfGoods
      };
    },
    staleTime: 60000, // 1 minute
  });
}

export interface TopSellingProductsParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function useTopSellingProducts(params?: TopSellingProductsParams) {
  const limit = params?.limit ?? 5;
  
  return useQuery({
    queryKey: ['top-selling-products', params?.startDate, params?.endDate, limit],
    queryFn: async (): Promise<TopSellingProduct[]> => {
      const now = new Date();
      const periodStart = params?.startDate || startOfMonth(now).toISOString();
      const periodEnd = params?.endDate || endOfDay(now).toISOString();

      // Get all sale items for the period
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('product_id, quantity, total_price')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (saleItemsError) throw saleItemsError;

      // Aggregate by product
      const productStats = new Map<string, { unitsSold: number; revenue: number }>();
      
      saleItems?.forEach(item => {
        const existing = productStats.get(item.product_id) || { unitsSold: 0, revenue: 0 };
        productStats.set(item.product_id, {
          unitsSold: existing.unitsSold + item.quantity,
          revenue: existing.revenue + Number(item.total_price)
        });
      });

      // Get product names
      const productIds = Array.from(productStats.keys());
      if (productIds.length === 0) return [];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Combine and sort
      const result = products?.map(p => ({
        id: p.id,
        name: p.name,
        ...(productStats.get(p.id) || { unitsSold: 0, revenue: 0 })
      })) || [];

      return result
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    },
    staleTime: 60000,
  });
}

export interface SalesByCategoryParams {
  startDate?: string;
  endDate?: string;
}

export function useSalesByCategory(params?: SalesByCategoryParams) {
  return useQuery({
    queryKey: ['sales-by-category', params?.startDate, params?.endDate],
    queryFn: async (): Promise<SalesByCategory[]> => {
      const now = new Date();
      const periodStart = params?.startDate || startOfMonth(now).toISOString();
      const periodEnd = params?.endDate || endOfDay(now).toISOString();

      // Get all sale items with product info
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (saleItemsError) throw saleItemsError;

      const productIds = [...new Set(saleItems?.map(s => s.product_id) || [])];
      if (productIds.length === 0) return [];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, category')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Create product category map
      const productCategoryMap = new Map(products?.map(p => [p.id, p.category]) || []);

      // Aggregate by category
      const categoryStats = new Map<string, number>();
      let total = 0;

      saleItems?.forEach(item => {
        const category = productCategoryMap.get(item.product_id) || 'other';
        const existing = categoryStats.get(category) || 0;
        categoryStats.set(category, existing + item.quantity);
        total += item.quantity;
      });

      const categoryLabels: Record<string, string> = {
        prescription: 'Prescription',
        otc: 'OTC',
        supplement: 'Supplements',
        medical_device: 'Medical Devices',
        cosmetic: 'Cosmetics'
      };

      return Array.from(categoryStats.entries())
        .map(([category, count]) => ({
          category: categoryLabels[category] || category,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage);
    },
    staleTime: 60000,
  });
}

export function useStockMovementStats() {
  return useQuery({
    queryKey: ['stock-movement-stats'],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();

      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select('movement_type, quantity')
        .gte('created_at', todayStart);

      if (error) throw error;

      const stats = {
        received: 0,
        dispensed: 0,
        adjustments: 0
      };

      movements?.forEach(m => {
        if (m.movement_type === 'sale') {
          stats.dispensed += Math.abs(m.quantity);
        } else if (m.movement_type === 'adjustment') {
          stats.adjustments += 1;
        } else if (m.movement_type === 'return') {
          stats.received += Math.abs(m.quantity);
        }
      });

      return stats;
    },
    staleTime: 60000,
  });
}

export interface DispensingStatsParams {
  startDate?: string;
  endDate?: string;
}

export function useDispensingStats(params?: DispensingStatsParams) {
  return useQuery({
    queryKey: ['dispensing-stats', params?.startDate, params?.endDate],
    queryFn: async () => {
      const now = new Date();
      const periodStart = params?.startDate || startOfDay(now).toISOString();
      const periodEnd = params?.endDate || endOfDay(now).toISOString();

      const [periodPrescriptions, medicalAidClaims, chronicPatients] = await Promise.all([
        supabase
          .from('prescriptions')
          .select('id')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd),
        supabase
          .from('sales')
          .select('id')
          .eq('payment_method', 'insurance')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd),
        supabase
          .from('prescriptions')
          .select('customer_id')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
      ]);

      // Count unique chronic patients (patients with multiple prescriptions)
      const patientPrescriptionCount = new Map<string, number>();
      chronicPatients.data?.forEach(p => {
        const count = patientPrescriptionCount.get(p.customer_id) || 0;
        patientPrescriptionCount.set(p.customer_id, count + 1);
      });
      const chronicPatientCount = Array.from(patientPrescriptionCount.values())
        .filter(count => count >= 2).length;

      return {
        prescriptionsInPeriod: periodPrescriptions.data?.length || 0,
        chronicPatients: chronicPatientCount,
        medicalAidClaims: medicalAidClaims.data?.length || 0
      };
    },
    staleTime: 60000,
  });
}
