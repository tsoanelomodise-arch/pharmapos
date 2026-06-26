import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, Printer, Download, RotateCcw, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { useCreditSaleMutation } from "@/hooks/useCreditSale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ReceiptDialogProps {
  saleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDialog({ saleId, open, onOpenChange }: ReceiptDialogProps) {
  const { data: businessSettings } = useBusinessSettings();
  const { data: role } = useUserRole();
  const canCredit = role === 'admin' || role === 'owner';
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
        } else {
          // Fallback: try to get email from auth user
          const { data: { user } } = await supabase.auth.admin.getUserById(sale.processed_by);
          if (user?.email) {
            // Extract name from email (before @)
            processorName = user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      }

      return { ...sale, processor_name: processorName };
    },
    enabled: open && !!saleId
  });

  const { data: creditedByProduct } = useQuery({
    queryKey: ['sale-receipt-credited', saleId],
    enabled: open && !!saleId && canCredit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('id, sale_items(product_id, quantity)')
        .eq('credit_note_for', saleId);
      if (error) throw error;
      const map = new Map<string, number>();
      for (const cn of (data ?? []) as any[]) {
        for (const si of cn.sale_items ?? []) {
          map.set(si.product_id, (map.get(si.product_id) ?? 0) + Math.abs(si.quantity));
        }
      }
      return map;
    },
  });

  const { data: creditNotes } = useQuery({
    queryKey: ['sale-receipt-credit-notes', saleId],
    enabled: open && !!saleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('id, created_at, credit_reason, total_amount, sale_items(quantity, unit_price, total_price, products(name))')
        .eq('credit_note_for', saleId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Build the print document via DOM APIs and clone the rendered tree
        // instead of serialising/re-parsing HTML strings. This avoids XSS risk
        // if any future dynamic, unescaped content is added to the receipt.
        const doc = printWindow.document;
        doc.open();
        doc.write('<!DOCTYPE html>');
        doc.close();

        const titleEl = doc.createElement('title');
        titleEl.textContent = `Receipt #${saleData?.id.slice(-8) ?? ''}`;
        doc.head.appendChild(titleEl);

        const styleEl = doc.createElement('style');
        styleEl.textContent = `
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
          .receipt { max-width: 300px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .line { display: flex; justify-content: space-between; margin: 5px 0; }
          .separator { border-top: 1px dashed #000; margin: 10px 0; }
          .total { font-weight: bold; font-size: 14px; }
        `;
        doc.head.appendChild(styleEl);

        const clone = printContent.cloneNode(true);
        doc.body.appendChild(doc.importNode(clone, true));

        printWindow.print();
      }
    }
  };

  const handleDownload = async () => {
    if (!saleData) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: [80, 297] });
      const left = 4;
      let y = 6;
      const lineH = 4;
      const pageW = 80;

      const writeCentered = (text: string, size = 9, bold = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.text(text, pageW / 2, y, { align: "center" });
        y += lineH;
      };
      const writeLine = (text: string, size = 8, bold = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        const wrapped = doc.splitTextToSize(text, pageW - left * 2);
        wrapped.forEach((w: string) => { doc.text(w, left, y); y += lineH; });
      };
      const writeRow = (l: string, r: string, size = 8, bold = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.text(l, left, y);
        doc.text(r, pageW - left, y, { align: "right" });
        y += lineH;
      };
      const hr = () => { doc.setLineDashPattern([0.5, 0.5], 0); doc.line(left, y, pageW - left, y); y += 2; };

      writeCentered(businessSettings?.pharmacy_name || "PHARMACY POS", 11, true);
      if (businessSettings?.address) businessSettings.address.split("\n").forEach((l: string) => writeCentered(l, 7));
      if (businessSettings?.phone) writeCentered(`Tel: ${businessSettings.phone}`, 7);
      y += 1;
      writeCentered(new Date(saleData.created_at).toLocaleString(), 7);
      writeCentered(`Transaction #${saleData.id.slice(-8)}`, 7);
      y += 1; hr();

      if (saleData.customers) {
        writeLine(`Patient: ${saleData.customers.name}`, 8);
        if (saleData.customers.phone) writeLine(`Phone: ${saleData.customers.phone}`, 8);
        hr();
      }

      (saleData.sale_items ?? []).forEach((it: any) => {
        writeLine(it.products?.name ?? "Item", 8, true);
        writeRow(`  ${it.quantity} x R${Number(it.unit_price).toFixed(2)}`, `R${Number(it.total_price).toFixed(2)}`, 8);
      });
      hr();

      if (saleData.discount_amount) writeRow("Discount", `-R${Number(saleData.discount_amount).toFixed(2)}`);
      if (saleData.tax_amount) writeRow("VAT", `R${Number(saleData.tax_amount).toFixed(2)}`);
      writeRow("TOTAL", `R${Number(saleData.total_amount).toFixed(2)}`, 10, true);
      writeRow("Payment", String(saleData.payment_method ?? "").toUpperCase());
      if (saleData.cash_paid != null) writeRow("Paid", `R${Number(saleData.cash_paid).toFixed(2)}`);
      if (saleData.change_given) writeRow("Change", `R${Number(saleData.change_given).toFixed(2)}`);
      hr();
      writeCentered(`Served by: ${saleData.processor_name}`, 7);
      writeCentered("Thank you for your business!", 8);

      doc.save(`receipt-${saleData.id.slice(-8)}.pdf`);
      toast({ title: "Receipt downloaded", description: "PDF saved successfully." });
    } catch (err: any) {
      console.error("Receipt download failed", err);
      toast({ title: "Download failed", description: err?.message ?? "Could not generate PDF", variant: "destructive" });
    }
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
            <h2 className="text-lg font-bold">{businessSettings?.pharmacy_name || 'PHARMACY POS'}</h2>
            {businessSettings?.address && (
              <p className="text-xs text-muted-foreground whitespace-pre-line">{businessSettings.address}</p>
            )}
            {businessSettings?.phone && (
              <p className="text-xs text-muted-foreground">Tel: {businessSettings.phone}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
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
            {saleData.sale_items?.map((item: any) => {
              const alreadyCredited = creditedByProduct?.get(item.product_id) ?? 0;
              const remaining = item.quantity - alreadyCredited;
              const showCredit =
                canCredit &&
                !saleData.credit_note_for &&
                saleData.payment_status !== 'credited' &&
                remaining > 0;
              return (
                <div key={item.id} className="line text-sm flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.products?.name || 'Unknown Item'}</p>
                    <p className="text-muted-foreground">
                      {item.quantity} × R{item.unit_price.toFixed(2)}
                      {alreadyCredited > 0 && (
                        <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                          Credited {alreadyCredited}
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p>R{item.total_price.toFixed(2)}</p>
                    {showCredit && (
                      <CreditLineButton
                        saleId={saleData.id}
                        saleItemId={item.id}
                        name={item.products?.name || 'Item'}
                        unitPrice={Number(item.unit_price)}
                        remaining={remaining}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="totals space-y-1">
            {businessSettings?.vat_inclusive ? (
              <>
                {saleData.discount_amount > 0 && (
                  <div className="line text-sm">
                    <span>Discount:</span>
                    <span>-R{saleData.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="line total">
                  <span>TOTAL (VAT Incl.):</span>
                  <span>R{saleData.total_amount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  Includes R{saleData.tax_amount.toFixed(2)} VAT ({businessSettings?.vat_rate ?? 15}%)
                </p>
              </>
            ) : (
              <>
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
                  <span>VAT ({businessSettings?.vat_rate ?? 15}%):</span>
                  <span>R{saleData.tax_amount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="line total">
                  <span>TOTAL:</span>
                  <span>R{saleData.total_amount.toFixed(2)}</span>
                </div>
              </>
            )}
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

          {creditNotes && creditNotes.length > 0 && (
            <>
              <Separator />
              <div className="credit-notes space-y-2">
                <h3 className="font-medium text-destructive">Credit Notes</h3>
                {creditNotes.map((cn: any) => (
                  <div key={cn.id} className="text-xs border border-dashed border-destructive/40 rounded p-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {new Date(cn.created_at).toLocaleString()}
                      </span>
                      <span className="font-medium text-destructive">
                        R{Number(cn.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {(cn.sale_items ?? []).map((si: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {Math.abs(si.quantity)} × {si.products?.name ?? 'Item'}
                          </span>
                          <span>R{Number(si.total_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {cn.credit_reason && (
                      <p className="italic text-muted-foreground">
                        Reason: {cn.credit_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="footer text-center text-xs text-muted-foreground">
            {businessSettings?.vat_number && (
              <p className="mb-2">VAT No: {businessSettings.vat_number}</p>
            )}
            <p>Thank you for your business!</p>
            <p>Please keep this receipt for your records</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" onClick={handlePrint} className="flex-1 min-w-[100px]">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1 min-w-[100px]">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CreditLineButtonProps {
  saleId: string;
  saleItemId: string;
  name: string;
  unitPrice: number;
  remaining: number;
}

function CreditLineButton({ saleId, saleItemId, name, unitPrice, remaining }: CreditLineButtonProps) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const credit = useCreditSaleMutation();

  const canSubmit = qty > 0 && qty <= remaining && reason.trim().length >= 3 && !credit.isPending;

  const handleConfirm = () => {
    credit.mutate(
      { saleId, reason: reason.trim(), items: [{ saleItemId, quantity: qty }] },
      {
        onSuccess: () => {
          setOpen(false);
          setQty(1);
          setReason("");
        },
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="mt-1 h-7 px-2 text-xs text-destructive hover:text-destructive">
          <RotateCcw className="mr-1 h-3 w-3" />
          Credit
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div>
          <p className="font-medium text-sm truncate">{name}</p>
          <p className="text-xs text-muted-foreground">
            R{unitPrice.toFixed(2)} · Remaining {remaining}
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`qty-${saleItemId}`} className="text-xs">
            Quantity (max {remaining})
          </Label>
          <Input
            id={`qty-${saleItemId}`}
            type="number"
            min={1}
            max={remaining}
            value={qty}
            onChange={(e) =>
              setQty(Math.max(1, Math.min(remaining, Math.floor(Number(e.target.value) || 1))))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`reason-${saleItemId}`} className="text-xs">
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={`reason-${saleItemId}`}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Wrong item dispensed"
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Refund</span>
          <span className="font-medium text-destructive">
            - R{(qty * unitPrice).toFixed(2)}
          </span>
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" disabled={!canSubmit} onClick={handleConfirm}>
            {credit.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Confirm Credit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}