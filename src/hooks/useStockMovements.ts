import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: "sale" | "return" | "adjustment";
  notes: string | null;
  reference_id: string | null;
  created_at: string;
  product_name: string;
}

interface StockMovementSummary {
  sales: number;
  returns: number;
  adjustments: number;
  totalMovements: number;
}

interface UseStockMovementsParams {
  startDate?: Date;
  endDate?: Date;
}

export function useStockMovements({ startDate, endDate }: UseStockMovementsParams = {}) {
  return useQuery({
    queryKey: ["stock-movements", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select(`
          id,
          product_id,
          quantity,
          movement_type,
          notes,
          reference_id,
          created_at,
          products(name)
        `)
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startOfDay(startDate).toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endOfDay(endDate).toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const movements: StockMovement[] = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        movement_type: item.movement_type,
        notes: item.notes,
        reference_id: item.reference_id,
        created_at: item.created_at,
        product_name: item.products?.name || "Unknown Product",
      }));

      // Calculate summary
      const summary: StockMovementSummary = {
        sales: movements.filter(m => m.movement_type === "sale").reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        returns: movements.filter(m => m.movement_type === "return").reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        adjustments: movements.filter(m => m.movement_type === "adjustment").reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        totalMovements: movements.length,
      };

      return { movements, summary };
    },
  });
}
