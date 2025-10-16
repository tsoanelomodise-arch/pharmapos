import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, Printer, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ReceiptDialogProps {
  saleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDialog({ saleId, open, onOpenChange }: ReceiptDialogProps) {
  const { data: saleData, isLoading } = useQuery({
    queryKey: ['sale-receipt', saleId],
    queryFn: async () => {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            products (
              name,
              generic_name
            )
          ),
          customers (
            name,
            phone
          )
        `)
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      // Fetch processor profile if processed_by exists
      let processorName = 'N/A';
      if (sale.processed_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', sale.processed_by)
          .single();
        
        if (profile?.full_name) {
          processorName = profile.full_name;
        }
      }

      return { ...sale, processor_name: processorName };
    },
    enabled: open && !!saleId
  });

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt #${saleData?.id.slice(-8)}</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .line { display: flex; justify-content: space-between; margin: 5px 0; }
                .separator { border-top: 1px dashed #000; margin: 10px 0; }
                .total { font-weight: bold; font-size: 14px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    toast({ title: "Download started", description: "Receipt PDF is being generated..." });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Loading Receipt...
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!saleData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt #{saleData.id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="receipt space-y-4">
          <div className="header text-center">
            <h2 className="text-lg font-bold">PHARMACY POS</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(saleData.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Transaction #{saleData.id.slice(-8)}
            </p>
          </div>

          <Separator />

          {saleData.customers && (
            <div className="customer-info">
              <h3 className="font-medium">Customer:</h3>
              <p>{saleData.customers.name}</p>
              {saleData.customers.phone && <p>{saleData.customers.phone}</p>}
            </div>
          )}

          <div className="items space-y-2">
            <h3 className="font-medium">Items:</h3>
            {saleData.sale_items?.map((item: any) => (
              <div key={item.id} className="line text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.products?.name || 'Unknown Item'}</p>
                  <p className="text-muted-foreground">
                    {item.quantity} × R{item.unit_price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p>R{item.total_price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="totals space-y-1">
            <div className="line text-sm">
              <span>Subtotal:</span>
              <span>R{(saleData.total_amount - saleData.tax_amount + saleData.discount_amount).toFixed(2)}</span>
            </div>
            {saleData.discount_amount > 0 && (
              <div className="line text-sm">
                <span>Discount:</span>
                <span>-R{saleData.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="line text-sm">
              <span>VAT (15%):</span>
              <span>R{saleData.tax_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="line total">
              <span>TOTAL:</span>
              <span>R{saleData.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-info space-y-1">
            <div className="line text-sm">
              <span><strong>Payment Method:</strong></span>
              <span>{saleData.payment_method.toUpperCase()}</span>
            </div>
            {saleData.payment_method === 'cash' && saleData.cash_paid && (
              <>
                <div className="line text-sm">
                  <span>Cash Paid:</span>
                  <span>R{saleData.cash_paid.toFixed(2)}</span>
                </div>
                {saleData.change_given !== undefined && saleData.change_given > 0 && (
                  <div className="line text-sm font-medium">
                    <span>Change Given:</span>
                    <span>R{saleData.change_given.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="line text-sm">
              <span><strong>Status:</strong></span>
              <span>{saleData.payment_status.toUpperCase()}</span>
            </div>
            <div className="line text-sm">
              <span><strong>Processed By:</strong></span>
              <span>{saleData.processor_name}</span>
            </div>
          </div>

          {saleData.notes && (
            <div className="notes">
              <p className="text-xs text-muted-foreground">Notes: {saleData.notes}</p>
            </div>
          )}

          <div className="footer text-center text-xs text-muted-foreground">
            <p>Thank you for your business!</p>
            <p>Please keep this receipt for your records</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}