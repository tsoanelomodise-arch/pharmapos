import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PackagePlus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

type DateFilter = "today" | "7days" | "30days" | "all";

export function RestockHistoryLog() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("30days");

  const { data: restockHistory = [], isLoading } = useQuery({
    queryKey: ["restock-history", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select(`id, product_id, quantity, notes, created_at, products(name)`)
        .like("notes", "Restock:%")
        .order("created_at", { ascending: false });

      const now = new Date();
      if (dateFilter === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        query = query.gte("created_at", start.toISOString());
      } else if (dateFilter === "7days") {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        query = query.gte("created_at", start.toISOString());
      } else if (dateFilter === "30days") {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        query = query.gte("created_at", start.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        productName: item.products?.name || "Unknown Product",
        quantity: item.quantity,
        notes: item.notes,
        createdAt: item.created_at,
      }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            Restock History ({restockHistory.length})
          </CardTitle>
          <div className="flex gap-1">
            {(["today", "7days", "30days", "all"] as DateFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={dateFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(filter)}
              >
                {filter === "today" ? "Today" : filter === "7days" ? "7 Days" : filter === "30days" ? "30 Days" : "All"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : restockHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PackagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No restock events found</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="hidden md:grid md:grid-cols-4 gap-4 p-3 border-b font-medium text-sm text-muted-foreground">
              <div>Date/Time</div>
              <div>Product</div>
              <div>Quantity</div>
              <div>Notes</div>
            </div>
            {restockHistory.map((entry) => (
              <div key={entry.id} className="flex flex-col md:grid md:grid-cols-4 gap-2 md:gap-4 p-3 border rounded-lg">
                <div className="text-sm">
                  <span className="md:hidden text-muted-foreground mr-2">Date:</span>
                  {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm")}
                </div>
                <div className="text-sm font-medium">
                  <span className="md:hidden text-muted-foreground mr-2">Product:</span>
                  {entry.productName}
                </div>
                <div>
                  <span className="md:hidden text-muted-foreground mr-2">Qty:</span>
                  <Badge variant="secondary">+{entry.quantity}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="md:hidden text-muted-foreground mr-2">Notes:</span>
                  {entry.notes}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
