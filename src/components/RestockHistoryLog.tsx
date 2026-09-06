import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PackagePlus, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

type DateFilter = "today" | "7days" | "30days" | "all";

interface RestockRecord {
  id: string;
  supplier_name: string | null;
  invoice_number: string | null;
  delivery_note_number: string | null;
  invoice_file_path: string | null;
  delivery_note_file_path: string | null;
  notes: string | null;
  created_at: string;
  stock_movements: {
    quantity: number;
    product_id: string;
    products: { name: string } | null;
  }[];
}

export function RestockHistoryLog() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("30days");

  const { data: restockHistory = [], isLoading } = useQuery({
    queryKey: ["restock-records", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("restock_records")
        .select(`
          id,
          supplier_name,
          invoice_number,
          delivery_note_number,
          invoice_file_path,
          delivery_note_file_path,
          notes,
          created_at,
          stock_movements (
            quantity,
            product_id,
            products (name)
          )
        `)
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

      return (data || []) as unknown as RestockRecord[];
    },
  });

  const handleDownload = async (path: string | null, label: string) => {
    if (!path) return;
    const { data, error } = await supabase.storage
      .from("restock-documents")
      .createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) {
      toast({
        title: "Download failed",
        description: error?.message || "Could not generate document link.",
        variant: "destructive",
      });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = label;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

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
          <div className="space-y-4">
            {restockHistory.map((entry) => {
              const totalQty = entry.stock_movements.reduce((sum, m) => sum + (m.quantity || 0), 0);
              return (
                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(entry.created_at), "dd MMM yyyy, HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.supplier_name ? `Supplier: ${entry.supplier_name}` : "No supplier selected"}
                      </p>
                    </div>
                    <Badge variant="secondary">+{totalQty} units</Badge>
                  </div>

                  {(entry.invoice_number || entry.delivery_note_number || entry.invoice_file_path || entry.delivery_note_file_path) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm bg-muted/30 rounded-md p-3">
                      {entry.invoice_number && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>Invoice: {entry.invoice_number}</span>
                        </div>
                      )}
                      {entry.delivery_note_number && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>Delivery note: {entry.delivery_note_number}</span>
                        </div>
                      )}
                      {entry.invoice_file_path && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="justify-start h-auto py-1 px-2"
                          onClick={() => handleDownload(entry.invoice_file_path, `invoice-${entry.invoice_number || entry.id}.pdf`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download invoice
                        </Button>
                      )}
                      {entry.delivery_note_file_path && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="justify-start h-auto py-1 px-2"
                          onClick={() => handleDownload(entry.delivery_note_file_path, `delivery-note-${entry.delivery_note_number || entry.id}.pdf`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download delivery note
                        </Button>
                      )}
                    </div>
                  )}

                  {entry.notes && (
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  )}

                  <div className="space-y-1">
                    {entry.stock_movements.map((movement, idx) => (
                      <div key={`${entry.id}-${movement.product_id}-${idx}`} className="flex items-center justify-between text-sm p-2 border rounded">
                        <span>{movement.products?.name || "Unknown Product"}</span>
                        <Badge variant="outline">+{movement.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
